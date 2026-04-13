import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RootCauseSchema = z.object({
  description: z.string().max(500).optional(),
  type: z.string().max(50).optional(),
  confidence: z.number().min(0).max(100).optional(),
}).passthrough();

const ProblemSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  problem_statement: z.string().min(1).max(5000).trim(),
  context_constraints: z.string().max(3000).optional().nullable(),
  desired_outcome: z.string().min(1).max(2000).trim(),
  symptoms: z.array(z.string().max(500)).max(50).optional().nullable(),
  root_causes: z.union([z.array(RootCauseSchema).max(50), z.string().max(10000)]).optional().nullable(),
  assumptions: z.array(z.string().max(500)).max(50).optional().nullable(),
  constraints: z.array(z.string().max(500)).max(50).optional().nullable(),
  priority_score: z.number().min(0).max(10).optional().nullable(),
  impact_score: z.number().min(0).max(10).optional().nullable(),
}).passthrough();

const InputSchema = z.object({
  problemId: z.string().uuid(),
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

    const { problemId, problem } = parsed.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating solutions for problem:", problem.title);

    const systemPrompt = `You are a strategic solution architect for the "Ruthless Problem Solver OS" - an enterprise system that generates and evaluates solutions with surgical precision.

Your task is to generate 3-5 viable solutions for the given problem profile, then:
1. Apply elimination rules - remove solutions that rely on unverified assumptions, unsolvable constraints, or don't address root causes
2. Score each solution on 6 dimensions (1-10 scale):
   - Effectiveness: How well does it solve the root causes?
   - Speed: How quickly can it be implemented?
   - Cost: Resource efficiency (higher score = lower cost)
   - Risk: Safety and predictability (higher score = lower risk)
   - Reversibility: Can we undo if it fails?
   - Leverage: Does it create compounding benefits?
3. Identify second-order effects for top solutions
4. Calculate total score as weighted average

Be ruthless. Only viable, actionable solutions survive. Mark eliminated solutions with clear reasons.`;

    const userPrompt = `Generate solutions for this Problem Profile:

TITLE: ${problem.title}

PROBLEM STATEMENT:
${problem.problem_statement}

CONTEXT & CONSTRAINTS:
${problem.context_constraints || 'Not specified'}

DESIRED OUTCOME:
${problem.desired_outcome}

SYMPTOMS:
${problem.symptoms?.join('\n- ') || 'None identified'}

ROOT CAUSES:
${JSON.stringify(problem.root_causes, null, 2)}

ASSUMPTIONS TO VERIFY:
${problem.assumptions?.join('\n- ') || 'None identified'}

CONSTRAINTS:
${problem.constraints?.join('\n- ') || 'None identified'}

PRIORITY SCORE: ${problem.priority_score}/10
IMPACT SCORE: ${problem.impact_score}/10

Generate 3-5 solutions with scores, elimination status, and second-order effects.`;

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
              name: "generate_solutions",
              description: "Generate scored solutions for a problem",
              parameters: {
                type: "object",
                properties: {
                  solutions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Solution title" },
                        description: { type: "string", description: "Detailed solution description" },
                        effectiveness_score: { type: "number", description: "Score 1-10" },
                        speed_score: { type: "number", description: "Score 1-10" },
                        cost_score: { type: "number", description: "Score 1-10 (higher = cheaper)" },
                        risk_score: { type: "number", description: "Score 1-10 (higher = safer)" },
                        reversibility_score: { type: "number", description: "Score 1-10" },
                        leverage_score: { type: "number", description: "Score 1-10" },
                        eliminated: { type: "boolean", description: "Whether solution was eliminated" },
                        elimination_reason: { type: "string", description: "Reason for elimination if applicable" },
                        second_order_effects: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Potential second-order effects"
                        }
                      },
                      required: ["title", "description", "effectiveness_score", "speed_score", "cost_score", "risk_score", "reversibility_score", "leverage_score", "eliminated"]
                    }
                  }
                },
                required: ["solutions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_solutions" } }
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
    if (!toolCall || toolCall.function.name !== "generate_solutions") {
      throw new Error("Invalid AI response format");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    const solutions = result.solutions.map((sol: any) => ({
      ...sol,
      total_score: Math.round(
        (sol.effectiveness_score * 0.25 + 
         sol.speed_score * 0.15 + 
         sol.cost_score * 0.15 + 
         sol.risk_score * 0.2 + 
         sol.reversibility_score * 0.1 + 
         sol.leverage_score * 0.15) * 10
      ) / 10,
      is_selected: false
    })).sort((a: any, b: any) => {
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      return b.total_score - a.total_score;
    });

    return new Response(JSON.stringify({ solutions, problemId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-solutions function:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
