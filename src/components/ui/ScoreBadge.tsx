import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  maxScore?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, maxScore = 10, label, size = 'md' }: ScoreBadgeProps) {
  const percentage = (score / maxScore) * 100;
  
  const getScoreClass = () => {
    if (percentage >= 70) return 'score-high';
    if (percentage >= 40) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className={cn(
      "flex items-center gap-2",
      size === 'sm' && "text-xs",
      size === 'md' && "text-sm",
      size === 'lg' && "text-base"
    )}>
      {label && <span className="text-muted-foreground">{label}</span>}
      <span className={cn("score-badge", getScoreClass())}>
        {score}/{maxScore}
      </span>
    </div>
  );
}
