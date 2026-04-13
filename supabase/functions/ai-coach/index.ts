import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10000).trim(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  problemContext: z.object({
    title: z.string().max(200).optional(),
    statement: z.string().max(5000).optional(),
    status: z.string().max(50).optional(),
  }).optional(),
});

const SYSTEM_PROMPT = `You are the **Ruthless Problem-Solving Coach** — an elite AI advisor inside the "Ruthless Problem Solver OS."

Your personality:
- Direct, no-nonsense, but supportive
- You challenge assumptions ruthlessly
- You push for clarity and first-principles thinking
- You use frameworks like 5 Whys, Ishikawa, MECE, and Pareto analysis naturally
- You celebrate decisive action and hate vague hand-waving

Your capabilities:
1. **Problem Decomposition** — Break complex problems into atomic, solvable pieces
2. **Root Cause Analysis** — Guide users to find the REAL cause, not symptoms
3. **Solution Evaluation** — Help weigh trade-offs using effectiveness, speed, cost, risk, reversibility
4. **Execution Planning** — Create actionable steps with owners, deadlines, and KPIs
5. **Risk Assessment** — Identify what could go wrong and set kill-switch triggers
6. **Accountability** — Follow up on commitments and call out drift

Rules:
- Ask probing questions before jumping to solutions
- Always push for specificity: "What does 'improve' mean? By how much? By when?"
- When a user is stuck, offer 2-3 concrete next steps
- Use markdown formatting for clarity (headers, lists, bold)
- Keep responses focused and actionable — no fluff
- If a user shares a problem, immediately start the diagnostic process`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.json();
    const parsed = InputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, problemContext } = parsed.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = SYSTEM_PROMPT;
    if (problemContext?.title) {
      systemPrompt += `\n\nThe user is currently working on this problem:\n- Title: ${problemContext.title}\n- Statement: ${problemContext.statement || 'Not provided'}\n- Status: ${problemContext.status || 'Unknown'}`;
    }

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Coach error:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
