import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  name: string;
  value: number;
  target: number;
  threshold?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
}

export function KPICard({ name, value, target, threshold, unit = '', trend }: KPICardProps) {
  const percentage = (value / target) * 100;
  const isInverse = name.toLowerCase().includes('churn') || name.toLowerCase().includes('resolution');
  const isOnTrack = isInverse ? value <= target : value >= target;
  const isWarning = threshold && (isInverse ? value > threshold : value < threshold);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="kpi-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{name}</span>
        {trend && (
          <div className={cn(
            "p-1 rounded",
            trend === 'up' && (isInverse ? "bg-destructive/20" : "bg-success/20"),
            trend === 'down' && (isInverse ? "bg-success/20" : "bg-destructive/20"),
            trend === 'flat' && "bg-muted"
          )}>
            {trend === 'up' && <TrendingUp className={cn("w-4 h-4", isInverse ? "text-destructive" : "text-success")} />}
            {trend === 'down' && <TrendingDown className={cn("w-4 h-4", isInverse ? "text-success" : "text-destructive")} />}
            {trend === 'flat' && <Minus className="w-4 h-4 text-muted-foreground" />}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className={cn(
          "text-3xl font-bold",
          isOnTrack ? "text-success" : isWarning ? "text-warning" : "text-foreground"
        )}>
          {value.toFixed(1)}
        </span>
        <span className="text-muted-foreground">{unit}</span>
        <span className="text-sm text-muted-foreground">/ {target}{unit}</span>
      </div>

      <div className="mt-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{Math.min(percentage, 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              isOnTrack ? "bg-success" : isWarning ? "bg-warning" : "bg-primary"
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}
