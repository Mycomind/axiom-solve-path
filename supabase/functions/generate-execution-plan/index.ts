import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SolutionSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(5000).trim(),
  total_score: z.number().min(0).max(10).optional().nullable(),
  second_order_effects: z.array(z.string().max(500)).max(20).optional().nullable(),
}).passthrough();

const ProblemSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  problem_statement: z.string().min(1).max(5000).trim(),
  desired_outcome: z.string().min(1).max(2000).trim(),
  root_causes: z.any().optional().nullable(),
  constraints: z.array(z.string().max(500)).max(50).optional().nullable(),
}).passthrough();

const InputSchema = z.object({
  solutionId: z.string().uuid(),
  solution: SolutionSchema,
  problem: ProblemSchema,
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !data?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Input validation
    const rawBody = await req.json();
    const parsed = InputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { solutionId, solution, problem } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating execution plan for solution:", solution.title);

    const systemPrompt = `You are an execution planning expert for the "Ruthless Problem Solver OS" - an enterprise system that breaks solutions into atomic, trackable tasks.

Your task is to create a comprehensive execution plan that includes:
1. Atomic tasks - each task should be small enough to complete in 1-3 days
2. Logical milestones/phases to group related tasks
3. Task dependencies - which tasks must complete before others
4. Risk levels for each task (low, medium, high, critical)
5. KPI targets and thresholds for measurable tasks
6. Realistic deadlines based on task complexity
7. Owner roles (not specific people, but roles like "Developer", "Designer", "Product Manager")

Rules:
- Only include tasks directly tied to the root causes identified
- Every task must have a clear, measurable outcome
- Tasks should be sequenced optimally for parallel execution where possible
- Flag high-risk tasks that need kill-switch monitoring
- Include buffer time for complex tasks
- Set KPI thresholds that trigger automatic alerts

Generate 8-15 atomic tasks organized into 3-4 milestones.`;

    const userPrompt = `Create an execution plan for this solution:

SOLUTION:
Title: ${solution.title}
Description: ${solution.description}
Total Score: ${solution.total_score}/10

PROBLEM CONTEXT:
Title: ${problem.title}
Problem Statement: ${problem.problem_statement}
Desired Outcome: ${problem.desired_outcome}

ROOT CAUSES TO ADDRESS:
${JSON.stringify(problem.root_causes, null, 2)}

CONSTRAINTS:
${problem.constraints?.join('\n- ') || 'None specified'}

Second-Order Effects to Monitor:
${solution.second_order_effects?.join('\n- ') || 'None identified'}

Generate a detailed execution plan with atomic tasks, milestones, dependencies, and KPIs.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_execution_plan",
              description: "Generate an execution plan with atomic tasks and milestones",
              parameters: {
                type: "object",
                properties: {
                  milestones: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        order: { type: "number" }
                      },
                      required: ["name", "description", "order"]
                    }
                  },
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        milestone: { type: "string" },
                        order_index: { type: "number" },
                        owner: { type: "string" },
                        days_to_complete: { type: "number" },
                        dependencies: { 
                          type: "array", 
                          items: { type: "string" }
                        },
                        risk_level: { 
                          type: "string", 
                          enum: ["low", "medium", "high", "critical"]
                        },
                        kpi_name: { type: "string" },
                        kpi_target: { type: "number" },
                        kpi_threshold: { type: "number" },
                        kpi_unit: { type: "string" }
                      },
                      required: ["title", "description", "milestone", "order_index", "owner", "days_to_complete", "risk_level"]
                    }
                  }
                },
                required: ["milestones", "tasks"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_execution_plan" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_execution_plan") {
      throw new Error("Invalid AI response format");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    const today = new Date();
    const tasksWithDeadlines = result.tasks.map((task: any, index: number) => {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() + (index * 2));
      const deadline = new Date(startDate);
      deadline.setDate(deadline.getDate() + task.days_to_complete);
      
      return {
        ...task,
        deadline: deadline.toISOString(),
        status: 'pending'
      };
    });

    return new Response(JSON.stringify({ 
      milestones: result.milestones,
      tasks: tasksWithDeadlines,
      solutionId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-execution-plan function:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
