import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';
import { endpointsConfig } from '@/config/endpointsConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePriceHistory } from '@/hooks/queries/useMarket';
import { MoveAssetDialog } from '@/components/common/MoveAssetDialog';
import {
  ArrowLeft, TrendingUp, TrendingDown, ExternalLink,
  Newspaper, Calendar, BarChart3, Loader2, Plus,
  Activity, Clock, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import toast from 'react-hot-toast';

// Types
interface AssetDetailData {
  asset: {
    id: string; portfolioId: string; portfolioName: string; type: string;
    symbol: string; name: string; quantity: number; avgBuyPrice: number;
    currentPrice: number; useLivePrice: boolean; createdAt: string; updatedAt: string;
  };
  summary: {
    totalInvested: number; currentValue: number; pnl: number; pnlPercent: number;
    totalQuantity: number; avgBuyPrice: number; currentPrice: number;
  };
  transactions: Array<{
    id: string; type: 'buy' | 'sell'; quantity: number; pricePerUnit: number;
    totalAmount: number; date: string; notes: string | null;
  }>;
}

interface NewsData {
  news: Array<{
    id: number; headline: string; summary: string; source: string;
    url: string; image: string; datetime: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  sentiment: any;
}

interface EventsData {
  earnings: Array<{
    date: string; epsActual: number | null; epsEstimate: number | null;
    quarter: number; year: number; beat: boolean | null;
  }>;
  ratings: Array<{
    period: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number;
  }>;
}

interface FundamentalsData {
  marketCap?: number; peRatio?: number; eps?: number; week52High?: number;
  week52Low?: number; avgVolume?: number; dividendYield?: number;
  beta?: number; sector?: number; industry?: number;
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const config = {
    positive: { bg: 'bg-profit/10', text: 'text-profit', label: 'Positive' },
    negative: { bg: 'bg-loss/10', text: 'text-loss', label: 'Negative' },
    neutral: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Neutral' },
  }[sentiment] || { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Unknown' };

  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.bg, config.text)}>
      {config.label}
    </span>
  );
}

