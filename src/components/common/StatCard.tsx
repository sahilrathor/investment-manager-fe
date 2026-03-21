import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  change?: number;
  changeLabel?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, change, changeLabel, className }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className={cn(className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <p className={cn(
              "text-xs mt-1",
              isPositive && "text-profit",
              isNegative && "text-loss"
            )}>
              {isPositive ? '+' : ''}{change.toFixed(2)}% {changeLabel || ''}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
