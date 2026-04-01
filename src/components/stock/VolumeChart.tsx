import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { PriceHistoryPoint } from '@/hooks/queries/useMarket';

interface VolumeChartProps {
  data: PriceHistoryPoint[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Volume
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 170)" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} hide />
              <YAxis tick={{ fontSize: 9 }} hide />
              <Tooltip
                formatter={(v: number) => [v.toLocaleString(), 'Volume']}
                contentStyle={{
                  backgroundColor: 'oklch(0.15 0.02 170)',
                  border: '1px solid oklch(0.25 0.02 170)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="volume" fill="#6366f1" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