function PriceHistoryChart({ symbol, type }: { symbol: string; type: string }) {
  const [range, setRange] = useState('1m');
  const shouldFetch = type === 'stock' || type === 'mutual_fund' || type === 'crypto';
  const { data: history, isLoading } = usePriceHistory(shouldFetch ? symbol : '', range);

  if (!shouldFetch) return null;

  const ranges = [
    { key: '1w', label: '1W' },
    { key: '1m', label: '1M' },
    { key: '3m', label: '3M' },
    { key: '6m', label: '6M' },
    { key: '1y', label: '1Y' },
  ];

  return (
    <Card className="chart-glow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Price History
        </CardTitle>
        <div className="flex gap-1">
          {ranges.map(r => (
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
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 170)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Price']} />
                <Area type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#priceGrad)" />
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

function FundamentalsSection({ symbol, type }: { symbol: string; type: string }) {
  const shouldFetch = type === 'stock' || type === 'mutual_fund';

  const { data: fundamentals, isLoading } = useQuery({
    queryKey: [...queryKeys.market.all, 'fundamentals', symbol],
    queryFn: () => api.get<any>(endpointsConfig.MARKET.STOCK(symbol)),
    enabled: shouldFetch,
  });

  if (!shouldFetch) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Market Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : fundamentals ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-xs">Current Price</p>
              <p className="font-semibold text-lg">${fundamentals.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-xs">Change</p>
              <p className={cn("font-semibold text-lg", fundamentals.change >= 0 ? 'text-profit' : 'text-loss')}>
                {fundamentals.change >= 0 ? '+' : ''}{fundamentals.change?.toFixed(2)} ({fundamentals.changePercent?.toFixed(2)}%)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-xs">Day High</p>
              <p className="font-semibold">${fundamentals.high?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-xs">Day Low</p>
              <p className="font-semibold">${fundamentals.low?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-xs">Open</p>
              <p className="font-semibold">${fundamentals.open?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-xs">Previous Close</p>
              <p className="font-semibold">${fundamentals.previousClose?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">No market data available</p>
        )}
      </CardContent>
    </Card>
  );
}

function AddTransactionDialog({ assetId, onAdded }: { assetId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  const createTxn = useMutation({
    mutationFn: (data: any) => api.post(`/assets/${assetId}/transactions`, data),
    onSuccess: () => {
      toast.success('Transaction added');
      qc.invalidateQueries({ queryKey: queryKeys.assets.detail(assetId) });
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      setOpen(false);
      setQuantity(''); setPrice(''); setNotes('');
      onAdded();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !price) {
      toast.error('Quantity and price are required');
      return;
    }
    createTxn.mutate({ type, quantity: Number(quantity), pricePerUnit: Number(price), date, notes: notes || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('buy')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-colors",
                type === 'buy' ? "bg-loss/10 border-loss text-loss" : "border-input bg-background hover:bg-accent"
              )}
            >
              <TrendingDown className="h-4 w-4" /> Buy
            </button>
            <button
              type="button"
              onClick={() => setType('sell')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-colors",
                type === 'sell' ? "bg-profit/10 border-profit text-profit" : "border-input bg-background hover:bg-accent"
              )}
            >
              <TrendingUp className="h-4 w-4" /> Sell
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" step="any" placeholder="10" value={quantity} onChange={e => setQuantity(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Price per unit</Label>
              <Input type="number" step="any" placeholder="150" value={price} onChange={e => setPrice(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input placeholder="Bought on dip" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {quantity && price && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">${(Number(quantity) * Number(price)).toLocaleString()}</span>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={createTxn.isPending}>
            {createTxn.isPending ? 'Adding...' : `Add ${type === 'buy' ? 'Buy' : 'Sell'} Transaction`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AssetDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: detailData, isLoading: detailLoading, refetch: refetchDetail } = useQuery({
    queryKey: queryKeys.assets.detail(id!),
    queryFn: () => api.get<AssetDetailData>(endpointsConfig.ASSETS.DETAIL(id!)),
    enabled: !!id,
  });

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: queryKeys.assets.news(id!),
    queryFn: () => api.get<NewsData>(endpointsConfig.ASSETS.NEWS(id!)),
    enabled: !!id,
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.assets.events(id!),
    queryFn: () => api.get<EventsData>(endpointsConfig.ASSETS.EVENTS(id!)),
    enabled: !!id,
  });

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!detailData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Asset not found</p>
        <Link to="/portfolios"><Button variant="link">Back to Portfolios</Button></Link>
      </div>
    );
  }

  const { asset, summary, transactions } = detailData;
  const news = newsData?.news || [];
  const sentiment = newsData?.sentiment;
  const earnings = eventsData?.earnings || [];
  const ratings = eventsData?.ratings || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/portfolios/${asset.portfolioId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{asset.name}</h1>
              {asset.useLivePrice && (
                <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald/10 text-emerald">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse-green" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-muted-foreground">
              {asset.symbol} · {asset.type.replace('_', ' ').toUpperCase()} · {asset.portfolioName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MoveAssetDialog
            assetId={asset.id}
            currentPortfolioId={asset.portfolioId}
            assetName={asset.name}
            onMoved={() => refetchDetail()}
          />
          <AddTransactionDialog assetId={asset.id} onAdded={() => refetchDetail()} />
        </div>
      </div>

      {/* Investment Summary */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Quantity', value: summary.totalQuantity.toLocaleString() },
          { label: 'Avg Price', value: `$${summary.avgBuyPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
          { label: 'Current Price', value: `$${summary.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
          { label: 'Total Invested', value: `$${summary.totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
          { label: 'Current Value', value: `$${summary.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
          {
            label: 'P&L',
            value: `${summary.pnl >= 0 ? '+' : ''}$${summary.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            change: summary.pnlPercent,
          },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={cn(
                "text-lg font-bold mt-1",
                item.change !== undefined ? (item.change >= 0 ? 'text-profit' : 'text-loss') : ''
              )}>
                {item.value}
              </p>
              {item.change !== undefined && (
                <p className={cn("text-xs", item.change >= 0 ? 'text-profit' : 'text-loss')}>
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price History + Fundamentals */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PriceHistoryChart symbol={asset.symbol} type={asset.type} />
        </div>
        <FundamentalsSection symbol={asset.symbol} type={asset.type} />
      </div>

      {/* Sentiment */}
      {sentiment && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Market Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">News Score</p>
                <p className="font-semibold">{(sentiment.companyNewsScore * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Bullish</p>
                <p className="font-semibold text-profit">{(sentiment.bullishPercent * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Bearish</p>
                <p className="font-semibold text-loss">{(sentiment.bearishPercent * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Sector Avg</p>
                <p className="font-semibold">{(sentiment.sectorAverageNewsScore * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: News, Events, Transactions */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
          <TabsTrigger value="news">News ({news.length})</TabsTrigger>
          <TabsTrigger value="events">Events ({earnings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-1">Click "Add Transaction" to get started</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="p-4">Date</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Quantity</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(txn => (
                        <tr key={txn.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4 text-sm">{format(new Date(txn.date), 'MMM dd, yyyy')}</td>
                          <td className="p-4">
                            <span className={cn(
                              "text-xs font-medium px-2 py-1 rounded-full",
                              txn.type === 'buy' ? 'bg-loss/10 text-loss' : 'bg-profit/10 text-profit'
                            )}>
                              {txn.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-sm">{txn.quantity}</td>
                          <td className="p-4 text-sm">${txn.pricePerUnit.toLocaleString()}</td>
                          <td className="p-4 text-sm font-medium">${txn.totalAmount.toLocaleString()}</td>
                          <td className="p-4 text-sm text-muted-foreground">{txn.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="news" className="space-y-3">
          {newsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : news.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Newspaper className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No recent news</p>
              </CardContent>
            </Card>
          ) : (
            news.map(item => (
              <div key={item.id} className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                {item.image && (
                  <img src={item.image} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm line-clamp-2">{item.headline}</h4>
                    <SentimentBadge sentiment={item.sentiment} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {item.source} · {item.datetime ? format(new Date(item.datetime), 'MMM dd, HH:mm') : ''}
                    </span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" /> Read
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {eventsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {ratings.length > 0 && (() => {
                const latest = ratings[0];
                const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
                if (total === 0) return null;
                return (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Analyst Ratings ({latest.period})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                        {latest.strongBuy > 0 && <div className="bg-green-600" style={{ width: `${(latest.strongBuy / total) * 100}%` }} />}
                        {latest.buy > 0 && <div className="bg-green-400" style={{ width: `${(latest.buy / total) * 100}%` }} />}
                        {latest.hold > 0 && <div className="bg-yellow-400" style={{ width: `${(latest.hold / total) * 100}%` }} />}
                        {latest.sell > 0 && <div className="bg-red-400" style={{ width: `${(latest.sell / total) * 100}%` }} />}
                        {latest.strongSell > 0 && <div className="bg-red-600" style={{ width: `${(latest.strongSell / total) * 100}%` }} />}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Strong Buy: {latest.strongBuy}</span>
                        <span>Buy: {latest.buy}</span>
                        <span>Hold: {latest.hold}</span>
                        <span>Sell: {latest.sell}</span>
                        <span>Strong Sell: {latest.strongSell}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {earnings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No earnings data</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Earnings History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Quarter</th>
                          <th className="py-2 pr-4">EPS Actual</th>
                          <th className="py-2 pr-4">EPS Estimate</th>
                          <th className="py-2 pr-4">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.map((e, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-4">{e.date}</td>
                            <td className="py-2 pr-4">Q{e.quarter} {e.year}</td>
                            <td className="py-2 pr-4">{e.epsActual != null ? `$${e.epsActual.toFixed(2)}` : '-'}</td>
                            <td className="py-2 pr-4">{e.epsEstimate != null ? `$${e.epsEstimate.toFixed(2)}` : '-'}</td>
                            <td className="py-2 pr-4">
                              {e.beat === true && <span className="text-profit font-medium">Beat</span>}
                              {e.beat === false && <span className="text-loss font-medium">Missed</span>}
                              {e.beat === null && <span className="text-muted-foreground">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
