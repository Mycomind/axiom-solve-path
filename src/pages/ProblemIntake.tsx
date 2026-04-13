import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileQuestion, 
  AlertTriangle, 
  Target, 
  Users, 
  History,
  ChevronRight,
  Plus,
  X,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const problemSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  problemStatement: z.string().min(50, 'Problem statement must be at least 50 characters'),
  context: z.string().min(20, 'Context must be at least 20 characters'),
  desiredOutcome: z.string().min(30, 'Desired outcome must include measurable metrics'),
  currentAttempts: z.string().optional()
});

export default function ProblemIntake() {
  const [step, setStep] = useState(1);
  const [stakeholders, setStakeholders] = useState<string[]>([]);
  const [newStakeholder, setNewStakeholder] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    problemStatement: '',
    context: '',
    desiredOutcome: '',
    currentAttempts: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addStakeholder = () => {
    if (newStakeholder.trim() && !stakeholders.includes(newStakeholder.trim())) {
      setStakeholders([...stakeholders, newStakeholder.trim()]);
      setNewStakeholder('');
    }
  };

  const removeStakeholder = (index: number) => {
    setStakeholders(stakeholders.filter((_, i) => i !== index));
  };

  const validateStep = (stepNum: number) => {
    try {
      if (stepNum === 1) {
        z.object({
          title: problemSchema.shape.title,
          problemStatement: problemSchema.shape.problemStatement
        }).parse({ title: formData.title, problemStatement: formData.problemStatement });
      } else if (stepNum === 2) {
        z.object({
          context: problemSchema.shape.context,
          desiredOutcome: problemSchema.shape.desiredOutcome
        }).parse({ context: formData.context, desiredOutcome: formData.desiredOutcome });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-problem', {
        body: {
          title: formData.title,
          problemStatement: formData.problemStatement,
          context: formData.context,
          desiredOutcome: formData.desiredOutcome,
          currentAttempts: formData.currentAttempts,
          stakeholders
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to analyze problem');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.analysis) {
        throw new Error('Invalid response from AI');
      }

      setAnalysis(data.analysis);
      toast.success('Root cause analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze problem. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const submitProblem = () => {
    toast.success('Problem profile created! Ready for solution generation.');
    // Navigate to solutions
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileQuestion className="w-6 h-6 text-primary" />
            </div>
            Step 1: Problem Intake
          </motion.h1>
          <p className="text-muted-foreground mt-2">
            Define your problem with ruthless clarity. Incomplete inputs will be rejected.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Problem Statement</span>
            <span>Context & Outcome</span>
            <span>Stakeholders</span>
            <span>AI Analysis</span>
          </div>
        </div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-6 space-y-6"
            >
              <div className="flex items-center gap-2 text-primary mb-4">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Define the Problem</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Problem Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Customer Churn Rate Exceeds Target by 40%"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="problemStatement">Problem Statement *</Label>
                <Textarea
                  id="problemStatement"
                  placeholder="Describe the problem in detail. Include specific metrics, timeline, and impact. Be precise and measurable."
                  rows={6}
                  value={formData.problemStatement}
                  onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                  className={errors.problemStatement ? 'border-destructive' : ''}
                />
                {errors.problemStatement && (
                  <p className="text-xs text-destructive">{errors.problemStatement}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.problemStatement.length}/500 characters (minimum 50)
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={nextStep} className="neon-glow">
                  Continue <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-6 space-y-6"
            >
              <div className="flex items-center gap-2 text-primary mb-4">
                <Target className="w-5 h-5" />
                <span className="font-medium">Context & Desired Outcome</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="context">Context & Constraints *</Label>
                <Textarea
                  id="context"
                  placeholder="What are the boundaries? Budget, timeline, team capacity, dependencies..."
                  rows={4}
                  value={formData.context}
                  onChange={(e) => handleInputChange('context', e.target.value)}
                  className={errors.context ? 'border-destructive' : ''}
                />
                {errors.context && (
                  <p className="text-xs text-destructive">{errors.context}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="desiredOutcome">Desired Outcome *</Label>
                <Textarea
                  id="desiredOutcome"
                  placeholder="What does success look like? Include specific, measurable KPIs and timeline."
                  rows={4}
                  value={formData.desiredOutcome}
                  onChange={(e) => handleInputChange('desiredOutcome', e.target.value)}
                  className={errors.desiredOutcome ? 'border-destructive' : ''}
                />
                {errors.desiredOutcome && (
                  <p className="text-xs text-destructive">{errors.desiredOutcome}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must include at least one measurable metric
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={nextStep} className="neon-glow">
                  Continue <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-6 space-y-6"
            >
              <div className="flex items-center gap-2 text-primary mb-4">
                <Users className="w-5 h-5" />
                <span className="font-medium">Stakeholders & Previous Attempts</span>
              </div>

              <div className="space-y-4">
                <Label>Key Stakeholders</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add stakeholder (e.g., VP Engineering)"
                    value={newStakeholder}
                    onChange={(e) => setNewStakeholder(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addStakeholder()}
                  />
                  <Button variant="outline" onClick={addStakeholder}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stakeholders.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-secondary text-sm flex items-center gap-2"
                    >
                      {s}
                      <button onClick={() => removeStakeholder(i)}>
                        <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAttempts" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Previous Attempts (optional)
                </Label>
                <Textarea
                  id="currentAttempts"
                  placeholder="What has already been tried? What worked or didn't work?"
                  rows={4}
                  value={formData.currentAttempts}
                  onChange={(e) => handleInputChange('currentAttempts', e.target.value)}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={nextStep} className="neon-glow">
                  Analyze with AI <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {!analysis ? (
                <div className="glass-card p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready for AI Analysis</h3>
                  <p className="text-muted-foreground mb-6">
                    Our AI will identify symptoms, root causes, assumptions, and constraints.
                  </p>
                  <Button
                    onClick={analyzeWithAI}
                    disabled={analyzing}
                    className="neon-glow"
                  >
                    {analyzing ? (
                      <>Analyzing... <span className="animate-spin ml-2">⚡</span></>
                    ) : (
                      <>Run Root Cause Analysis</>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Analysis Results */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-success" />
                        Problem Profile Generated
                      </h3>
                      <div className="flex gap-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{analysis.priorityScore}</p>
                          <p className="text-xs text-muted-foreground">Priority</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-warning">{analysis.impactScore}</p>
                          <p className="text-xs text-muted-foreground">Impact</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Symptoms */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-primary">Identified Symptoms</h4>
                        <ul className="space-y-2">
                          {analysis.symptoms.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Root Causes */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-primary">Root Causes</h4>
                        <ul className="space-y-2">
                          {analysis.rootCauses.map((rc: any, i: number) => (
                            <li key={i} className="p-2 rounded bg-muted/50 text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="px-2 py-0.5 rounded text-xs bg-secondary uppercase">
                                  {rc.type}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {rc.confidence}% confidence
                                </span>
                              </div>
                              {rc.description}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Assumptions */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-warning">Assumptions to Verify</h4>
                        <ul className="space-y-2">
                          {analysis.assumptions.map((a: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Constraints */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-muted-foreground">Confirmed Constraints</h4>
                        <ul className="space-y-2">
                          {analysis.constraints.map((c: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => { setAnalysis(null); setStep(3); }}>
                      Back
                    </Button>
                    <Button onClick={submitProblem} className="neon-glow">
                      Proceed to Solution Generation <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
