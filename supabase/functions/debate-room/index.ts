// Multi-Agent Debate Room edge function
// Runs 4 personas through N rounds, then synthesizes a verdict.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PERSONAS = [
  {
    id: "skeptic",
    name: "The Skeptic",
    role: "Stress-tests every assumption. Surfaces hidden risks, failure modes, and what could go catastrophically wrong.",
  },
  {
    id: "optimist",
    name: "The Optimist",
    role: "Identifies upside, momentum, second-order benefits, and the boldest version of the win.",
  },
  {
    id: "engineer",
    name: "The Engineer",
    role: "Focuses on feasibility, cost, sequencing, dependencies, and concrete execution mechanics.",
  },
  {
    id: "strategist",
    name: "The Strategist",
    role: "Frames the long-game: leverage, positioning, opportunity cost, and tradeoffs against alternatives.",
  },
];

async function callAI(messages: any[], tools?: any[], tool_choice?: any) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const body: any = {
    model: "google/gemini-2.5-flash",
    messages,
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = tool_choice;
  }

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI gateway ${r.status}: ${t}`);
  }
  return await r.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { problem, rounds = 2 } = await req.json();
    if (!problem || typeof problem !== "string" || problem.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Provide a problem (min 10 chars)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const numRounds = Math.min(Math.max(Number(rounds) || 2, 1), 3);

    const transcript: { persona: string; name: string; round: number; content: string }[] = [];

    for (let r = 1; r <= numRounds; r++) {
      for (const p of PERSONAS) {
        const priorContext = transcript.length
          ? `\n\nPRIOR DEBATE TRANSCRIPT:\n${transcript
              .map((t) => `[Round ${t.round} – ${t.name}]: ${t.content}`)
              .join("\n\n")}`
          : "";

        const sys = `You are "${p.name}" in a structured problem-solving debate.
ROLE: ${p.role}
RULES:
- Be ruthless, specific, and concise (max 120 words).
- ${r > 1 ? "Directly address and challenge points raised by other personas in prior rounds." : "Open with your sharpest single insight."}
- No hedging. No lists longer than 3 bullets. No restating the problem.`;

        const user = `PROBLEM:\n${problem}${priorContext}\n\nDeliver your Round ${r} contribution as ${p.name}.`;

        const res = await callAI([
          { role: "system", content: sys },
          { role: "user", content: user },
        ]);
        const content = res.choices?.[0]?.message?.content?.trim() || "(no response)";
        transcript.push({ persona: p.id, name: p.name, round: r, content });
      }
    }

    // Synthesize verdict via tool calling for structured output
    const verdictTools = [
      {
        type: "function",
        function: {
          name: "render_verdict",
          description: "Render the final verdict from the debate.",
          parameters: {
            type: "object",
            properties: {
              verdict: { type: "string", description: "1-2 sentence ruthless verdict." },
              recommended_action: { type: "string", description: "The single highest-leverage next move." },
              confidence: { type: "number", description: "0-100 confidence." },
              key_risks: { type: "array", items: { type: "string" }, maxItems: 4 },
              winning_argument: { type: "string", description: "Which persona's argument carried most weight and why." },
              consensus_points: { type: "array", items: { type: "string" }, maxItems: 4 },
              dissent_points: { type: "array", items: { type: "string" }, maxItems: 3 },
            },
            required: [
              "verdict",
              "recommended_action",
              "confidence",
              "key_risks",
              "winning_argument",
              "consensus_points",
              "dissent_points",
            ],
            additionalProperties: false,
          },
        },
      },
    ];

    const synthMessages = [
      {
        role: "system",
        content:
          "You are the impartial Moderator. Synthesize the debate into a ruthless, decision-ready verdict. Favor clarity over balance.",
      },
      {
        role: "user",
        content: `PROBLEM:\n${problem}\n\nFULL TRANSCRIPT:\n${transcript
          .map((t) => `[Round ${t.round} – ${t.name}]: ${t.content}`)
          .join("\n\n")}\n\nProduce the verdict.`,
      },
    ];

    const synth = await callAI(synthMessages, verdictTools, {
      type: "function",
      function: { name: "render_verdict" },
    });

    const toolCall = synth.choices?.[0]?.message?.tool_calls?.[0];
    const verdict = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(
      JSON.stringify({ transcript, verdict, personas: PERSONAS }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("debate-room error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
