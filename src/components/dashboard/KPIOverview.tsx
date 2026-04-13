import { motion } from 'framer-motion';
import { KPICard } from '@/components/ui/KPICard';
import { BarChart3 } from 'lucide-react';

interface TaskKPI {
  id: string;
  title: string;
  kpi_current: number | null;
  kpi_target: number | null;
  kpi_threshold: number | null;
  status: string;
}

interface KPIOverviewProps {
  tasks: TaskKPI[];
  isLoading?: boolean;
}

export function KPIOverview({ tasks, isLoading }: KPIOverviewProps) {
  // Filter tasks that have KPI targets
  const tasksWithKPIs = tasks.filter(t => t.kpi_target !== null);

  // Calculate overall progress
  const totalProgress = tasksWithKPIs.length > 0
    ? tasksWithKPIs.reduce((sum, t) => {
        const progress = t.kpi_target ? ((t.kpi_current || 0) / t.kpi_target) * 100 : 0;
        return sum + Math.min(progress, 100);
      }, 0) / tasksWithKPIs.length
    : 0;

  // Count tasks at risk (below threshold)
  const atRiskCount = tasksWithKPIs.filter(t => {
    if (!t.kpi_threshold || !t.kpi_current) return false;
    return t.kpi_current < t.kpi_threshold;
  }).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">KPI Dashboard</h2>
        {tasksWithKPIs.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Overall: <span className="font-medium text-foreground">{totalProgress.toFixed(0)}%</span>
            </span>
            {atRiskCount > 0 && (
              <span className="text-destructive font-medium">
                {atRiskCount} at risk
              </span>
            )}
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : tasksWithKPIs.length === 0 ? (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No KPIs tracked yet</p>
          <p className="text-sm text-muted-foreground">
            Generate an execution plan to see task KPIs here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasksWithKPIs.slice(0, 6).map((task, index) => {
            const progress = task.kpi_target ? ((task.kpi_current || 0) / task.kpi_target) * 100 : 0;
            const isAtRisk = task.kpi_threshold && task.kpi_current ? task.kpi_current < task.kpi_threshold : false;
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <KPICard
                  name={task.title}
                  value={task.kpi_current || 0}
                  target={task.kpi_target || 100}
                  threshold={task.kpi_threshold || undefined}
                  unit="%"
                  trend={isAtRisk ? 'down' : progress >= 80 ? 'up' : 'flat'}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
