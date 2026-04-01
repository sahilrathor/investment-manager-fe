import { Link } from 'react-router-dom';
import { useUndervaluedStocks, UndervaluedStock } from '@/hooks/queries/useMarket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Brain, TrendingDown, Award, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/currency';

function ScoreBar({ score, max = 25 }: { score: number; max?: number }) {
  const percent = Math.min(100, (score / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            percent >= 70 ? 'bg-profit' : percent >= 40 ? 'bg-yellow-500' : 'bg-loss'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8">{score.toFixed(0)}</span>
    </div>
  );
}

export function Undervalued() {
  const { data, isLoading } = useUndervaluedStocks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Undervalued Stocks</h1>
          <p className="text-muted-foreground">Top stocks by fundamental scoring</p>
        </div>
      </div>

      {/* Scoring Methodology */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Scoring Methodology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">PE Score (25%)</p>
              <p className="font-medium">Lower PE = Higher score</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Growth Score (25%)</p>
              <p className="font-medium">Higher growth = Higher score</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Debt Score (25%)</p>
              <p className="font-medium">Lower debt = Higher score</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">ROE Score (25%)</p>
              <p className="font-medium">Higher ROE = Higher score</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Low Score (25%)</p>
              <p className="font-medium">Near 52w low = Higher score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="h-4 w-4" />
            Top Undervalued Stocks
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <TrendingDown className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No undervalued stocks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>PE</TableHead>
                    <TableHead>Mkt Cap</TableHead>
                    <TableHead>PE Score</TableHead>
                    <TableHead>Growth</TableHead>
                    <TableHead>Debt</TableHead>
                    <TableHead>ROE</TableHead>
                    <TableHead>52w Low</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((stock, index) => (
                    <TableRow key={stock.symbol} className="cursor-pointer">
                      <TableCell className="font-medium">
                        <Badge variant={index < 3 ? 'success' : 'secondary'}>
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link to={`/assets/${stock.symbol}`} className="hover:text-emerald">
                          <div>
                            <p className="font-medium">{stock.symbol}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{stock.name}</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{formatINR(stock.currentPrice)}</TableCell>
                      <TableCell>{stock.peRatio?.toFixed(1) || '-'}</TableCell>
                      <TableCell>{stock.marketCap > 0 ? `${(stock.marketCap / 1e7).toFixed(0)} Cr` : '-'}</TableCell>
                      <TableCell><ScoreBar score={stock.scores.peScore} /></TableCell>
                      <TableCell><ScoreBar score={stock.scores.growthScore} /></TableCell>
                      <TableCell><ScoreBar score={stock.scores.debtScore} /></TableCell>
                      <TableCell><ScoreBar score={stock.scores.roeScore} /></TableCell>
                      <TableCell><ScoreBar score={stock.scores.lowScore} /></TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={stock.scores.totalScore >= 60 ? 'success' : stock.scores.totalScore >= 40 ? 'warning' : 'secondary'}
                          className="text-sm"
                        >
                          {stock.scores.totalScore.toFixed(0)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
