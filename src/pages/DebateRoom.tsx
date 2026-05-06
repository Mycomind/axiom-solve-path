import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  ShieldAlert,
  Sparkles,
  Wrench,
  Compass,
  Gavel,
  Loader2,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Share2,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PERSONA_ORDER = ["skeptic", "optimist", "engineer", "strategist"] as const;

const PERSONA_META: Record<
  string,
  { icon: any; name: string; desc: string; color: string; ring: string; bg: string; dot: string }
> = {
  skeptic: {
    icon: ShieldAlert,
    name: "The Skeptic",
    desc: "Hunts failure modes",
    color: "text-red-400",
    ring: "ring-red-500/40",
    bg: "from-red-500/10 to-transparent",
    dot: "bg-red-400",
  },
  optimist: {
    icon: Sparkles,
    name: "The Optimist",
    desc: "Maximizes upside",
    color: "text-emerald-400",
    ring: "ring-emerald-500/40",
    bg: "from-emerald-500/10 to-transparent",
    dot: "bg-emerald-400",
  },
  engineer: {
    icon: Wrench,
    name: "The Engineer",
    desc: "Owns feasibility",
    color: "text-amber-400",
    ring: "ring-amber-500/40",
    bg: "from-amber-500/10 to-transparent",
    dot: "bg-amber-400",
  },
  strategist: {
    icon: Compass,
    name: "The Strategist",
    desc: "Plays the long game",
    color: "text-primary",
    ring: "ring-primary/40",
    bg: "from-primary/10 to-transparent",
    dot: "bg-primary",
  },
};

const EXAMPLES = [
  "SaaS churn jumped 40% after a price hike. Roll back, segment pricing, or double down on retention?",
  "Engineering velocity is dropping. Hire more, refactor the monolith, or cut scope?",
  "Should we open-source our core product to grow adoption, or keep it closed to protect revenue?",
];

interface TranscriptEntry {
  persona: string;
  name: string;
  round: number;
  content: string;
}
interface Verdict {
  verdict: string;
  recommended_action: string;
  confidence: number;
  key_risks: string[];
  winning_argument: string;
  consensus_points: string[];
  dissent_points: string[];
}

const LOADING_STAGES = [
  "Briefing personas",
  "Skeptic stress-testing",
  "Optimist arguing upside",
  "Engineer running feasibility",
  "Strategist weighing leverage",
  "Moderator drafting verdict",
];

