import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Coins, TrendingUp, TrendingDown, Crown, Database, BarChart3
} from 'lucide-react';
import type { CryptoDetails } from '@/hooks/queries/useMarket';

interface CryptoMetricsProps {
  data: CryptoDetails | null;
  isLoading: boolean;
}

function formatNumber(val: number): string {
  if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val.toFixed(2);
}

export function CryptoMetrics({ data, isLoading }: CryptoMetricsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Crypto Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const athDistance = data.ath > 0 ? ((data.ath - data.currentPrice) / data.ath) * 100 : 0;
  const atlDistance = data.atl > 0 ? ((data.currentPrice - data.atl) / data.atl) * 100 : 0;

  const metrics = [
    {
      label: 'Market Cap',
      value: `$${formatNumber(data.marketCap)}`,
      icon: <BarChart3 className="h-3 w-3" />,
    },
    {
      label: 'Market Rank',
      value: data.marketCapRank ? `#${data.marketCapRank}` : 'N/A',
      icon: <Crown className="h-3 w-3" />,
    },
    {
      label: '24h Change',
      value: `${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%`,
      icon: data.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />,
      color: data.change24h >= 0 ? 'text-profit' : 'text-loss',
    },
    {
      label: '7d Change',
      value: `${data.change7d >= 0 ? '+' : ''}${data.change7d.toFixed(2)}%`,
      icon: data.change7d >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />,
      color: data.change7d >= 0 ? 'text-profit' : 'text-loss',
    },
    {
      label: 'All-Time High',
      value: `$${formatNumber(data.ath)}`,
      sub: `${athDistance.toFixed(1)}% below`,
    },
    {
      label: 'All-Time Low',
      value: `$${formatNumber(data.atl)}`,
      sub: `${atlDistance.toFixed(0)}% above`,
    },
    {
      label: 'Circulating Supply',
      value: formatNumber(data.circulatingSupply),
      icon: <Database className="h-3 w-3" />,
    },
    {
      label: 'Total Supply',
      value: data.totalSupply > 0 ? formatNumber(data.totalSupply) : 'Unlimited',
    },
    {
      label: '24h High',
      value: `$${formatNumber(data.high24h)}`,
    },
    {
      label: '24h Low',
      value: `$${formatNumber(data.low24h)}`,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Coins className="h-4 w-4" />
          Crypto Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                {m.icon}
                {m.label}
              </div>
              <p className={cn("font-semibold text-sm", m.color || '')}>{m.value}</p>
              {m.sub && <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
