import { motion } from 'framer-motion';
import { FileQuestion, Lightbulb, ListTodo, AlertTriangle } from 'lucide-react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  isLoading?: boolean;
}

function StatCard({ icon: Icon, label, value, change, changeType, isLoading }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-3 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        {change && (
          <span className={`text-xs sm:text-sm font-medium hidden sm:block ${
            changeType === 'positive' ? 'text-success' :
            changeType === 'negative' ? 'text-destructive' :
            'text-muted-foreground'
          }`}>
            {change}
          </span>
        )}
      </div>
      <div className="mt-3 sm:mt-4">
        {isLoading ? (
          <div className="h-8 sm:h-9 w-12 sm:w-16 bg-muted animate-pulse rounded" />
        ) : (
          <p className="text-2xl sm:text-3xl font-bold">{value}</p>
        )}
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">{label}</p>
      </div>
    </motion.div>
  );
}

interface DashboardStatsProps {
  stats: {
    activeProblems: number;
    solutionsGenerated: number;
    tasksInProgress: number;
    activeAlerts: number;
  };
  isLoading?: boolean;
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  const statCards = [
    { 
      icon: FileQuestion, 
      label: 'Active Problems', 
      value: stats.activeProblems, 
      change: stats.activeProblems > 0 ? `${stats.activeProblems} in progress` : 'None active',
      changeType: 'neutral' as const 
    },
    { 
      icon: Lightbulb, 
      label: 'Solutions Generated', 
      value: stats.solutionsGenerated, 
      change: stats.solutionsGenerated > 0 ? 'Ready for execution' : 'Generate solutions',
      changeType: 'positive' as const 
    },
    { 
      icon: ListTodo, 
      label: 'Tasks In Progress', 
      value: stats.tasksInProgress, 
      change: stats.tasksInProgress > 0 ? 'Active tasks' : 'No tasks yet',
      changeType: 'neutral' as const 
    },
    { 
      icon: AlertTriangle, 
      label: 'Active Alerts', 
      value: stats.activeAlerts, 
      change: stats.activeAlerts > 0 ? 'Needs attention' : 'All clear',
      changeType: stats.activeAlerts > 0 ? 'negative' as const : 'positive' as const 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatCard {...stat} isLoading={isLoading} />
        </motion.div>
      ))}
    </div>
  );
}
