import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import type { PortfolioAnalytics } from '@/hooks/queries/usePortfolios';

interface AllocationChartProps {
  data: PortfolioAnalytics | null;
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6'];

export function AllocationChart({ data }: AllocationChartProps) {
  if (!data || data.allocation.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Asset Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No assets to display
        </CardContent>
      </Card>
    );
  }

  const chartData = data.allocation.map((a) => ({
    name: a.symbol,
    value: a.value,
    percent: a.percent,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Asset Allocation
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        <div className="flex flex-wrap gap-2 mt-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium">{item.percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
