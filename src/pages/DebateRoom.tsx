import { useState } from "react";
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
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PERSONA_META: Record<
  string,
  { icon: any; color: string; ring: string; bg: string }
> = {
  skeptic: {
    icon: ShieldAlert,
    color: "text-red-400",
    ring: "ring-red-500/40",
    bg: "from-red-500/10 to-transparent",
  },
  optimist: {
    icon: Sparkles,
    color: "text-emerald-400",
    ring: "ring-emerald-500/40",
    bg: "from-emerald-500/10 to-transparent",
  },
  engineer: {
    icon: Wrench,
    color: "text-amber-400",
    ring: "ring-amber-500/40",
    bg: "from-amber-500/10 to-transparent",
  },
  strategist: {
    icon: Compass,
    color: "text-primary",
    ring: "ring-primary/40",
    bg: "from-primary/10 to-transparent",
  },
};

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

export default function DebateRoom() {
  const [problem, setProblem] = useState("");
  const [rounds, setRounds] = useState(2);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

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
          className="space-y-3"
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
        </motion.div>

        {/* Persona overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: "skeptic", name: "Skeptic", desc: "Hunts failure modes" },
            { id: "optimist", name: "Optimist", desc: "Maximizes upside" },
            { id: "engineer", name: "Engineer", desc: "Owns feasibility" },
            { id: "strategist", name: "Strategist", desc: "Plays the long game" },
          ].map((p) => {
            const meta = PERSONA_META[p.id];
            const Icon = meta.icon;
            return (
              <Card
                key={p.id}
                className={`bg-gradient-to-br ${meta.bg} border-border/50 backdrop-blur-2xl`}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Input */}
        <Card className="bg-card/50 backdrop-blur-2xl border-border/50">
          <CardHeader>
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
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      Confidence {verdict.confidence}%
                    </Badge>
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

        {/* Transcript */}
        {Object.keys(groupedByRound).length > 0 && (
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
