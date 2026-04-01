import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Activity } from 'lucide-react';
import { usePriceHistory } from '@/hooks/queries/useMarket';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

interface PriceChartProps {
  symbol: string;
  assetType: string;
  formatPrice: (val: number) => string;
}

const ranges = [
  { key: '1d', label: '1D' },
  { key: '1w', label: '1W' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
];

export function PriceChart({ symbol, assetType, formatPrice }: PriceChartProps) {
  const [range, setRange] = useState('1m');
  const { data: history, isLoading } = usePriceHistory(symbol, range);

  const isPositive = history && history.length > 1
    ? history[history.length - 1].close >= history[0].close
    : true;

  const strokeColor = isPositive ? '#10b981' : '#ef4444';
  const gradientId = `priceGrad-${symbol}`;

  return (
    <Card className="chart-glow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Price Chart
        </CardTitle>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <Button
              key={r.key}
              variant={range === r.key ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history && history.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 170)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => {
                    if (range === '1d') return val;
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(v: number) => [formatPrice(v), 'Price']}
                  labelFormatter={(label) => label}
                  contentStyle={{
                    backgroundColor: 'oklch(0.15 0.02 170)',
                    border: '1px solid oklch(0.25 0.02 170)',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No price history available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
