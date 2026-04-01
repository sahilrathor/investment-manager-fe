import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CandlestickChart } from 'lucide-react';

interface OHLCCardProps {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  formatPrice: (val: number) => string;
}

export function OHLCCard({ open, high, low, close, volume, formatPrice }: OHLCCardProps) {
  const isPositive = close >= open;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CandlestickChart className="h-4 w-4" />
          OHLC
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="font-semibold text-sm">{formatPrice(open)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">High</p>
            <p className="font-semibold text-sm text-profit">{formatPrice(high)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Low</p>
            <p className="font-semibold text-sm text-loss">{formatPrice(low)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Close</p>
            <p className={cn("font-semibold text-sm", isPositive ? 'text-profit' : 'text-loss')}>
              {formatPrice(close)}
            </p>
          </div>
        </div>
        {volume !== undefined && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="font-semibold text-sm">{volume.toLocaleString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
