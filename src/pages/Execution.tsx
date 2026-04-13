import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ListTodo, 
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  MoreVertical,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { TaskStatus, RiskLevel } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/20 text-primary',
  completed: 'bg-success/20 text-success',
  blocked: 'bg-destructive/20 text-destructive',
  paused: 'bg-warning/20 text-warning'
};

const statusIcons: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  in_progress: Play,
  completed: CheckCircle,
  blocked: AlertTriangle,
  paused: Pause
};

const riskColors: Record<RiskLevel, string> = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-neon-orange',
  critical: 'text-destructive'
};

interface Task {
  id: string;
  title: string;
  description: string | null;
  milestone: string | null;
  order_index: number | null;
  owner: string | null;
  deadline: string | null;
  dependencies: string[] | null;
  risk_level: RiskLevel;
  status: TaskStatus;
  kpi_target: number | null;
  kpi_current: number | null;
  kpi_threshold: number | null;
  solution_id: string;
}

interface Solution {
  id: string;
  title: string;
  description: string;
  total_score: number | null;
  second_order_effects: string[] | null;
  problem_id: string;
}

interface Problem {
  id: string;
  title: string;
  problem_statement: string;
  desired_outcome: string;
  root_causes: any;
  constraints: string[] | null;
}

export default function Execution() {
  const { user } = useAuth();
  const [expandedMilestones, setExpandedMilestones] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadExecutionData();
    }
  }, [user]);

  const loadExecutionData = async () => {
    try {
      setIsLoading(true);
      
      // Get the problem in execution status
      const { data: problemData, error: problemError } = await supabase
        .from('problems')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'execution')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (problemError || !problemData) {
        console.log('No problem in execution status found');
        setIsLoading(false);
        return;
      }

      setProblem(problemData as Problem);

      // Get the selected solution
      const { data: solutionData, error: solutionError } = await supabase
        .from('solutions')
        .select('*')
        .eq('problem_id', problemData.id)
        .eq('is_selected', true)
        .limit(1)
        .single();

      if (solutionError || !solutionData) {
        console.log('No selected solution found');
        setIsLoading(false);
        return;
      }

      setSolution(solutionData as Solution);

      // Get existing tasks for this solution
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('solution_id', solutionData.id)
        .order('order_index', { ascending: true });

      if (!tasksError && tasksData && tasksData.length > 0) {
        setTasks(tasksData as Task[]);
        // Expand first two milestones by default
        const milestones = [...new Set(tasksData.map(t => t.milestone).filter(Boolean))];
        setExpandedMilestones(milestones.slice(0, 2) as string[]);
      }
    } catch (error) {
      console.error('Error loading execution data:', error);
      toast.error('Failed to load execution data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!solution || !problem) {
      toast.error('No solution selected for execution');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-execution-plan', {
        body: {
          solutionId: solution.id,
          solution: {
            title: solution.title,
            description: solution.description,
            total_score: solution.total_score,
            second_order_effects: solution.second_order_effects
          },
          problem: {
            title: problem.title,
            problem_statement: problem.problem_statement,
            desired_outcome: problem.desired_outcome,
            root_causes: problem.root_causes,
            constraints: problem.constraints
          }
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Delete existing tasks for this solution
      await supabase
        .from('tasks')
        .delete()
        .eq('solution_id', solution.id);

      // Insert new tasks
      const tasksToInsert = data.tasks.map((task: any, index: number) => ({
        solution_id: solution.id,
        title: task.title,
        description: task.description,
        milestone: task.milestone,
        order_index: task.order_index || index,
        owner: task.owner,
        deadline: task.deadline,
        dependencies: task.dependencies || [],
        risk_level: task.risk_level,
        status: 'pending',
        kpi_target: task.kpi_target || null,
        kpi_current: 0,
        kpi_threshold: task.kpi_threshold || null
      }));

      const { data: insertedTasks, error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (insertError) throw insertError;

      setTasks(insertedTasks as Task[]);
      
      // Expand first two milestones
      const milestones = [...new Set(insertedTasks.map(t => t.milestone).filter(Boolean))];
      setExpandedMilestones(milestones.slice(0, 2) as string[]);

      toast.success(`Generated ${insertedTasks.length} tasks across ${data.milestones?.length || 0} milestones`);
    } catch (error) {
      console.error('Error generating execution plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate execution plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
      toast.success('Task status updated');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const milestones = [...new Set(tasks.map(t => t.milestone).filter(Boolean))];
  
  const toggleMilestone = (milestone: string) => {
    setExpandedMilestones(prev => 
      prev.includes(milestone) 
        ? prev.filter(m => m !== milestone)
        : [...prev, milestone]
    );
  };

  const overallProgress = tasks.length > 0
    ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!solution || !problem) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ListTodo className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Solution Selected</h2>
          <p className="text-muted-foreground mb-6">
            Complete Steps 1 and 2 first to select a solution for execution planning.
          </p>
          <Button onClick={() => window.location.href = '/solutions'}>
            Go to Solutions
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-neon-orange/20 flex items-center justify-center">
                <ListTodo className="w-6 h-6 text-neon-orange" />
              </div>
              Step 3: Execution Planning
            </motion.h1>
            <p className="text-muted-foreground mt-2">
              Atomic tasks with owners, deadlines, and KPI tracking
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {tasks.length > 0 && (
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                    viewMode === 'list' ? "bg-background shadow" : "text-muted-foreground"
                  )}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                    viewMode === 'kanban' ? "bg-background shadow" : "text-muted-foreground"
                  )}
                >
                  Kanban
                </button>
              </div>
            )}
            <Button 
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="neon-glow"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : tasks.length > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Plan
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Execution Plan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Solution: {solution.title}</h2>
              <p className="text-sm text-muted-foreground">
                {tasks.length > 0 
                  ? `${tasks.length} tasks across ${milestones.length} phases`
                  : 'No tasks generated yet - click "Generate Execution Plan" to start'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold gradient-text">{overallProgress}%</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </motion.div>

        {/* Empty State */}
        {tasks.length === 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to Plan Execution</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              AI will analyze your solution and create atomic tasks with milestones, 
              dependencies, owners, and KPIs for tracking progress.
            </p>
            <Button onClick={handleGeneratePlan} size="lg" className="neon-glow">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Execution Plan
            </Button>
          </motion.div>
        )}

        {/* Generating State */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Generating Execution Plan</h3>
            <p className="text-muted-foreground">
              AI is creating atomic tasks, milestones, and KPIs...
            </p>
          </motion.div>
        )}

        {/* Task List by Milestone */}
        {viewMode === 'list' && tasks.length > 0 && (
          <div className="space-y-4">
            {milestones.map((milestone) => {
              const milestoneTasks = tasks.filter(t => t.milestone === milestone);
              const isExpanded = expandedMilestones.includes(milestone || '');
              const completedCount = milestoneTasks.filter(t => t.status === 'completed').length;
              
              return (
                <motion.div
                  key={milestone}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card overflow-hidden"
                >
                  <button
                    onClick={() => toggleMilestone(milestone || '')}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <h3 className="font-semibold">{milestone}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                        {completedCount}/{milestoneTasks.length}
                      </span>
                    </div>
                    <Progress 
                      value={(completedCount / milestoneTasks.length) * 100} 
                      className="w-32 h-2"
                    />
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t border-border">
                      {milestoneTasks.map((task, index) => {
                        const StatusIcon = statusIcons[task.status];
                        const kpiProgress = task.kpi_target ? ((task.kpi_current || 0) / task.kpi_target) * 100 : 0;
                        const isBelowThreshold = task.kpi_threshold && (task.kpi_current || 0) < task.kpi_threshold;
                        
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={cn("p-2 rounded-lg", statusColors[task.status])}>
                                  <StatusIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium">{task.title}</h4>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2">
                                    {task.owner && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <User className="w-3 h-3" />
                                        {task.owner}
                                      </span>
                                    )}
                                    {task.deadline && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {new Date(task.deadline).toLocaleDateString()}
                                      </span>
                                    )}
                                    <span className={cn("text-xs font-medium", riskColors[task.risk_level])}>
                                      {task.risk_level.toUpperCase()} RISK
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* KPI Progress */}
                              {task.kpi_target && (
                                <div className="w-32">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">KPI</span>
                                    <span className={isBelowThreshold ? 'text-destructive' : ''}>
                                      {task.kpi_current || 0}/{task.kpi_target}
                                    </span>
                                  </div>
                                  <Progress 
                                    value={kpiProgress}
                                    className={cn("h-2", isBelowThreshold && "[&>div]:bg-destructive")}
                                  />
                                  {isBelowThreshold && (
                                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Below threshold
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                                    Start Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'completed')}>
                                    Mark Complete
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'blocked')}>
                                    Mark Blocked
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(task.id, 'paused')}
                                    className="text-warning"
                                  >
                                    Pause Task
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && tasks.length > 0 && (
          <div className="grid grid-cols-5 gap-4">
            {(['pending', 'in_progress', 'completed', 'blocked', 'paused'] as TaskStatus[]).map(status => {
              const statusTasks = tasks.filter(t => t.status === status);
              const StatusIcon = statusIcons[status];
              
              return (
                <div key={status} className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <StatusIcon className="w-4 h-4" />
                    <h3 className="font-medium capitalize">{status.replace('_', ' ')}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-xs ml-auto">
                      {statusTasks.length}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {statusTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          {task.owner && (
                            <span className="text-xs text-muted-foreground">{task.owner}</span>
                          )}
                          <span className={cn("text-xs ml-auto", riskColors[task.risk_level])}>
                            {task.risk_level}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
