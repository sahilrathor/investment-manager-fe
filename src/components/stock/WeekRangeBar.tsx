import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface WeekRangeBarProps {
  currentPrice: number;
  weekHigh: number;
  weekLow: number;
  formatPrice: (val: number) => string;
}

export function WeekRangeBar({ currentPrice, weekHigh, weekLow, formatPrice }: WeekRangeBarProps) {
  if (!weekHigh || !weekLow) return null;

  const range = weekHigh - weekLow;
  const position = range > 0 ? ((currentPrice - weekLow) / range) * 100 : 50;
  const clampedPosition = Math.max(0, Math.min(100, position));

  const distanceFromHigh = weekHigh > 0 ? ((weekHigh - currentPrice) / weekHigh) * 100 : 0;
  const distanceFromLow = weekLow > 0 ? ((currentPrice - weekLow) / weekLow) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">52-Week Range</span>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            clampedPosition > 70 ? 'bg-profit/10 text-profit' :
            clampedPosition < 30 ? 'bg-loss/10 text-loss' :
            'bg-muted text-muted-foreground'
          )}>
            {clampedPosition.toFixed(0)}% range
          </span>
        </div>

        <div className="relative h-2 bg-muted rounded-full mb-3">
          <div
            className="absolute h-full rounded-full bg-gradient-to-r from-loss via-yellow-500 to-profit"
            style={{ width: '100%' }}
          />
          <div
            className="absolute w-3 h-3 bg-primary rounded-full border-2 border-background -top-0.5 transform -translate-x-1/2"
            style={{ left: `${clampedPosition}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-loss">
            <ArrowDown className="h-3 w-3" />
            <span>{formatPrice(weekLow)}</span>
            <span className="text-muted-foreground ml-1">(+{distanceFromLow.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-1 text-profit">
            <span className="text-muted-foreground mr-1">(-{distanceFromHigh.toFixed(1)}%)</span>
            <span>{formatPrice(weekHigh)}</span>
            <ArrowUp className="h-3 w-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