export default function DebateRoom() {
  const [problem, setProblem] = useState("");
  const [rounds, setRounds] = useState(2);
  const [loading, setLoading] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  // Hydrate from share URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#d=")) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(hash.slice(3))));
        if (decoded.problem) setProblem(decoded.problem);
        if (decoded.transcript) setTranscript(decoded.transcript);
        if (decoded.verdict) setVerdict(decoded.verdict);
        if (decoded.rounds) setRounds(decoded.rounds);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Cycle loading stages
  useEffect(() => {
    if (!loading) return;
    setStageIdx(0);
    const i = setInterval(() => {
      setStageIdx((s) => (s + 1) % LOADING_STAGES.length);
    }, 1800);
    return () => clearInterval(i);
  }, [loading]);

  const runDebate = async () => {
    if (problem.trim().length < 10) {
      toast.error("Describe your problem in at least 10 characters.");
      return;
    }
    setLoading(true);
    setTranscript([]);
    setVerdict(null);
    try {
      const { data, error } = await supabase.functions.invoke("debate-room", {
        body: { problem, rounds },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTranscript(data.transcript || []);
      setVerdict(data.verdict || null);
      toast.success("Debate concluded. Verdict ready.");
    } catch (e: any) {
      const msg = e?.message || "Debate failed";
      if (msg.includes("429")) toast.error("Rate limited. Try again in a moment.");
      else if (msg.includes("402")) toast.error("AI credits exhausted.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setProblem("");
    setTranscript([]);
    setVerdict(null);
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);
  };

  const buildMarkdown = () => {
    if (!verdict) return "";
    const lines = [
      `# Debate Verdict`,
      ``,
      `**Problem:** ${problem}`,
      ``,
      `## Verdict (${verdict.confidence}% confidence)`,
      verdict.verdict,
      ``,
      `## Recommended Action`,
      verdict.recommended_action,
      ``,
      `## Consensus`,
      ...verdict.consensus_points.map((p) => `- ${p}`),
      ``,
      `## Dissent`,
      ...verdict.dissent_points.map((p) => `- ${p}`),
      ``,
      `## Key Risks`,
      ...verdict.key_risks.map((p) => `- ${p}`),
      ``,
      `## Winning Argument`,
      verdict.winning_argument,
      ``,
      `---`,
      `## Transcript`,
      ...transcript.map((t) => `\n### Round ${t.round} — ${t.name}\n${t.content}`),
    ];
    return lines.join("\n");
  };

  const copyVerdict = async () => {
    await navigator.clipboard.writeText(buildMarkdown());
    toast.success("Verdict copied as markdown");
  };

  const downloadVerdict = () => {
    const blob = new Blob([buildMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debate-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareDebate = async () => {
    if (!verdict) return;
    const payload = btoa(JSON.stringify({ problem, rounds, transcript, verdict }));
    const url = `${window.location.origin}${window.location.pathname}#d=${encodeURIComponent(payload)}`;
    if (url.length > 8000) {
      toast.error("Debate too large to share via link. Download instead.");
      return;
    }
    history.replaceState(null, "", `#d=${encodeURIComponent(payload)}`);
    await navigator.clipboard.writeText(url);
    toast.success("Shareable link copied");
  };

  const groupedByRound = transcript.reduce<Record<number, TranscriptEntry[]>>(
    (acc, e) => {
      (acc[e.round] = acc[e.round] || []).push(e);
      return acc;
    },
    {},
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 ring-1 ring-primary/30 flex items-center justify-center neon-glow">
              <Swords className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Multi-Agent Debate Room</h1>
              <p className="text-muted-foreground">
                Four AI personas argue your problem. A moderator delivers the verdict.
              </p>
            </div>
          </div>
          {(transcript.length > 0 || problem) && !loading && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="w-4 h-4" /> New debate
            </Button>
          )}
        </motion.div>

        {/* Persona overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PERSONA_ORDER.map((id) => {
            const meta = PERSONA_META[id];
            const Icon = meta.icon;
            const isActive =
              loading &&
              LOADING_STAGES[stageIdx]?.toLowerCase().includes(id);
            return (
              <Card
                key={id}
                className={`bg-gradient-to-br ${meta.bg} border-border/50 backdrop-blur-2xl transition-all ${
                  isActive ? `ring-2 ${meta.ring} scale-[1.02]` : ""
                }`}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${meta.color}`} />
                    {isActive && (
                      <span
                        className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${meta.dot} animate-ping`}
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{meta.name.replace("The ", "")}</p>
                    <p className="text-xs text-muted-foreground">{meta.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Input */}
        <Card className="bg-card/50 backdrop-blur-2xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Drop your problem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="e.g. Our SaaS churn jumped 40% after we raised prices. Should we roll back, segment pricing, or double down on retention features?"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={loading}
            />

            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
                <Lightbulb className="w-3 h-3" /> Try:
              </span>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => !loading && setProblem(ex)}
                  disabled={loading}
                  className="text-xs px-2.5 py-1 rounded-full border border-border/60 bg-background/40 hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
                >
                  {ex.slice(0, 48)}…
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rounds:</span>
                {[1, 2, 3].map((n) => (
                  <Button
                    key={n}
                    variant={rounds === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRounds(n)}
                    disabled={loading}
                  >
                    {n}
                  </Button>
                ))}
              </div>
              <Button
                onClick={runDebate}
                disabled={loading}
                size="lg"
                className="neon-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Debating...
                  </>
                ) : (
                  <>
                    <Swords className="w-4 h-4" />
                    Start Debate
                  </>
                )}
              </Button>
            </div>

            {/* Loading stage indicator */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-primary/30 bg-primary/5 p-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={stageIdx}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-foreground/90"
                      >
                        {LOADING_STAGES[stageIdx]}…
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {PERSONA_ORDER.map((id) => {
                      const meta = PERSONA_META[id];
                      return (
                        <div
                          key={id}
                          className="h-1.5 rounded-full bg-border/40 overflow-hidden"
                        >
                          <motion.div
                            className={`h-full ${meta.dot}`}
                            initial={{ width: "0%" }}
                            animate={{ width: ["0%", "100%", "0%"] }}
                            transition={{
                              duration: 2.4,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: PERSONA_ORDER.indexOf(id) * 0.3,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Verdict */}
        <AnimatePresence>
          {verdict && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-br from-primary/15 to-transparent border-primary/40 backdrop-blur-2xl ring-1 ring-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <Gavel className="w-5 h-5 text-primary" />
                      <CardTitle>Moderator's Verdict</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        Confidence {verdict.confidence}%
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={copyVerdict} title="Copy as markdown">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={downloadVerdict} title="Download .md">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={shareDebate} title="Copy share link">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-lg font-medium leading-relaxed">{verdict.verdict}</p>

                  <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
                    <div className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-1">
                          Recommended Action
                        </p>
                        <p className="text-sm">{verdict.recommended_action}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-emerald-400 font-semibold mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Consensus
                      </p>
                      <ul className="space-y-1.5 text-sm">
                        {verdict.consensus_points.map((c, i) => (
                          <li key={i} className="text-muted-foreground">
                            • {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-amber-400 font-semibold mb-2 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Dissent
                      </p>
                      <ul className="space-y-1.5 text-sm">
                        {verdict.dissent_points.map((c, i) => (
                          <li key={i} className="text-muted-foreground">
                            • {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-red-400 font-semibold mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Key Risks
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {verdict.key_risks.map((r, i) => (
                        <Badge key={i} variant="outline" className="border-red-500/40 text-red-300">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                      Winning Argument
                    </p>
                    <p className="text-sm italic text-muted-foreground">
                      {verdict.winning_argument}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton transcript */}
        {loading && (
          <div className="space-y-6">
            {Array.from({ length: rounds }).map((_, r) => (
              <div key={r} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Round {r + 1}
                  </Badge>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {PERSONA_ORDER.map((id) => {
                    const meta = PERSONA_META[id];
                    const Icon = meta.icon;
                    return (
                      <Card
                        key={id}
                        className={`bg-gradient-to-br ${meta.bg} border-border/50 backdrop-blur-2xl`}
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                            <p className="font-semibold text-sm">{meta.name}</p>
                            <span className="ml-auto flex gap-1">
                              {[0, 1, 2].map((d) => (
                                <motion.span
                                  key={d}
                                  className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    delay: d * 0.2,
                                  }}
                                />
                              ))}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-2 rounded bg-border/40 w-full animate-pulse" />
                            <div className="h-2 rounded bg-border/40 w-5/6 animate-pulse" />
                            <div className="h-2 rounded bg-border/40 w-2/3 animate-pulse" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transcript */}
        {!loading && Object.keys(groupedByRound).length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Swords className="w-5 h-5 text-primary" />
              Debate Transcript
            </h2>
            {Object.entries(groupedByRound).map(([round, entries]) => (
              <div key={round} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Round {round}
                  </Badge>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {entries.map((e, i) => {
                    const meta = PERSONA_META[e.persona];
                    const Icon = meta.icon;
                    return (
                      <motion.div
                        key={`${round}-${i}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className={`bg-gradient-to-br ${meta.bg} border-border/50 backdrop-blur-2xl ring-1 ${meta.ring} h-full`}
                        >
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${meta.color}`} />
                              <p className="font-semibold text-sm">{e.name}</p>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {e.content}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
