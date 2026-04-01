import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useScreener, ScreenerStock } from '@/hooks/queries/useMarket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Filter, ArrowUpDown, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/currency';

export function Screener() {
  const [filters, setFilters] = useState({
    peMax: 0,
    marketCapMin: 0,
    revenueGrowthMin: 0,
    profitGrowthMin: 0,
    roeMin: 0,
    near52WeekLow: false,
    lowDebt: false,
    sortBy: 'marketCap',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  });

  const screenerFilters = {
    ...(filters.peMax > 0 && { peMax: filters.peMax }),
    ...(filters.marketCapMin > 0 && { marketCapMin: filters.marketCapMin * 1e7 }),
    ...(filters.revenueGrowthMin > 0 && { revenueGrowthMin: filters.revenueGrowthMin / 100 }),
    ...(filters.profitGrowthMin > 0 && { profitGrowthMin: filters.profitGrowthMin / 100 }),
    ...(filters.roeMin > 0 && { roeMin: filters.roeMin / 100 }),
    ...(filters.near52WeekLow && { near52WeekLow: true }),
    ...(filters.lowDebt && { lowDebt: true }),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page: filters.page,
    limit: filters.limit,
  };

  const { data, isLoading, isFetching } = useScreener(screenerFilters);

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  };

  const sortColumns = [
    { key: 'symbol', label: 'Symbol' },
    { key: 'currentPrice', label: 'Price' },
    { key: 'marketCap', label: 'Mkt Cap' },
    { key: 'peRatio', label: 'PE' },
    { key: 'roe', label: 'ROE' },
    { key: 'revenueGrowth', label: 'Rev Gr' },
    { key: 'distanceFrom52WeekLow', label: '52w Low%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Screener</h1>
          <p className="text-muted-foreground">Filter stocks by fundamental metrics</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters Panel */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* PE Ratio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Max PE Ratio</Label>
                <span className="text-xs text-muted-foreground">
                  {filters.peMax > 0 ? `< ${filters.peMax}` : 'Any'}
                </span>
              </div>
              <Slider
                value={[filters.peMax]}
                onValueChange={([v]) => setFilters((p) => ({ ...p, peMax: v, page: 1 }))}
                max={100}
                step={5}
              />
            </div>

            {/* Market Cap */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Min Market Cap (Cr)</Label>
                <span className="text-xs text-muted-foreground">
                  {filters.marketCapMin > 0 ? `> ${filters.marketCapMin} Cr` : 'Any'}
                </span>
              </div>
              <Slider
                value={[filters.marketCapMin]}
                onValueChange={([v]) => setFilters((p) => ({ ...p, marketCapMin: v, page: 1 }))}
                max={50000}
                step={500}
              />
            </div>

            {/* Revenue Growth */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Min Revenue Growth %</Label>
                <span className="text-xs text-muted-foreground">
                  {filters.revenueGrowthMin > 0 ? `> ${filters.revenueGrowthMin}%` : 'Any'}
                </span>
              </div>
              <Slider
                value={[filters.revenueGrowthMin]}
                onValueChange={([v]) => setFilters((p) => ({ ...p, revenueGrowthMin: v, page: 1 }))}
                max={100}
                step={5}
              />
            </div>

            {/* Profit Growth */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Min Profit Growth %</Label>
                <span className="text-xs text-muted-foreground">
                  {filters.profitGrowthMin > 0 ? `> ${filters.profitGrowthMin}%` : 'Any'}
                </span>
              </div>
              <Slider
                value={[filters.profitGrowthMin]}
                onValueChange={([v]) => setFilters((p) => ({ ...p, profitGrowthMin: v, page: 1 }))}
                max={100}
                step={5}
              />
            </div>

            {/* ROE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Min ROE %</Label>
                <span className="text-xs text-muted-foreground">
                  {filters.roeMin > 0 ? `> ${filters.roeMin}%` : 'Any'}
                </span>
              </div>
              <Slider
                value={[filters.roeMin]}
                onValueChange={([v]) => setFilters((p) => ({ ...p, roeMin: v, page: 1 }))}
                max={50}
                step={2}
              />
            </div>

            {/* Toggle Filters */}
            <div className="space-y-3">
              <button
                onClick={() => setFilters((p) => ({ ...p, near52WeekLow: !p.near52WeekLow, page: 1 }))}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors",
                  filters.near52WeekLow ? "bg-primary/10 border-primary" : "border-input hover:bg-accent"
                )}
              >
                <span>Near 52-week Low</span>
                <div className={cn(
                  "w-8 h-4 rounded-full transition-colors",
                  filters.near52WeekLow ? "bg-primary" : "bg-muted"
                )}>
                  <div className={cn(
                    "w-3 h-3 rounded-full bg-white mt-0.5 transition-transform",
                    filters.near52WeekLow ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </div>
              </button>

              <button
                onClick={() => setFilters((p) => ({ ...p, lowDebt: !p.lowDebt, page: 1 }))}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors",
                  filters.lowDebt ? "bg-primary/10 border-primary" : "border-input hover:bg-accent"
                )}
              >
                <span>Low Debt</span>
                <div className={cn(
                  "w-8 h-4 rounded-full transition-colors",
                  filters.lowDebt ? "bg-primary" : "bg-muted"
                )}>
                  <div className={cn(
                    "w-3 h-3 rounded-full bg-white mt-0.5 transition-transform",
                    filters.lowDebt ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </div>
              </button>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label className="text-xs">Sort By</Label>
              <Select value={filters.sortBy} onValueChange={(v) => setFilters((p) => ({ ...p, sortBy: v, page: 1 }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketCap">Market Cap</SelectItem>
                  <SelectItem value="peRatio">PE Ratio</SelectItem>
                  <SelectItem value="roe">ROE</SelectItem>
                  <SelectItem value="revenueGrowth">Revenue Growth</SelectItem>
                  <SelectItem value="profitGrowth">Profit Growth</SelectItem>
                  <SelectItem value="currentPrice">Price</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setFilters({
                peMax: 0, marketCapMin: 0, revenueGrowthMin: 0, profitGrowthMin: 0,
                roeMin: 0, near52WeekLow: false, lowDebt: false,
                sortBy: 'marketCap', sortOrder: 'desc', page: 1, limit: 20,
              })}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Search className="h-4 w-4" />
                Results {data && `(${data.total})`}
              </CardTitle>
              {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !data || data.stocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Search className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No stocks match your filters</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your criteria</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {sortColumns.map((col) => (
                          <TableHead
                            key={col.key}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort(col.key)}
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              {filters.sortBy === col.key && (
                                <ArrowUpDown className="h-3 w-3" />
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.stocks.map((stock) => (
                        <TableRow key={stock.symbol} className="cursor-pointer">
                          <TableCell>
                            <Link to={`/assets/${stock.symbol}`} className="hover:text-emerald">
                              <div>
                                <p className="font-medium">{stock.symbol}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{stock.name}</p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium">{formatINR(stock.currentPrice)}</TableCell>
                          <TableCell>{stock.marketCap > 0 ? `${(stock.marketCap / 1e7).toFixed(0)} Cr` : '-'}</TableCell>
                          <TableCell>{stock.peRatio?.toFixed(1) || '-'}</TableCell>
                          <TableCell>{stock.roe !== null ? `${(stock.roe * 100).toFixed(1)}%` : '-'}</TableCell>
                          <TableCell className={cn(
                            stock.revenueGrowth !== null && stock.revenueGrowth > 0 ? 'text-profit' : stock.revenueGrowth !== null && stock.revenueGrowth < 0 ? 'text-loss' : ''
                          )}>
                            {stock.revenueGrowth !== null ? `${(stock.revenueGrowth * 100).toFixed(1)}%` : '-'}
                          </TableCell>
                          <TableCell>{stock.distanceFrom52WeekLow?.toFixed(1) || '-'}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {data.page} of {data.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={data.page <= 1}
                        onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={data.page >= data.totalPages}
                        onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
