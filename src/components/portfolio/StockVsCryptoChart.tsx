import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layers } from 'lucide-react';

interface StockVsCryptoChartProps {
  stocks: number;
  crypto: number;
}

const COLORS = ['#10b981', '#f59e0b'];

export function StockVsCryptoChart({ stocks, crypto }: StockVsCryptoChartProps) {
  if (stocks === 0 && crypto === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Stock vs Crypto
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No assets to display
        </CardContent>
      </Card>
    );
  }

  const total = stocks + crypto;
  const chartData = [
    { name: 'Stocks', value: stocks, percent: (stocks / total) * 100 },
    { name: 'Crypto', value: crypto, percent: (crypto / total) * 100 },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Stock vs Crypto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: 'oklch(0.15 0.02 170)',
                  border: '1px solid oklch(0.25 0.02 170)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium">{item.percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
