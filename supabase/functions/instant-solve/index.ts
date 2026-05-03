import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const InputSchema = z.object({
  problem: z.string().min(10, "Describe your problem with at least 10 characters").max(2000).trim(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const raw = await req.json().catch(() => ({}));
    const parsed = InputSchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues[0]?.message ?? "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { problem } = parsed.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are the "Ruthless Problem Solver" — an elite strategist that turns vague problems into surgical, actionable solutions in seconds.

Given a single problem statement, produce ONE best solution with:
- A crisp, confident summary (1-2 sentences)
- The single most likely root cause
- 3-5 concrete next steps the user can take TODAY
- 1-2 risks to watch
- An expected outcome

Be direct. No fluff. No disclaimers. Speak with conviction.`;

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
          { role: "user", content: `Problem:\n${problem}\n\nGive me the best solution now.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "instant_solution",
              description: "Return one best solution to the problem",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "1-2 sentence solution summary" },
                  rootCause: { type: "string", description: "Most likely root cause" },
                  nextSteps: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 concrete actions to take today",
                  },
                  risks: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-2 risks to watch",
                  },
                  expectedOutcome: { type: "string", description: "What success looks like" },
                  confidence: { type: "number", description: "Confidence 0-100" },
                },
                required: ["summary", "rootCause", "nextSteps", "expectedOutcome", "confidence"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "instant_solution" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Invalid AI response");
    const solution = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ solution }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("instant-solve error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
