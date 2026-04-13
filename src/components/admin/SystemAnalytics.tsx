import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CheckCircle, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalProblems: number;
  problemsCompleted: number;
  totalSolutions: number;
  totalTasks: number;
  tasksCompleted: number;
  avgCompletionTime: number;
}

interface SystemAnalyticsProps {
  stats: SystemStats | null;
  isLoading: boolean;
}

export function SystemAnalytics({ stats, isLoading }: SystemAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers ?? 0,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Problems',
      value: stats?.totalProblems ?? 0,
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Problems Completed',
      value: stats?.problemsCompleted ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Solutions Generated',
      value: stats?.totalSolutions ?? 0,
      icon: TrendingUp,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Total Tasks',
      value: stats?.totalTasks ?? 0,
      icon: FileText,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'Tasks Completed',
      value: stats?.tasksCompleted ?? 0,
      icon: CheckCircle,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
    },
    {
      title: 'Avg Completion (days)',
      value: stats?.avgCompletionTime ?? 0,
      icon: Clock,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">System Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${metric.bgColor}`}>
                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                  {metric.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{metric.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
