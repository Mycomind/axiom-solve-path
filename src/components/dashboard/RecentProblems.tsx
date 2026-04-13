import { motion } from 'framer-motion';
import { ChevronRight, Clock, FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type ProblemStatus = 'intake' | 'solution' | 'execution' | 'monitoring' | 'completed';

interface Problem {
  id: string;
  title: string;
  status: ProblemStatus;
  priority_score: number;
  updated_at: string;
}

const statusColors: Record<ProblemStatus, string> = {
  intake: 'bg-primary',
  solution: 'bg-neon-purple',
  execution: 'bg-neon-orange',
  monitoring: 'bg-warning',
  completed: 'bg-success'
};

const statusLabels: Record<ProblemStatus, string> = {
  intake: 'Intake',
  solution: 'Solution',
  execution: 'Execution',
  monitoring: 'Monitoring',
  completed: 'Completed'
};

interface RecentProblemsProps {
  problems: Problem[];
  isLoading?: boolean;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

export function RecentProblems({ problems, isLoading }: RecentProblemsProps) {
  const getStatusRoute = (status: ProblemStatus): string => {
    switch (status) {
      case 'intake': return '/intake';
      case 'solution': return '/solutions';
      case 'execution': return '/execution';
      case 'monitoring': return '/monitoring';
      case 'completed': return '/monitoring';
      default: return '/intake';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Recent Problems</h2>
        <Link to="/intake" className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="task-card animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center py-8">
          <FileQuestion className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No problems yet</p>
          <Link to="/intake" className="text-primary hover:underline text-sm">
            Create your first problem →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="task-card hover:neon-border"
            >
              <Link to={getStatusRoute(problem.status)} className="block">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{problem.title}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium text-primary-foreground",
                        statusColors[problem.status]
                      )}>
                        {statusLabels[problem.status]}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(problem.updated_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "score-badge",
                      problem.priority_score >= 8 ? "score-high" : 
                      problem.priority_score >= 5 ? "score-medium" : "score-low"
                    )}>
                      P{problem.priority_score || 0}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
