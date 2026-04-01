import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Percent, Award, AlertTriangle } from 'lucide-react';
import type { PortfolioAnalytics } from '@/hooks/queries/usePortfolios';
import { formatINR } from '@/lib/currency';

interface PortfolioStatsProps {
  data: PortfolioAnalytics | null;
  isLoading: boolean;
}

export function PortfolioStats({ data, isLoading }: PortfolioStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: 'Total Invested',
      value: formatINR(data.totalInvested),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Current Value',
      value: formatINR(data.currentValue),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Total P&L',
      value: `${data.totalPnL >= 0 ? '+' : ''}${formatINR(data.totalPnL)}`,
      icon: data.totalPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
      color: data.totalPnL >= 0 ? 'text-profit' : 'text-loss',
    },
    {
      label: '% Return',
      value: `${data.returnPercent >= 0 ? '+' : ''}${data.returnPercent.toFixed(2)}%`,
      icon: <Percent className="h-4 w-4" />,
      color: data.returnPercent >= 0 ? 'text-profit' : 'text-loss',
    },
    {
      label: 'Best Performer',
      value: data.bestPerformer?.symbol || 'N/A',
      sub: data.bestPerformer ? `${data.bestPerformer.pnlPercent >= 0 ? '+' : ''}${data.bestPerformer.pnlPercent.toFixed(1)}%` : '',
      icon: <Award className="h-4 w-4" />,
      color: 'text-profit',
    },
    {
      label: 'Worst Performer',
      value: data.worstPerformer?.symbol || 'N/A',
      sub: data.worstPerformer ? `${data.worstPerformer.pnlPercent >= 0 ? '+' : ''}${data.worstPerformer.pnlPercent.toFixed(1)}%` : '',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-loss',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              {stat.icon}
              {stat.label}
            </div>
            <p className={cn("text-lg font-bold mt-1", stat.color || '')}>
              {stat.value}
            </p>
            {stat.sub && (
              <p className={cn("text-xs", stat.color || 'text-muted-foreground')}>
                {stat.sub}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
