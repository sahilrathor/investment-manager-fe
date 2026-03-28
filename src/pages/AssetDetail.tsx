import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';
import { endpointsConfig } from '@/config/endpointsConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, TrendingUp, TrendingDown, ExternalLink,
  Newspaper, Calendar, BarChart3, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Types
interface AssetDetailData {
  asset: {
    id: string;
    portfolioId: string;
    portfolioName: string;
    type: string;
    symbol: string;
    name: string;
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
    useLivePrice: boolean;
    createdAt: string;
    updatedAt: string;
  };
  summary: {
    totalInvested: number;
    currentValue: number;
    pnl: number;
    pnlPercent: number;
    totalQuantity: number;
    avgBuyPrice: number;
    currentPrice: number;
  };
  transactions: Array<{
    id: string;
    type: 'buy' | 'sell';
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    date: string;
    notes: string | null;
  }>;
}

interface NewsData {
  news: Array<{
    id: number;
    headline: string;
    summary: string;
    source: string;
    url: string;
    image: string;
    datetime: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
    category: string;
  }>;
  sentiment: {
    buzz: any;
    companyNewsScore: number;
    sectorAverageBullishPercent: number;
    sectorAverageNewsScore: number;
    bullishPercent: number;
    bearishPercent: number;
  } | null;
}

interface EventsData {
  earnings: Array<{
    date: string;
    epsActual: number | null;
    epsEstimate: number | null;
    hour: string;
    quarter: number;
    revenueActual: number | null;
    revenueEstimate: number | null;
    year: number;
    beat: boolean | null;
  }>;
  ratings: Array<{
    period: string;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  }>;
}

// Sub-components
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

function NewsCard({ item }: { item: NewsData['news'][0] }) {
  return (
    <div className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      {item.image && (
        <img
          src={item.image}
          alt=""
          className="w-16 h-16 rounded object-cover flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
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
              <ExternalLink className="h-3 w-3 mr-1" />
              Read
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

function AnalystRatings({ ratings }: { ratings: EventsData['ratings'] }) {
  if (!ratings || ratings.length === 0) return null;

  const latest = ratings[0];
  const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analyst Ratings (Latest: {latest.period})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 h-4 rounded-full overflow-hidden">
          {latest.strongBuy > 0 && (
            <div className="bg-green-600" style={{ width: `${(latest.strongBuy / total) * 100}%` }} title={`Strong Buy: ${latest.strongBuy}`} />
          )}
          {latest.buy > 0 && (
            <div className="bg-green-400" style={{ width: `${(latest.buy / total) * 100}%` }} title={`Buy: ${latest.buy}`} />
          )}
          {latest.hold > 0 && (
            <div className="bg-yellow-400" style={{ width: `${(latest.hold / total) * 100}%` }} title={`Hold: ${latest.hold}`} />
          )}
          {latest.sell > 0 && (
            <div className="bg-red-400" style={{ width: `${(latest.sell / total) * 100}%` }} title={`Sell: ${latest.sell}`} />
          )}
          {latest.strongSell > 0 && (
            <div className="bg-red-600" style={{ width: `${(latest.strongSell / total) * 100}%` }} title={`Strong Sell: ${latest.strongSell}`} />
          )}
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
}

// Main component
export function AssetDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: detailData, isLoading: detailLoading } = useQuery({
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
        <Link to="/portfolios">
          <Button variant="link">Back to Portfolios</Button>
        </Link>
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
      <div className="flex items-center gap-4">
        <Link to={`/portfolios/${asset.portfolioId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{asset.name}</h1>
            {asset.useLivePrice && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                LIVE
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            {asset.symbol} · {asset.type.replace('_', ' ').toUpperCase()} · {asset.portfolioName}
          </p>
        </div>
      </div>

      {/* Investment Summary */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Quantity" value={summary.totalQuantity.toLocaleString()} />
        <StatCard title="Avg Price" value={`$${summary.avgBuyPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <StatCard title="Current Price" value={`$${summary.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <StatCard title="Total Invested" value={`$${summary.totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <StatCard title="Current Value" value={`$${summary.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <StatCard
          title="P&L"
          value={`${summary.pnl >= 0 ? '+' : ''}$${summary.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          change={summary.pnlPercent}
        />
      </div>

      {/* Market Data */}
      {sentiment && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Market Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">News Score</p>
                <p className="font-medium">{(sentiment.companyNewsScore * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bullish</p>
                <p className="font-medium text-profit">{(sentiment.bullishPercent * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bearish</p>
                <p className="font-medium text-loss">{(sentiment.bearishPercent * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sector Avg</p>
                <p className="font-medium">{(sentiment.sectorAverageNewsScore * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: News, Events, Transactions */}
      <Tabs defaultValue="news">
        <TabsList>
          <TabsTrigger value="news" className="flex items-center gap-1">
            <Newspaper className="h-3.5 w-3.5" />
            News ({news.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Events ({earnings.length})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            Transactions ({transactions.length})
          </TabsTrigger>
        </TabsList>

        {/* News Tab */}
        <TabsContent value="news" className="space-y-4">
          {newsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : news.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Newspaper className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No recent news</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {eventsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <AnalystRatings ratings={ratings} />

              {earnings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No upcoming earnings</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Earnings History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
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
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No transactions yet</p>
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
                      {transactions.map((txn) => (
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
      </Tabs>
    </div>
  );
}
