import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentProblems } from '@/components/dashboard/RecentProblems';
import { KPIOverview } from '@/components/dashboard/KPIOverview';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type ProblemStatus = 'intake' | 'solution' | 'execution' | 'monitoring' | 'completed';

interface Problem {
  id: string;
  title: string;
  status: ProblemStatus;
  priority_score: number;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  kpi_current: number | null;
  kpi_target: number | null;
  kpi_threshold: number | null;
  status: string;
  risk_level: string;
}

interface Alert {
  level: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({
    activeProblems: 0,
    solutionsGenerated: 0,
    tasksInProgress: 0,
    activeAlerts: 0,
  });
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch problems
      const { data: problemsData } = await supabase
        .from('problems')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      const typedProblems = (problemsData || []).map(p => ({
        ...p,
        status: p.status as ProblemStatus,
        priority_score: p.priority_score || 0
      }));

      setProblems(typedProblems);

      // Find most recent active problem
      const active = typedProblems.find(p => p.status !== 'completed');
      setActiveProblem(active || null);

      // Count active problems (not completed)
      const activeProblems = typedProblems.filter(p => p.status !== 'completed').length;

      // Fetch solutions count
      const { count: solutionsCount } = await supabase
        .from('solutions')
        .select('*', { count: 'exact', head: true })
        .in('problem_id', typedProblems.map(p => p.id));

      // Fetch all tasks for user's solutions
      const { data: solutionsData } = await supabase
        .from('solutions')
        .select('id')
        .in('problem_id', typedProblems.map(p => p.id));

      const solutionIds = solutionsData?.map(s => s.id) || [];
      
      let tasksData: Task[] = [];
      if (solutionIds.length > 0) {
        const { data } = await supabase
          .from('tasks')
          .select('*')
          .in('solution_id', solutionIds);
        tasksData = (data || []) as Task[];
      }

      setTasks(tasksData);

      // Count tasks in progress
      const tasksInProgress = tasksData.filter(t => t.status === 'in_progress').length;

      // Generate alerts from tasks at risk
      const generatedAlerts: Alert[] = [];
      
      tasksData.forEach(task => {
        // Check for KPI threshold breaches
        if (task.kpi_threshold && task.kpi_current !== null) {
          if (task.kpi_current < task.kpi_threshold) {
            generatedAlerts.push({
              level: 'critical',
              title: `KPI Below Threshold: ${task.title}`,
              description: `Current value (${task.kpi_current}%) is below threshold (${task.kpi_threshold}%)`,
              timestamp: 'Active'
            });
          }
        }
        
        // Check for high risk tasks
        if (task.risk_level === 'critical') {
          generatedAlerts.push({
            level: 'critical',
            title: `Critical Risk: ${task.title}`,
            description: 'This task has been flagged as critical risk. Immediate attention required.',
            timestamp: 'Active'
          });
        } else if (task.risk_level === 'high' && task.status === 'blocked') {
          generatedAlerts.push({
            level: 'high',
            title: `Blocked Task: ${task.title}`,
            description: 'High-risk task is blocked. Review dependencies and resources.',
            timestamp: 'Active'
          });
        }
      });

      // Limit to top 5 alerts
      setAlerts(generatedAlerts.slice(0, 5));

      setStats({
        activeProblems,
        solutionsGenerated: solutionsCount || 0,
        tasksInProgress,
        activeAlerts: generatedAlerts.length,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepStatus = (status: ProblemStatus | undefined, stepNumber: number): 'completed' | 'active' | 'pending' => {
    if (!status) return stepNumber === 1 ? 'active' : 'pending';
    
    const statusOrder: Record<ProblemStatus, number> = {
      intake: 1,
      solution: 2,
      execution: 3,
      monitoring: 4,
      completed: 5
    };
    
    const currentStep = statusOrder[status];
    
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'pending';
  };

  const getCurrentStep = (status: ProblemStatus | undefined): number => {
    if (!status) return 1;
    const statusOrder: Record<ProblemStatus, number> = {
      intake: 1,
      solution: 2,
      execution: 3,
      monitoring: 4,
      completed: 4
    };
    return statusOrder[status];
  };

  const steps = [
    { number: 1, label: 'Problem Intake', status: getStepStatus(activeProblem?.status, 1) },
    { number: 2, label: 'Solution Gen', status: getStepStatus(activeProblem?.status, 2) },
    { number: 3, label: 'Execution', status: getStepStatus(activeProblem?.status, 3) },
    { number: 4, label: 'Monitoring', status: getStepStatus(activeProblem?.status, 4) },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold"
            >
              Command Center
            </motion.h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Track problems, solutions, and execution in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchDashboardData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/intake">
              <Button className="neon-glow">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">New Problem</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Active Problem Progress */}
        {activeProblem ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Active: {activeProblem.title}</h2>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Step {getCurrentStep(activeProblem.status)} of 4
              </span>
            </div>
            <StepIndicator steps={steps} currentStep={getCurrentStep(activeProblem.status)} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 text-center"
          >
            <p className="text-muted-foreground mb-4">No active problems. Start by creating a new problem.</p>
            <Link to="/intake">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Problem
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Stats */}
        <DashboardStats stats={stats} isLoading={isLoading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentProblems problems={problems.slice(0, 5)} isLoading={isLoading} />
          </div>
          <div className="space-y-6">
            <AlertsPanel alerts={alerts} isLoading={isLoading} />
          </div>
        </div>

        {/* KPI Overview */}
        <KPIOverview tasks={tasks} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
