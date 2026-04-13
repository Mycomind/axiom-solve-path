import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const InputSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  problemStatement: z.string().min(1).max(5000).trim(),
  context: z.string().max(3000).optional().default(''),
  desiredOutcome: z.string().min(1).max(2000).trim(),
  currentAttempts: z.string().max(3000).optional(),
  stakeholders: z.array(z.string().max(100)).max(20).optional(),
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

    const { title, problemStatement, context, desiredOutcome, currentAttempts, stakeholders } = parsed.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing problem:", title);

    const systemPrompt = `You are an expert problem analyst for the "Ruthless Problem Solver OS" - an enterprise-grade system that demands ruthless clarity and precision.

Your task is to analyze the provided problem and generate a structured Problem Profile with:
1. Symptoms - Observable indicators of the problem (be specific and measurable)
2. Root Causes - Underlying issues causing the symptoms, categorized by type (process, people, technology, external, resource)
3. Assumptions - Key assumptions that need to be verified
4. Constraints - Confirmed limitations and boundaries
5. Priority Score (1-10) - Based on urgency and strategic importance
6. Impact Score (1-10) - Based on potential business impact

Be ruthless in your analysis. Focus on measurable, actionable insights. Reject vague or incomplete thinking.`;

    const userPrompt = `Analyze this problem:

TITLE: ${title}

PROBLEM STATEMENT:
${problemStatement}

CONTEXT & CONSTRAINTS:
${context}

DESIRED OUTCOME:
${desiredOutcome}

${currentAttempts ? `PREVIOUS ATTEMPTS:\n${currentAttempts}` : ''}

${stakeholders?.length ? `KEY STAKEHOLDERS: ${stakeholders.join(', ')}` : ''}

Generate a comprehensive Problem Profile with symptoms, root causes (with type labels: process, people, technology, external, or resource), assumptions, constraints, priority score, and impact score.`;

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
              name: "generate_problem_profile",
              description: "Generate a structured problem profile with symptoms, root causes, assumptions, and scores",
              parameters: {
                type: "object",
                properties: {
                  symptoms: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of observable symptoms/indicators of the problem"
                  },
                  rootCauses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        type: { 
                          type: "string", 
                          enum: ["process", "people", "technology", "external", "resource"] 
                        },
                        confidence: { 
                          type: "number", 
                          description: "Confidence level 0-100" 
                        }
                      },
                      required: ["description", "type", "confidence"]
                    }
                  },
                  assumptions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key assumptions that need verification"
                  },
                  constraints: {
                    type: "array",
                    items: { type: "string" },
                    description: "Confirmed constraints and limitations"
                  },
                  priorityScore: {
                    type: "number",
                    description: "Priority score from 1-10"
                  },
                  impactScore: {
                    type: "number",
                    description: "Impact score from 1-10"
                  }
                },
                required: ["symptoms", "rootCauses", "assumptions", "constraints", "priorityScore", "impactScore"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_problem_profile" } }
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
    if (!toolCall || toolCall.function.name !== "generate_problem_profile") {
      throw new Error("Invalid AI response format");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-problem function:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
