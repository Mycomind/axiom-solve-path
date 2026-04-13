import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Step {
  number: number;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={cn(
                "step-indicator",
                step.status === 'active' && "step-active",
                step.status === 'completed' && "step-completed",
                step.status === 'pending' && "step-pending"
              )}
            >
              {step.status === 'completed' ? (
                <Check className="w-5 h-5" />
              ) : (
                step.number
              )}
            </motion.div>
            <span className={cn(
              "mt-2 text-xs font-medium",
              step.status === 'active' ? "text-primary" : "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 mx-4",
              step.status === 'completed' ? "bg-success" : "bg-border"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
