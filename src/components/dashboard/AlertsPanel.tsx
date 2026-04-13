import { motion } from 'framer-motion';
import { RiskAlert } from '@/components/ui/RiskAlert';
import { Bell, CheckCircle } from 'lucide-react';

interface Alert {
  level: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  isLoading?: boolean;
}

export function AlertsPanel({ alerts, isLoading }: AlertsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Active Alerts</h2>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          alerts.length > 0 
            ? 'bg-destructive/20 text-destructive' 
            : 'bg-success/20 text-success'
        }`}>
          {alerts.length} Active
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No active alerts</p>
          <p className="text-xs text-muted-foreground mt-1">All systems running smoothly</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <RiskAlert {...alert} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
