import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert,
  AlertTriangle,
  Pause,
  RotateCcw,
  ArrowUp,
  History,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  RefreshCw,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { RiskAlert } from '@/components/ui/RiskAlert';
import { KPICard } from '@/components/ui/KPICard';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Alert {
  level: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  taskId: string;
  taskTitle: string;
  recommendedAction: string;
  timestamp?: string;
}

interface KillSwitchLog {
  id: string;
  task_id: string;
  action: string;
  reason: string;
  created_at: string;
  triggered_by: string;
  previous_status: string | null;
  new_status: string | null;
  taskTitle?: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  milestone: string | null;
  owner: string | null;
  deadline: string | null;
  risk_level: string;
  kpi_current: number | null;
  kpi_target: number | null;
  kpi_threshold: number | null;
  dependencies: string[] | null;
}

export default function Monitoring() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [killSwitchLogs, setKillSwitchLogs] = useState<KillSwitchLog[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [summary, setSummary] = useState('');
  const [problemContext, setProblemContext] = useState('');
  const [solutionId, setSolutionId] = useState<string | null>(null);
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (user) {
      fetchMonitoringData();
    }
  }, [user]);

  const fetchMonitoringData = async () => {
    if (!user) return;

    try {
      // Get problem in execution or monitoring status
      const { data: problem } = await supabase
        .from('problems')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['execution', 'monitoring'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!problem) {
        toast.info('No active problem in execution. Create a problem and generate an execution plan first.');
        return;
      }

      setProblemContext(`${problem.title}: ${problem.problem_statement}`);

      // Get selected solution
      const { data: solution } = await supabase
        .from('solutions')
        .select('*')
        .eq('problem_id', problem.id)
        .eq('is_selected', true)
        .single();

      if (!solution) {
        toast.info('No selected solution found.');
        return;
      }

      setSolutionId(solution.id);

      // Get tasks for the solution
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('solution_id', solution.id)
        .order('order_index', { ascending: true });

      if (tasksData) {
        setTasks(tasksData as Task[]);
      }

      // Get kill switch logs
      const taskIds = tasksData?.map(t => t.id) || [];
      if (taskIds.length > 0) {
        const { data: logs } = await supabase
          .from('kill_switch_logs')
          .select('*')
          .in('task_id', taskIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (logs) {
          // Map task titles to logs
          const logsWithTitles = logs.map(log => ({
            ...log,
            taskTitle: tasksData?.find(t => t.id === log.task_id)?.title || 'Unknown Task'
          }));
          setKillSwitchLogs(logsWithTitles as KillSwitchLog[]);
        }
      }

      // Update problem status to monitoring if in execution
      if (problem.status === 'execution') {
        await supabase
          .from('problems')
          .update({ status: 'monitoring' })
          .eq('id', problem.id);
      }

    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    }
  };

  const runRiskAnalysis = useCallback(async () => {
    if (!user || tasks.length === 0) {
      toast.error('No tasks to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('analyze-risks', {
        body: {
          solutionId,
          tasks,
          problemContext,
          autoExecute: autoExecuteEnabled
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { analysis } = response.data;

      // Update alerts with timestamps
      const alertsWithTime = analysis.alerts.map((alert: Alert) => ({
        ...alert,
        timestamp: 'Just now'
      }));

      setActiveAlerts(alertsWithTime);
      setRiskScore(analysis.overallRiskScore);
      setSummary(analysis.summary);

      // If auto-execute was enabled and actions were taken, refresh data
      if (autoExecuteEnabled && analysis.killSwitchActions.length > 0) {
        toast.success(`${analysis.killSwitchActions.length} kill-switch action(s) executed`);
        await fetchMonitoringData();
      } else if (analysis.killSwitchActions.length > 0) {
        toast.info(`${analysis.killSwitchActions.length} action(s) recommended. Enable auto-execute to apply.`);
      }

      toast.success('Risk analysis complete');

    } catch (error: any) {
      console.error('Error running risk analysis:', error);
      toast.error(error.message || 'Failed to run risk analysis');
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, tasks, solutionId, problemContext, autoExecuteEnabled]);

  const executeManualAction = async (taskId: string, action: 'pause' | 'resume' | 'escalate') => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const previousStatus = task.status as 'pending' | 'in_progress' | 'completed' | 'blocked' | 'paused';
      let newStatus: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'paused' = previousStatus;
      let newRiskLevel: 'low' | 'medium' | 'high' | 'critical' = task.risk_level as 'low' | 'medium' | 'high' | 'critical';

      if (action === 'pause') {
        newStatus = 'paused';
      } else if (action === 'resume') {
        newStatus = 'in_progress';
      } else if (action === 'escalate') {
        newStatus = 'blocked';
        newRiskLevel = 'critical';
      }

      const actionLabel = action === 'resume' ? 'reallocated' : action === 'pause' ? 'paused' : 'escalated';

      // Update task status
      await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          risk_level: newRiskLevel
        })
        .eq('id', taskId);

      // Log the action
      await supabase
        .from('kill_switch_logs')
        .insert({
          task_id: taskId,
          action: `Manual ${action} triggered by user`,
          reason: `Manual ${action} triggered by user`,
          previous_status: previousStatus,
          new_status: newStatus,
          triggered_by: 'user'
        });

      toast.success(`Task ${action}d successfully`);
      await fetchMonitoringData();

    } catch (error: any) {
      console.error('Error executing manual action:', error);
      toast.error(error.message || 'Failed to execute action');
    }
  };

  const actionIcons: Record<string, any> = {
    paused: Pause,
    reallocated: RotateCcw,
    escalated: ArrowUp
  };

  const actionColors: Record<string, string> = {
    paused: 'text-warning bg-warning/20',
    reallocated: 'text-primary bg-primary/20',
    escalated: 'text-destructive bg-destructive/20'
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-destructive';
    if (score >= 40) return 'text-warning';
    return 'text-success';
  };

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
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-destructive" />
              </div>
              Step 4: Risk Monitoring
            </motion.h1>
            <p className="text-muted-foreground mt-2">
              AI-powered risk analysis with automated kill-switch actions
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg",
              riskScore >= 70 ? "bg-destructive/10 text-destructive" :
              riskScore >= 40 ? "bg-warning/10 text-warning" :
              "bg-success/10 text-success"
            )}>
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">
                Risk Score: {riskScore}%
              </span>
            </div>
            <Button 
              onClick={runRiskAnalysis} 
              disabled={isAnalyzing || tasks.length === 0}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Banner */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 glass-card border-l-4 border-primary"
          >
            <p className="text-sm">{summary}</p>
          </motion.div>
        )}

        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Tasks to Monitor</h2>
            <p className="text-muted-foreground mb-6">
              Complete Steps 1-3 to create an execution plan with tasks to monitor.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/problem-intake'}>
              Start with Problem Intake
            </Button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Active Alerts */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    Active Alerts
                  </h2>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    activeAlerts.length > 0 ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
                  )}>
                    {activeAlerts.length} Active
                  </span>
                </div>

                {activeAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
                    <p>No active alerts. Run analysis to check for risks.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeAlerts.map((alert, index) => (
                      <motion.div
                        key={`${alert.taskId}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <RiskAlert 
                          level={alert.level} 
                          title={alert.title}
                          description={alert.description}
                          timestamp={alert.timestamp}
                        />
                        <div className="flex items-center gap-2 mt-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => executeManualAction(alert.taskId, 'pause')}
                          >
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => executeManualAction(alert.taskId, 'escalate')}
                          >
                            <ArrowUp className="w-3 h-3 mr-1" />
                            Escalate
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Kill Switch Logs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Kill-Switch Log
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    Recent actions
                  </span>
                </div>

                {killSwitchLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No kill-switch actions recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {killSwitchLogs.map((log, index) => {
                      const ActionIcon = actionIcons[log.action] || Zap;
                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg"
                        >
                          <div className={cn("p-2 rounded-lg", actionColors[log.action] || 'bg-muted')}>
                            <ActionIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{log.taskTitle}</h4>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium uppercase",
                                actionColors[log.action] || 'bg-muted'
                              )}>
                                {log.action}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{log.reason}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{new Date(log.created_at).toLocaleString()}</span>
                              <span className="flex items-center gap-1">
                                {log.triggered_by === 'system' ? (
                                  <>
                                    <Zap className="w-3 h-3" />
                                    Automated
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Manual
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Auto-Execute Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h2 className="text-lg font-semibold mb-4">Kill-Switch Mode</h2>
                <div className="space-y-4">
                  <button
                    onClick={() => setAutoExecuteEnabled(false)}
                    className={cn(
                      "w-full p-3 rounded-lg border-2 text-left transition-all",
                      !autoExecuteEnabled 
                        ? "border-primary bg-primary/10" 
                        : "border-muted hover:border-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4" />
                      <span className="font-medium">Monitor Only</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Analyze and alert, but require manual approval for actions
                    </p>
                  </button>
                  <button
                    onClick={() => setAutoExecuteEnabled(true)}
                    className={cn(
                      "w-full p-3 rounded-lg border-2 text-left transition-all",
                      autoExecuteEnabled 
                        ? "border-destructive bg-destructive/10" 
                        : "border-muted hover:border-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-destructive" />
                      <span className="font-medium">Auto-Execute</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically pause/escalate tasks when thresholds breach
                    </p>
                  </button>
                </div>
              </motion.div>

              {/* Kill Switch Rules */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h2 className="text-lg font-semibold mb-4">Kill-Switch Rules</h2>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium">KPI Threshold</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Auto-escalate if any KPI breaches threshold
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Pause className="w-4 h-4 text-warning" />
                      <span className="text-sm font-medium">Deadline Risk</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pause blocked tasks with approaching deadlines
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <RotateCcw className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Resource Conflict</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommend reallocation for overloaded owners
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Task KPI Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h2 className="text-lg font-semibold mb-4">Task KPI Status</h2>
                <div className="space-y-4">
                  {tasks.filter(t => t.kpi_target !== null).slice(0, 4).map((task) => (
                    <KPICard
                      key={task.id}
                      name={task.title}
                      value={task.kpi_current || 0}
                      target={task.kpi_target || 100}
                      threshold={task.kpi_threshold || undefined}
                      unit="%"
                    />
                  ))}
                  {tasks.filter(t => t.kpi_target !== null).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No KPIs configured for tasks
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
