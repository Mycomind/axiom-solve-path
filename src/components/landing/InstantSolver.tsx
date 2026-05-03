import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, AlertTriangle, Target, ArrowRight, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Solution = {
  summary: string;
  rootCause: string;
  nextSteps: string[];
  risks?: string[];
  expectedOutcome: string;
  confidence: number;
};

const EXAMPLES = [
  'My team keeps missing sprint deadlines',
  'Customer churn jumped 18% last quarter',
  'I can\'t focus and my output is dropping',
];

export default function InstantSolver() {
  const navigate = useNavigate();
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<Solution | null>(null);

  const solve = async () => {
    if (problem.trim().length < 10) {
      toast.error('Add a little more detail (10+ characters).');
      return;
    }
    setLoading(true);
    setSolution(null);
    try {
      const { data, error } = await supabase.functions.invoke('instant-solve', {
        body: { problem: problem.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSolution(data.solution);
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not generate a solution. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSolution(null);
    setProblem('');
  };

  return (
    <section id="instant-solver" className="relative z-10 py-20 scroll-mt-24">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-xl mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-wider uppercase">Try it free — no signup</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-3">
            Type a problem. <span className="gradient-text">Get a solution.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            One field. One click. A ruthless, structured plan in seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/40 via-primary/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative bg-card/40 backdrop-blur-2xl border border-border/30 rounded-2xl p-5 sm:p-7">
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Describe the problem you're stuck on…"
              rows={4}
              maxLength={2000}
              disabled={loading}
              className="w-full bg-background/40 border border-border/30 rounded-xl p-4 text-sm md:text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 resize-none transition-all"
            />

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setProblem(ex)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted/40 hover:bg-muted/70 border border-border/30 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              <Button
                onClick={solve}
                disabled={loading || problem.trim().length < 10}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0 shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Solving…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Solve Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {solution && (
            <motion.div
              key="solution"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 relative group"
            >
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/30 via-transparent to-transparent opacity-70" />
              <div className="relative bg-card/50 backdrop-blur-2xl border border-border/30 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Solution</p>
                      <p className="text-xs text-primary font-semibold">Confidence: {Math.round(solution.confidence)}%</p>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    New problem
                  </button>
                </div>

                <p className="text-base md:text-lg leading-relaxed font-medium">{solution.summary}</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background/40 border border-border/30">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" /> Root Cause
                    </p>
                    <p className="text-sm leading-relaxed">{solution.rootCause}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/40 border border-border/30">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> Expected Outcome
                    </p>
                    <p className="text-sm leading-relaxed">{solution.expectedOutcome}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Do these today</p>
                  <ul className="space-y-2">
                    {solution.nextSteps.map((step, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-background/30 border border-border/20"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-sm leading-relaxed">{step}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {solution.risks && solution.risks.length > 0 && (
                  <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                    <p className="text-xs uppercase tracking-wider text-destructive mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Watch For
                    </p>
                    <ul className="space-y-1.5">
                      {solution.risks.map((r, i) => (
                        <li key={i} className="text-sm text-muted-foreground leading-relaxed">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-3 border-t border-border/20">
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex-1"
                  >
                    Save & go deeper
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="border-border/40"
                  >
                    Solve another
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
