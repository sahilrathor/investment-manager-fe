import { Link } from 'react-router-dom';
import { usePortfolios } from '@/hooks/queries/usePortfolios';
import { useAllTransactions } from '@/hooks/queries/useTransactions';
import { useAllAssets } from '@/hooks/queries/useAssets';
import { useSips } from '@/hooks/queries/useSips';
import { StatCard } from '@/components/common/StatCard';
import { IndicesTicker } from '@/components/common/IndicesTicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet, TrendingUp, TrendingDown, ArrowLeftRight, PieChart,
  ArrowUpRight, ArrowDownRight, Repeat, GitCompare
} from 'lucide-react';
import { format } from 'date-fns';
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, CartesianGrid, XAxis, YAxis, BarChart, Bar
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export function Dashboard() {
  const { data: portfolios } = usePortfolios();
  const { data: transactions } = useAllTransactions();
  const { data: assets } = useAllAssets();
  const { data: sips } = useSips();

  const totalValue = (assets || []).reduce((sum, a) => sum + a.quantity * (a.currentPrice || 0), 0);
  const totalInvested = (assets || []).reduce((sum, a) => sum + a.quantity * (a.avgBuyPrice || 0), 0);
  const totalPnL = totalValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Asset allocation by type
  const allocationByType = (assets || []).reduce((acc, asset) => {
    const value = asset.quantity * (asset.currentPrice || 0);
    acc[asset.type] = (acc[asset.type] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  const allocationData = Object.entries(allocationByType)
    .filter(([, value]) => value > 0)
    .map(([type, value], i) => ({
      name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      color: COLORS[i % COLORS.length],
    }));

  // Top performers
  const assetsWithPnL = (assets || []).map(a => {
    const value = a.quantity * (a.currentPrice || 0);
    const invested = a.quantity * (a.avgBuyPrice || 0);
    const pnl = value - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    return { ...a, value, invested, pnl, pnlPct };
  }).sort((a, b) => b.pnlPct - a.pnlPct);

  const topPerformers = assetsWithPnL.slice(0, 5);

  // Portfolio value history from transactions
  const portfolioHistory = (() => {
    if (!transactions || transactions.length === 0) return [];
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let running = 0;
    const points: { date: string; value: number }[] = [];
    sorted.forEach(txn => {
      running += txn.type === 'buy' ? txn.totalAmount : -txn.totalAmount;
      points.push({ date: format(new Date(txn.date), 'MMM dd'), value: Math.max(0, running) });
    });
    return points.slice(-12);
  })();

  // Monthly activity
  const monthlyPnL = (() => {
    if (!transactions || transactions.length === 0) return [];
    const months: Record<string, number> = {};
    transactions.forEach(txn => {
      const month = format(new Date(txn.date), 'MMM');
      months[month] = (months[month] || 0) + (txn.type === 'buy' ? -txn.totalAmount : txn.totalAmount);
    });
    return Object.entries(months).slice(-6).map(([month, pnl]) => ({
      month, pnl, fill: pnl >= 0 ? '#10b981' : '#ef4444',
    }));
  })();

  const recentTransactions = (transactions || []).slice(0, 5);
  const activeSips = (sips || []).filter(s => s.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your investments</p>
        </div>
        <Link to="/compare">
          <Button variant="outline" size="sm">
            <GitCompare className="h-4 w-4 mr-1" /> Compare Assets
          </Button>
        </Link>
      </div>

      <IndicesTicker />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl p-6 card-gradient-emerald text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/80">Total Value</p>
            <Wallet className="h-5 w-5 text-white/60" />
          </div>
          <p className="text-3xl font-bold mt-2">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className="text-sm text-white/70 mt-1">{assets?.length || 0} assets</p>
        </div>

        <Card className="border-2 border-emerald/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-emerald">Total Invested</p>
              <TrendingUp className="h-5 w-5 text-emerald" />
            </div>
            <p className="text-3xl font-bold mt-2">${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-muted-foreground mt-1">Cost basis</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
              {totalPnL >= 0 ? <ArrowUpRight className="h-5 w-5 text-profit" /> : <ArrowDownRight className="h-5 w-5 text-loss" />}
            </div>
            <p className={cn("text-3xl font-bold mt-2", totalPnL >= 0 ? 'text-profit' : 'text-loss')}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className={cn("text-sm mt-1", totalPnL >= 0 ? 'text-profit' : 'text-loss')}>
              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Active SIPs</p>
              <Repeat className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold mt-2">{activeSips.length}</p>
            <p className="text-sm text-muted-foreground mt-1">
              ${activeSips.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}/month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="chart-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioHistory.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioHistory}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 170)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Value']} />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">No transaction data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChart className="h-4 w-4" /> Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                      {allocationData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, '']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {allocationData.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">No assets yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers + Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No assets yet</p>
            ) : (
              <div className="space-y-3">
                {topPerformers.map((asset, i) => (
                  <Link key={asset.id} to={`/assets/${asset.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-semibold text-sm", asset.pnlPct >= 0 ? 'text-profit' : 'text-loss')}>
                        {asset.pnlPct >= 0 ? '+' : ''}{asset.pnlPct.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">${asset.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            <Link to="/transactions"><Button variant="ghost" size="sm" className="text-xs">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map(txn => (
                  <div key={txn.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", txn.type === 'buy' ? 'bg-loss/10 text-loss' : 'bg-profit/10 text-profit')}>
                        {txn.type === 'buy' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{txn.assetName || txn.assetSymbol}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(txn.date), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-semibold text-sm", txn.type === 'buy' ? 'text-loss' : 'text-profit')}>
                        {txn.type === 'buy' ? '-' : '+'}${txn.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{txn.quantity} units</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly + Portfolios */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyPnL.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPnL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 170)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {monthlyPnL.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">No activity</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Portfolios</CardTitle>
            <Link to="/portfolios"><Button variant="ghost" size="sm" className="text-xs">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {!portfolios || portfolios.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No portfolios yet</p>
            ) : (
              <div className="space-y-3">
                {portfolios.slice(0, 5).map(portfolio => {
                  const portfolioAssets = assets?.filter(a => a.portfolioId === portfolio.id) || [];
                  const portfolioValue = portfolioAssets.reduce((sum, a) => sum + a.quantity * (a.currentPrice || 0), 0);
                  return (
                    <Link key={portfolio.id} to={`/portfolios/${portfolio.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10 text-emerald text-sm font-bold">
                          {portfolio.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{portfolio.name}</p>
                          <p className="text-xs text-muted-foreground">{portfolioAssets.length} assets</p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
