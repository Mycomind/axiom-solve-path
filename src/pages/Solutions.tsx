import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  Shield,
  RotateCcw,
  Zap,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Solution {
  id?: string;
  title: string;
  description: string;
  effectiveness_score: number;
  speed_score: number;
  cost_score: number;
  risk_score: number;
  reversibility_score: number;
  leverage_score: number;
  total_score: number;
  eliminated: boolean;
  elimination_reason?: string;
  second_order_effects?: string[];
  is_selected: boolean;
}

interface Problem {
  id: string;
  title: string;
  problem_statement: string;
  context_constraints?: string;
  desired_outcome: string;
  symptoms?: string[];
  root_causes?: any;
  assumptions?: string[];
  constraints?: string[];
  priority_score?: number;
  impact_score?: number;
  status: string;
}

const scoreLabels = [
  { key: 'effectiveness_score', label: 'Effectiveness', icon: TrendingUp },
  { key: 'speed_score', label: 'Speed', icon: Clock },
  { key: 'cost_score', label: 'Cost', icon: DollarSign },
  { key: 'risk_score', label: 'Risk', icon: Shield },
  { key: 'reversibility_score', label: 'Reversibility', icon: RotateCcw },
  { key: 'leverage_score', label: 'Leverage', icon: Zap },
];

