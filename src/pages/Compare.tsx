import { useState } from 'react';
import { useAllAssets } from '@/hooks/queries/useAssets';
import { useCompare, useMarketSearch, SearchResult } from '@/hooks/queries/useMarket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { Loader2, Search, GitCompare, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Compare() {
  const { data: allAssets } = useAllAssets();
  const [range, setRange] = useState('1m');
  const [asset1Search, setAsset1Search] = useState('');
  const [asset2Search, setAsset2Search] = useState('');
  const [selectedType, setSelectedType] = useState('stock');
  const [symbol1, setSymbol1] = useState('');
  const [symbol2, setSymbol2] = useState('');
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');

  const { data: search1 } = useMarketSearch(asset1Search, selectedType);
  const { data: search2 } = useMarketSearch(asset2Search, selectedType);
  const { data: compareData, isLoading } = useCompare(symbol1, symbol2, range);

  const selectAsset1 = (result: SearchResult) => {
    setSymbol1(result.symbol);
    setName1(result.name || result.symbol);
    setAsset1Search('');
  };

  const selectAsset2 = (result: SearchResult) => {
    setSymbol2(result.symbol);
    setName2(result.name || result.symbol);
    setAsset2Search('');
  };

  // Quick select from user's assets
  const userAssets = (allAssets || []).filter(a => a.type === selectedType || selectedType === 'all');

  const ranges = [
    { key: '1w', label: '1W' },
    { key: '1m', label: '1M' },
    { key: '3m', label: '3M' },
    { key: '6m', label: '6M' },
    { key: '1y', label: '1Y' },
  ];

  // Merge histories for chart
  const mergedData = (() => {
    if (!compareData) return [];
    const { asset1, asset2 } = compareData;

    const map1 = new Map(asset1.history.map(h => [h.date, h]));
    const map2 = new Map(asset2.history.map(h => [h.date, h]));

    const allDates = [...new Set([...asset1.history.map(h => h.date), ...asset2.history.map(h => h.date)])].sort();

    return allDates.map(date => ({
      date,
      [name1 || symbol1]: map1.get(date)?.value ?? null,
      [name2 || symbol2]: map2.get(date)?.value ?? null,
    }));
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Compare Assets</h1>
          <p className="text-muted-foreground">Compare performance of two assets side by side</p>
        </div>
      </div>

      {/* Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Select Assets to Compare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Asset Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stocks</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="mutual_fund">Mutual Funds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Asset 1</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={symbol1 || "Search or pick from your assets..."}
                  value={asset1Search}
                  onChange={e => setAsset1Search(e.target.value)}
                  className="pl-9"
                />
              </div>
              {asset1Search.length >= 2 && search1 && search1.length > 0 && (
                <div className="border rounded-md max-h-32 overflow-y-auto bg-card z-10 relative">
                  {search1.slice(0, 5).map(r => (
                    <button key={r.symbol} type="button" className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => selectAsset1(r)}>
                      <span className="font-medium">{r.symbol}</span>
                      <span className="text-muted-foreground ml-2">{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {symbol1 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-0.5 rounded bg-emerald/10 text-emerald font-medium">{symbol1}</span>
                  <span className="text-muted-foreground">{name1}</span>
                  <button className="text-xs text-destructive" onClick={() => { setSymbol1(''); setName1(''); }}>clear</button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Asset 2</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={symbol2 || "Search or pick from your assets..."}
                  value={asset2Search}
                  onChange={e => setAsset2Search(e.target.value)}
                  className="pl-9"
                />
              </div>
              {asset2Search.length >= 2 && search2 && search2.length > 0 && (
                <div className="border rounded-md max-h-32 overflow-y-auto bg-card z-10 relative">
                  {search2.slice(0, 5).map(r => (
                    <button key={r.symbol} type="button" className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => selectAsset2(r)}>
                      <span className="font-medium">{r.symbol}</span>
                      <span className="text-muted-foreground ml-2">{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {symbol2 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">{symbol2}</span>
                  <span className="text-muted-foreground">{name2}</span>
                  <button className="text-xs text-destructive" onClick={() => { setSymbol2(''); setName2(''); }}>clear</button>
                </div>
              )}
            </div>
          </div>

          {/* Quick select from user assets */}
          {userAssets.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Quick select from your assets:</p>
              <div className="flex flex-wrap gap-2">
                {userAssets.slice(0, 10).map(asset => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      if (!symbol1) { setSymbol1(asset.symbol); setName1(asset.name); }
                      else if (!symbol2) { setSymbol2(asset.symbol); setName2(asset.name); }
                    }}
                    className={cn(
                      "text-xs px-2 py-1 rounded-md border hover:bg-muted transition-colors",
                      (symbol1 === asset.symbol || symbol2 === asset.symbol) && "bg-emerald/10 border-emerald/30"
                    )}
                  >
                    {asset.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      {symbol1 && symbol2 && (
        <Card className="chart-glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Performance Comparison (% change)
            </CardTitle>
            <div className="flex gap-1">
              {ranges.map(r => (
                <Button key={r.key} variant={range === r.key ? 'secondary' : 'ghost'}
                  size="sm" className="h-7 text-xs px-2" onClick={() => setRange(r.key)}>
                  {r.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : mergedData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mergedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 170)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(1)}%`} />
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value?.toFixed(2)}%`, name]}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={name1 || symbol1}
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey={name2 || symbol2}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No comparison data available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats comparison */}
      {compareData && (
        <div className="grid gap-4 md:grid-cols-2">
          {[compareData.asset1, compareData.asset2].map((asset, i) => {
            const history = asset.history;
            const latest = history[history.length - 1];
            const first = history[0];
            const change = latest && first ? latest.value : 0;
            const latestPrice = latest?.price || 0;
            const colors = ['#10b981', '#3b82f6'];
            const names = [name1 || symbol1, name2 || symbol2];

            return (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }} />
                    <h3 className="font-semibold">{names[i]}</h3>
                    <span className="text-xs text-muted-foreground">({asset.symbol})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Current Price</p>
                      <p className="font-semibold">${latestPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Period Change</p>
                      <p className={cn("font-semibold", change >= 0 ? 'text-profit' : 'text-loss')}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Data Points</p>
                      <p className="font-semibold">{history.length}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Period</p>
                      <p className="font-semibold">{range.toUpperCase()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
