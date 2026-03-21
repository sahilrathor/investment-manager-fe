import { usePortfolios } from '@/hooks/queries/usePortfolios';
import { useAllTransactions } from '@/hooks/queries/useTransactions';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, PieChart } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function Dashboard() {
  const { data: portfolios } = usePortfolios();
  const { data: transactions } = useAllTransactions();

  const totalValue = 0;
  const totalInvested = 0;
  const totalPnL = totalValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? ((totalPnL / totalInvested) * 100) : 0;

  const recentTransactions = (transactions || []).slice(0, 5);

  const allocationData: { name: string; value: number; color: string }[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your investments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Value"
          value={`$${totalValue.toLocaleString()}`}
          icon={Wallet}
        />
        <StatCard
          title="Total Invested"
          value={`$${totalInvested.toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Total P&L"
          value={`$${totalPnL.toLocaleString()}`}
          icon={totalPnL >= 0 ? TrendingUp : TrendingDown}
          change={pnlPercent}
        />
        <StatCard
          title="Transactions"
          value={transactions?.length || 0}
          icon={ArrowLeftRight}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allocationData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No assets to display</p>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  {allocationData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{txn.assetName || txn.assetSymbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(txn.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${txn.type === 'buy' ? 'text-loss' : 'text-profit'}`}>
                        {txn.type === 'buy' ? '-' : '+'}${txn.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {txn.quantity} @ ${txn.pricePerUnit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolios</CardTitle>
        </CardHeader>
        <CardContent>
          {!portfolios || portfolios.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No portfolios yet. Go to Portfolios to create one.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {portfolios.map((portfolio) => (
                <Card key={portfolio.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{portfolio.name}</h3>
                    {portfolio.description && (
                      <p className="text-sm text-muted-foreground mt-1">{portfolio.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {format(new Date(portfolio.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