export default function Solutions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSolution, setSelectedSolution] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);

  // Fetch the latest problem in "solution" or "intake" status
  useEffect(() => {
    const fetchProblem = async () => {
      if (!user) return;
      
      try {
        // Get the most recent problem that needs solutions
        const { data: problemData, error: problemError } = await supabase
          .from('problems')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['intake', 'solution'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (problemError && problemError.code !== 'PGRST116') {
          console.error('Error fetching problem:', problemError);
          toast.error('Failed to load problem');
          return;
        }

        if (problemData) {
          setProblem(problemData);
          
          // Fetch existing solutions for this problem
          const { data: solutionsData, error: solutionsError } = await supabase
            .from('solutions')
            .select('*')
            .eq('problem_id', problemData.id)
            .order('total_score', { ascending: false });

          if (solutionsError) {
            console.error('Error fetching solutions:', solutionsError);
          } else if (solutionsData && solutionsData.length > 0) {
            setSolutions(solutionsData);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [user]);

  const handleGenerate = async () => {
    if (!problem) {
      toast.error('No problem selected. Please complete Step 1 first.');
      return;
    }

    setGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-solutions', {
        body: {
          problemId: problem.id,
          problem: {
            title: problem.title,
            problem_statement: problem.problem_statement,
            context_constraints: problem.context_constraints,
            desired_outcome: problem.desired_outcome,
            symptoms: problem.symptoms,
            root_causes: problem.root_causes,
            assumptions: problem.assumptions,
            constraints: problem.constraints,
            priority_score: problem.priority_score,
            impact_score: problem.impact_score
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate solutions');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.solutions) {
        throw new Error('No solutions returned from AI');
      }

      // Delete existing solutions for this problem
      await supabase
        .from('solutions')
        .delete()
        .eq('problem_id', problem.id);

      // Insert new solutions
      const solutionsToInsert = data.solutions.map((sol: Solution) => ({
        problem_id: problem.id,
        title: sol.title,
        description: sol.description,
        effectiveness_score: sol.effectiveness_score,
        speed_score: sol.speed_score,
        cost_score: sol.cost_score,
        risk_score: sol.risk_score,
        reversibility_score: sol.reversibility_score,
        leverage_score: sol.leverage_score,
        total_score: Math.round(sol.total_score * 10),
        eliminated: sol.eliminated,
        elimination_reason: sol.elimination_reason || null,
        second_order_effects: sol.second_order_effects || [],
        is_selected: false
      }));

      const { data: insertedSolutions, error: insertError } = await supabase
        .from('solutions')
        .insert(solutionsToInsert)
        .select();

      if (insertError) {
        console.error('Error saving solutions:', insertError);
        // Still show solutions even if save fails
        setSolutions(data.solutions);
      } else {
        setSolutions(insertedSolutions || data.solutions);
      }

      // Update problem status
      await supabase
        .from('problems')
        .update({ status: 'solution' })
        .eq('id', problem.id);

      toast.success('Solutions generated and scored!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate solutions');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectSolution = async (solution: Solution, index: number) => {
    if (!problem || !solution.id) {
      setSelectedSolution(String(index));
      toast.success('Solution selected for execution planning!');
      return;
    }

    try {
      // Deselect all solutions first
      await supabase
        .from('solutions')
        .update({ is_selected: false })
        .eq('problem_id', problem.id);

      // Select this solution
      await supabase
        .from('solutions')
        .update({ is_selected: true })
        .eq('id', solution.id);

      // Update problem status to execution
      await supabase
        .from('problems')
        .update({ status: 'execution' })
        .eq('id', problem.id);

      setSolutions(prev => prev.map(s => ({
        ...s,
        is_selected: s.id === solution.id
      })));
      
      setSelectedSolution(String(index));
      toast.success('Solution selected! Proceeding to execution planning.');
      
      // Navigate to execution after a brief delay
      setTimeout(() => navigate('/execution'), 1500);
    } catch (error) {
      console.error('Error selecting solution:', error);
      toast.error('Failed to select solution');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!problem) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Lightbulb className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-4">No Problem to Solve</h2>
          <p className="text-muted-foreground mb-6">
            Complete Step 1: Problem Intake first to define your problem before generating solutions.
          </p>
          <Button onClick={() => navigate('/intake')} className="neon-glow">
            Go to Problem Intake <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-neon-purple/20 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-neon-purple" />
            </div>
            Step 2: Solution Generation
          </motion.h1>
          <p className="text-muted-foreground mt-2">
            AI-generated solutions scored on 6 dimensions. Eliminated options are marked.
          </p>
        </div>

        {/* Problem Context */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <h2 className="text-lg font-semibold">{problem.title}</h2>
              <p className="text-muted-foreground mt-1 line-clamp-2">{problem.problem_statement}</p>
              {problem.priority_score && problem.impact_score && (
                <div className="flex gap-4 mt-3">
                  <span className="text-sm">
                    Priority: <span className="font-semibold text-primary">{problem.priority_score}/10</span>
                  </span>
                  <span className="text-sm">
                    Impact: <span className="font-semibold text-warning">{problem.impact_score}/10</span>
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="neon-glow flex-shrink-0"
            >
              {generating ? (
                <>Generating... <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
              ) : solutions.length > 0 ? (
                <>Regenerate <Sparkles className="w-4 h-4 ml-2" /></>
              ) : (
                <>Generate Solutions <Sparkles className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </motion.div>

        {/* No Solutions State */}
        {solutions.length === 0 && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to Generate Solutions</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Click "Generate Solutions" to have AI analyze your problem and create 3-5 scored solutions based on effectiveness, speed, cost, risk, reversibility, and leverage.
            </p>
          </motion.div>
        )}

        {/* Solutions Grid */}
        {solutions.length > 0 && (
          <div className="grid gap-6">
            {solutions.map((solution, index) => (
              <motion.div
                key={solution.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "glass-card p-6 transition-all duration-300",
                  solution.eliminated && "opacity-60",
                  solution.is_selected && "neon-border",
                  selectedSolution === String(index) && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold",
                      solution.eliminated ? "bg-destructive/20 text-destructive" :
                      solution.is_selected ? "bg-success/20 text-success" :
                      "bg-primary/20 text-primary"
                    )}>
                      {solution.eliminated ? <XCircle className="w-6 h-6" /> :
                       solution.is_selected ? <CheckCircle className="w-6 h-6" /> :
                       index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{solution.title}</h3>
                      {solution.eliminated && solution.elimination_reason && (
                        <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-4 h-4" />
                          Eliminated: {solution.elimination_reason}
                        </p>
                      )}
                      {solution.is_selected && (
                        <p className="text-sm text-success flex items-center gap-1 mt-1">
                          <CheckCircle className="w-4 h-4" />
                          Selected for execution
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text">
                      {typeof solution.total_score === 'number' 
                        ? (solution.total_score > 10 ? (solution.total_score / 10).toFixed(1) : solution.total_score.toFixed(1))
                        : '0'}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Score</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">{solution.description}</p>

                {/* Scores Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {scoreLabels.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="bg-muted/50 rounded-lg p-3 text-center">
                      <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <ScoreBadge score={(solution as any)[key]} />
                    </div>
                  ))}
                </div>

                {/* Second Order Effects */}
                {solution.second_order_effects && solution.second_order_effects.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Second-Order Effects</h4>
                    <div className="flex flex-wrap gap-2">
                      {solution.second_order_effects.map((effect, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-secondary text-sm">
                          {effect}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {!solution.eliminated && !solution.is_selected && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() => handleSelectSolution(solution, index)}
                      className="neon-glow"
                    >
                      Select for Execution <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Legend */}
        {solutions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 p-4 glass-card"
          >
            <h4 className="text-sm font-medium mb-3">Scoring Legend</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="score-badge score-high">8-10</span>
                <span className="text-muted-foreground">Excellent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="score-badge score-medium">4-7</span>
                <span className="text-muted-foreground">Acceptable</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="score-badge score-low">1-3</span>
                <span className="text-muted-foreground">Poor</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
