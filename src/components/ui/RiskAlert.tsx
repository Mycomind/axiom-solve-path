import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiskLevel } from '@/types';
import { motion } from 'framer-motion';

interface RiskAlertProps {
  level: RiskLevel;
  title: string;
  description: string;
  timestamp?: string;
  onDismiss?: () => void;
}

const iconMap = {
  low: Info,
  medium: AlertCircle,
  high: AlertTriangle,
  critical: XCircle
};

const levelClasses = {
  low: 'risk-info',
  medium: 'risk-warning',
  high: 'risk-warning',
  critical: 'risk-critical'
};

export function RiskAlert({ level, title, description, timestamp, onDismiss }: RiskAlertProps) {
  const Icon = iconMap[level];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn("risk-alert flex items-start gap-3", levelClasses[level])}
    >
      <Icon className={cn(
        "w-5 h-5 flex-shrink-0 mt-0.5",
        level === 'critical' && "text-destructive",
        level === 'high' && "text-warning",
        level === 'medium' && "text-warning",
        level === 'low' && "text-primary"
      )} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-sm">{title}</h4>
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-medium uppercase",
            level === 'critical' && "bg-destructive text-destructive-foreground",
            level === 'high' && "bg-warning text-warning-foreground",
            level === 'medium' && "bg-warning/50 text-warning-foreground",
            level === 'low' && "bg-primary/20 text-primary"
          )}>
            {level}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        {timestamp && (
          <span className="text-xs text-muted-foreground mt-2 block">{timestamp}</span>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
