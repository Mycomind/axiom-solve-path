import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_PROMPTS: Record<string, string> = {
  openclaw: `You are generating an OpenClaw STRATOS-style agent system. The user has a structured problem profile from a problem-solving platform. Transform their data into 8 markdown files following the STRATOS architecture:

1. **SOUL.md** — The core identity and purpose of this agent. Define its mission based on the user's problem statement and desired outcome. Include the agent's personality, decision philosophy, and operating principles. This is the "why" of the agent.

2. **DIAGNOSTIC.md** — The entry point diagnostic. Create a structured intake questionnaire (8-12 questions) specific to this problem domain. Define scoring logic across 4 composite metrics relevant to the problem. Include routing outcomes that map scores to module paths. Use the problem's root causes and symptoms to inform the diagnostic questions.

3. **AGENTS.md** — Define the agent roster (S0-S9 state engine). Map each state to a specific role:
   - S0: Intake (uses DIAGNOSTIC.md)
   - S1: Objective Decomposition (breaks down the desired outcome)
   - S2: Constraint Mapper (uses the problem's constraints and assumptions)
   - S3: Leverage Identifier (uses root causes to find highest-impact actions)
   - S4: Path Scorer (scores solutions using the solution scores from the data)
   - S5: Execution Architect (uses the task/execution plan data)
   - S6: Optimization Monitor (uses KPI data)
   - S7: Scale Readiness
   - S8: Governance Audit
   - S9: Memory Updater / Learning Loop

4. **MODULES.md** — Define executable modules (M0.1 through M8.1+). Each module should be a concrete action the agent can take, mapped to the problem's solutions and tasks. Include input requirements, output format, and success criteria for each module.

5. **MEMORY.md** — Define the Memory Spine structure. Create memory slots populated with the user's actual data:
   - PROFILE: From problem context
   - OBJECTIVES: From desired outcome
   - CONSTRAINTS: From constraints and assumptions
   - LEVERAGE_MAP: From root causes
   - STRATEGIES: From solutions with scores
   - EXECUTIONS: From tasks
   - KPIS: From KPI data
   - FAILURES: Initialize from symptoms
   - GOV_LOGS: Initialize empty

6. **HEARTBEAT.md** — Define the monitoring dashboard and health check system. Use the KPI data to create specific monitoring rules, alert thresholds, and automated response triggers. Include the monitoring cadence and escalation paths.

7. **USER.md** — A user configuration file pre-filled with context from the problem profile. Include the user's role context, business model context, current situation, and preferences derived from the problem data.

8. **PLAYBOOK.md** — A step-by-step usage guide specific to this problem. Define phases, commands, and expected outcomes. Include the recommended module execution path based on the problem's priority and root causes.

Each file must be complete, production-ready markdown that can be directly loaded into OpenClaw. Use the actual data from the problem profile — do not use placeholders.`,

  chatgpt: `Generate 3 files for a ChatGPT Custom GPT configuration:

1. **system-prompt.md** — A comprehensive system prompt that turns ChatGPT into an expert assistant for this specific problem domain. Include the problem context, constraints, root causes, and solution strategies as background knowledge. Define the GPT's personality, expertise areas, and response format.

2. **conversation-starters.md** — 6-8 conversation starters that guide users through the problem-solving process. Each starter should address a different aspect: diagnosis, root cause analysis, solution evaluation, execution planning, risk monitoring, and optimization.

3. **knowledge-base.md** — A structured knowledge document containing all the problem data, solutions, tasks, and KPIs formatted as reference material the GPT can draw from during conversations.`,

  claude: `Generate 2 files for a Claude Projects configuration:

1. **project-instructions.md** — Comprehensive project instructions that give Claude full context about this problem domain. Include the problem analysis, root causes, constraints, solution strategies, execution plans, and KPIs. Define how Claude should reason about this problem space and what frameworks to apply.

2. **context-docs.md** — A structured context document with all problem data organized for quick reference. Include decision matrices, risk assessments, and progress tracking templates.`,

  cursor: `Generate 1 file for Cursor/Windsurf:

1. **.cursorrules** — A comprehensive rules file that configures the AI coding assistant to work on solving this problem through code. Include the problem context, technical constraints, solution architecture, coding standards, and specific implementation guidelines. Format as a .cursorrules file with clear sections.`,

  autogpt: `Generate 2 files for AutoGPT/CrewAI multi-agent configuration:

1. **agents.yaml** — Define a team of AI agents, each specialized for a different aspect of this problem. Include agent names, roles, goals, backstories, and capabilities derived from the problem's root causes and solutions.

2. **tasks.yaml** — Define a sequence of tasks mapped to the execution plan. Each task should specify the assigned agent, description, expected output, and dependencies.`,

  generic: `Generate 1 comprehensive file:

1. **prompt-system.md** — A universal prompt system that works with any AI assistant. Include a system prompt section, structured context section with all problem data, a decision framework section, and a set of reusable prompt templates for different phases of problem-solving (diagnosis, solution generation, execution planning, monitoring, optimization).`
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { problemId, platform } = await req.json();
    if (!problemId || !platform) {
      return new Response(JSON.stringify({ error: "problemId and platform are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!PLATFORM_PROMPTS[platform]) {
      return new Response(JSON.stringify({ error: `Unsupported platform: ${platform}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Fetch problem with related data
    const { data: problem, error: problemError } = await supabase
      .from("problems").select("*").eq("id", problemId).single();
    if (problemError || !problem) {
      return new Response(JSON.stringify({ error: "Problem not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const [solutionsRes, tasksRes, kpisRes] = await Promise.all([
      supabase.from("solutions").select("*").eq("problem_id", problemId),
      supabase.from("solutions").select("id").eq("problem_id", problemId).then(async (res) => {
        if (!res.data?.length) return { data: [] };
        const solutionIds = res.data.map((s: any) => s.id);
        return supabase.from("tasks").select("*").in("solution_id", solutionIds);
      }),
      supabase.from("kpis").select("*").eq("problem_id", problemId),
    ]);

    const problemProfile = {
      title: problem.title,
      problem_statement: problem.problem_statement,
      context_constraints: problem.context_constraints,
      desired_outcome: problem.desired_outcome,
      stakeholders: problem.stakeholders,
      current_attempts: problem.current_attempts,
      status: problem.status,
      priority_score: problem.priority_score,
      impact_score: problem.impact_score,
      symptoms: problem.symptoms,
      root_causes: problem.root_causes,
      assumptions: problem.assumptions,
      constraints: problem.constraints,
      solutions: solutionsRes.data || [],
      tasks: tasksRes.data || [],
      kpis: kpisRes.data || [],
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const platformPrompt = PLATFORM_PROMPTS[platform];

    const fileListByPlatform: Record<string, string[]> = {
      openclaw: ["SOUL.md", "DIAGNOSTIC.md", "AGENTS.md", "MODULES.md", "MEMORY.md", "HEARTBEAT.md", "USER.md", "PLAYBOOK.md"],
      chatgpt: ["system-prompt.md", "conversation-starters.md", "knowledge-base.md"],
      claude: ["project-instructions.md", "context-docs.md"],
      cursor: [".cursorrules"],
      autogpt: ["agents.yaml", "tasks.yaml"],
      generic: ["prompt-system.md"],
    };

    const expectedFiles = fileListByPlatform[platform];

    const systemPrompt = `You are an expert AI prompt engineer and agent architect. Your job is to transform structured problem data into production-ready prompt systems for specific AI platforms.

${platformPrompt}

CRITICAL INSTRUCTIONS:
- Use the actual problem data provided — never use generic placeholders like [INSERT HERE]
- Each file must be complete and self-contained
- Output must be valid markdown (or yaml for AutoGPT)
- Be specific, detailed, and actionable

You MUST call the output_files function with all generated files.`;

    const userPrompt = `Here is the complete problem profile to transform:

${JSON.stringify(problemProfile, null, 2)}

Generate all required files for the "${platform}" platform. Each file should be deeply customized using this specific problem data.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "output_files",
            description: "Output all generated files for the selected platform",
            parameters: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "File name including extension" },
                      content: { type: "string", description: "Complete file content" }
                    },
                    required: ["name", "content"],
                    additionalProperties: false
                  }
                }
              },
              required: ["files"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "output_files" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "AI did not return structured output" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      files: parsed.files,
      platform,
      problemTitle: problem.title,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("generate-ai-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
