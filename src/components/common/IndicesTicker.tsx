import { useIndices, IndexData } from '@/hooks/queries/useMarket';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 20;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IndexCard({ index }: { index: IndexData }) {
  const isPositive = index.change >= 0;
  const sparkColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors min-w-[200px]">
      <div>
        <p className="text-xs font-semibold text-foreground">{index.name}</p>
        <p className="text-sm font-bold">
          {index.price.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
        </p>
        <div className="flex items-center gap-1">
          {isPositive
            ? <TrendingUp className="h-3 w-3 text-profit" />
            : <TrendingDown className="h-3 w-3 text-loss" />
          }
          <span className={cn("text-xs font-medium", isPositive ? 'text-profit' : 'text-loss')}>
            {isPositive ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>
      <MiniSparkline data={index.sparkline} color={sparkColor} />
    </div>
  );
}

export function IndicesTicker() {
  const { data: indices, isLoading } = useIndices();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground text-sm">
        <BarChart3 className="h-4 w-4 animate-pulse" />
        Loading indices...
      </div>
    );
  }

  if (!indices || indices.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-xl bg-card/50 overflow-hidden">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 px-1">
        {indices.map(index => (
          <IndexCard key={index.symbol} index={index} />
        ))}
      </div>
    </div>
  );
}
