import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';
import { endpointsConfig } from '@/config/endpointsConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePriceHistory, useStockFundamentals, useCryptoDetails } from '@/hooks/queries/useMarket';
import { MoveAssetDialog } from '@/components/common/MoveAssetDialog';
import { EditTransactionDialog } from '@/components/common/EditTransactionDialog';
import { PriceChart } from '@/components/stock/PriceChart';
import { VolumeChart } from '@/components/stock/VolumeChart';
import { FundamentalsTable } from '@/components/stock/FundamentalsTable';
import { OHLCCard } from '@/components/stock/OHLCCard';
import { WeekRangeBar } from '@/components/stock/WeekRangeBar';
import { AISummary } from '@/components/stock/AISummary';
import { CryptoMetrics } from '@/components/crypto/CryptoMetrics';
import { formatCurrency, formatINR, formatUSD, isUSDAsset } from '@/lib/currency';
import {
  ArrowLeft, TrendingUp, TrendingDown, ExternalLink,
  Newspaper, Calendar, BarChart3, Loader2, Plus,
  Activity, Clock, DollarSign, Brain, Info, LineChart
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

function AddTransactionDialog({ assetId, onAdded, assetType }: { assetId: string; onAdded: () => void; assetType: string }) {
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
              <span className="font-semibold">{formatCurrency(Number(quantity) * Number(price), assetType)}</span>
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

function OverviewTab({ asset, summary, sentiment, news, newsLoading, earnings, ratings }: any) {
  const isCrypto = asset.type === 'crypto';
  const { data: fundamentals, isLoading: fundLoading } = useStockFundamentals(isCrypto ? '' : asset.symbol);
  const { data: cryptoDetails, isLoading: cryptoLoading } = useCryptoDetails(isCrypto ? asset.symbol : '');

  const formatPrice = (val: number) => formatCurrency(val, asset.type);

  return (
    <div className="space-y-6">
      {/* 52 Week Range (stocks only) */}
      {!isCrypto && fundamentals && (
        <WeekRangeBar
          currentPrice={fundamentals.currentPrice}
          weekHigh={fundamentals.fiftyTwoWeekHigh}
          weekLow={fundamentals.fiftyTwoWeekLow}
          formatPrice={formatPrice}
        />
      )}

      {/* Quick Stats Row */}
      {!isCrypto && fundamentals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Market Cap</p>
            <p className="font-semibold text-sm">
              {fundamentals.marketCap > 0 ? `${formatINR(fundamentals.marketCap)}` : 'N/A'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">PE Ratio</p>
            <p className="font-semibold text-sm">{fundamentals.peRatio?.toFixed(1) || 'N/A'}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">EPS</p>
            <p className="font-semibold text-sm">{fundamentals.eps ? formatINR(fundamentals.eps) : 'N/A'}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Dividend Yield</p>
            <p className="font-semibold text-sm">
              {fundamentals.dividendYield ? `${(fundamentals.dividendYield * 100).toFixed(2)}%` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Crypto Quick Stats */}
      {isCrypto && cryptoDetails && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Market Cap</p>
            <p className="font-semibold text-sm">${(cryptoDetails.marketCap / 1e9).toFixed(2)}B</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">24h Change</p>
            <p className={cn("font-semibold text-sm", cryptoDetails.change24h >= 0 ? 'text-profit' : 'text-loss')}>
              {cryptoDetails.change24h >= 0 ? '+' : ''}{cryptoDetails.change24h.toFixed(2)}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Market Rank</p>
            <p className="font-semibold text-sm">#{cryptoDetails.marketCapRank || 'N/A'}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">ATH</p>
            <p className="font-semibold text-sm">${cryptoDetails.ath.toLocaleString()}</p>
          </div>
        </div>
      )}

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

      {/* Recent News */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Recent News
          </CardTitle>
        </CardHeader>
        <CardContent>
          {newsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : news.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">No recent news</p>
          ) : (
            <div className="space-y-3">
              {news.slice(0, 3).map((item: any) => (
                <div key={item.id} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  {item.image && (
                    <img src={item.image} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm line-clamp-1">{item.headline}</h4>
                      <SentimentBadge sentiment={item.sentiment} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.summary}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {item.source} · {item.datetime ? format(new Date(item.datetime), 'MMM dd') : ''}
                      </span>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald hover:underline">
                        Read
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FinancialsTab({ asset }: any) {
  const isCrypto = asset.type === 'crypto';
  const { data: fundamentals, isLoading: fundLoading } = useStockFundamentals(isCrypto ? '' : asset.symbol);
  const { data: cryptoDetails, isLoading: cryptoLoading } = useCryptoDetails(isCrypto ? asset.symbol : '');
  const { data: history } = usePriceHistory(asset.symbol, '1m');

  const formatPrice = (val: number) => formatCurrency(val, asset.type);

  if (isCrypto) {
    return <CryptoMetrics data={cryptoDetails || null} isLoading={cryptoLoading} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <FundamentalsTable data={fundamentals || {
          currentPrice: 0, marketCap: 0, fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0,
          peRatio: null, forwardPE: null, pbRatio: null, eps: null, bookValue: null,
          roe: null, debtToEquity: null, revenueGrowth: null, profitGrowth: null,
          dividendYield: null, currentRatio: null, quickRatio: null, operatingMargins: null,
          profitMargins: null, grossMargins: null, revenuePerShare: null, targetMeanPrice: null,
          recommendationKey: null, numberOfAnalystOpinions: null, distanceFrom52WeekHigh: 0,
          distanceFrom52WeekLow: 0, sector: null,
        }} />
        {history && history.length > 0 && (
          <OHLCCard
            open={history[history.length - 1]?.close || 0}
            high={history[history.length - 1]?.high || 0}
            low={history[history.length - 1]?.low || 0}
            close={history[history.length - 1]?.close || 0}
            volume={history[history.length - 1]?.volume || 0}
            formatPrice={formatPrice}
          />
        )}
      </div>

      {/* Analyst Recommendation */}
      {fundamentals?.recommendationKey && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Analyst Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant={
                ['strongBuy', 'buy'].includes(fundamentals.recommendationKey) ? 'success' :
                fundamentals.recommendationKey === 'hold' ? 'warning' : 'destructive'
              } className="text-sm">
                {fundamentals.recommendationKey.replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
              {fundamentals.targetMeanPrice && (
                <span className="text-sm text-muted-foreground">
                  Target: {formatINR(fundamentals.targetMeanPrice)}
                </span>
              )}
              {fundamentals.numberOfAnalystOpinions && (
                <span className="text-xs text-muted-foreground">
                  ({fundamentals.numberOfAnalystOpinions} analysts)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChartTab({ asset }: any) {
  const isCrypto = asset.type === 'crypto';
  const [range, setRange] = useState('1m');
  const { data: history, isLoading } = usePriceHistory(asset.symbol, range);

  const formatPrice = (val: number) => formatCurrency(val, asset.type);

  const isPositive = history && history.length > 1
    ? history[history.length - 1].close >= history[0].close
    : true;

  return (
    <div className="space-y-6">
      <PriceChart symbol={asset.symbol} assetType={asset.type} formatPrice={formatPrice} />
      {history && <VolumeChart data={history} />}
    </div>
  );
}

function AISummaryTab({ asset }: any) {
  const isCrypto = asset.type === 'crypto';
  const { data: fundamentals, isLoading } = useStockFundamentals(isCrypto ? '' : asset.symbol);

  if (isCrypto) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">AI Summary is available for stocks only</p>
        </CardContent>
      </Card>
    );
  }

  return <AISummary data={fundamentals || null} isLoading={isLoading} />;
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96 w-full" />
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
  const isCrypto = asset.type === 'crypto';

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
                <Badge variant="success" className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse-green" />
                  LIVE
                </Badge>
              )}
              <Badge variant="outline">{asset.type.replace('_', ' ').toUpperCase()}</Badge>
            </div>
            <p className="text-muted-foreground">
              {asset.symbol} · {asset.portfolioName}
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
          <AddTransactionDialog assetId={asset.id} onAdded={() => refetchDetail()} assetType={asset.type} />
        </div>
      </div>

      {/* Investment Summary */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Quantity', value: summary.totalQuantity.toLocaleString() },
          { label: 'Avg Price', value: formatCurrency(summary.avgBuyPrice, asset.type) },
          { label: 'Current Price', value: formatCurrency(summary.currentPrice, asset.type) },
          { label: 'Total Invested', value: formatCurrency(summary.totalInvested, asset.type) },
          { label: 'Current Value', value: formatCurrency(summary.currentValue, asset.type) },
          {
            label: 'P&L',
            value: `${summary.pnl >= 0 ? '+' : ''}${formatCurrency(summary.pnl, asset.type)}`,
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

      {/* Main Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="financials" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="chart" className="flex items-center gap-1.5">
            <LineChart className="h-3.5 w-3.5" />
            Chart
          </TabsTrigger>
          <TabsTrigger value="ai-summary" className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            AI Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            asset={asset}
            summary={summary}
            sentiment={sentiment}
            news={news}
            newsLoading={newsLoading}
            earnings={earnings}
            ratings={ratings}
          />
        </TabsContent>

        <TabsContent value="financials">
          <FinancialsTab asset={asset} />
        </TabsContent>

        <TabsContent value="chart">
          <ChartTab asset={asset} />
        </TabsContent>

        <TabsContent value="ai-summary">
          <AISummaryTab asset={asset} />
        </TabsContent>
      </Tabs>

      {/* Transactions, News, Events (bottom tabs) */}
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
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(txn => (
                        <tr key={txn.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4 text-sm">{format(new Date(txn.date), 'MMM dd, yyyy')}</td>
                          <td className="p-4">
                            <Badge variant={txn.type === 'buy' ? 'destructive' : 'success'}>
                              {txn.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm">{txn.quantity}</td>
                          <td className="p-4 text-sm">{formatCurrency(txn.pricePerUnit, asset.type)}</td>
                          <td className="p-4 text-sm font-medium">{formatCurrency(txn.totalAmount, asset.type)}</td>
                          <td className="p-4 text-sm text-muted-foreground">{txn.notes || '-'}</td>
                          <td className="p-4">
                            <EditTransactionDialog transaction={{ ...txn, assetId: asset.id }} />
                          </td>
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
                        {earnings.map((e: any, i: number) => (
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
