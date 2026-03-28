import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolios, useCreatePortfolio, useDeletePortfolio } from '@/hooks/queries/usePortfolios';
import { useAllAssets } from '@/hooks/queries/useAssets';
import { IndicesTicker } from '@/components/common/IndicesTicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  Plus, Trash2, FolderKanban, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export function Portfolios() {
  const { data: portfolios, isLoading } = usePortfolios();
  const { data: allAssets } = useAllAssets();
  const createPortfolio = useCreatePortfolio();
  const deletePortfolio = useDeletePortfolio();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Calculate portfolio analytics
  const portfolioAnalytics = (portfolios || []).map(portfolio => {
    const portfolioAssets = (allAssets || []).filter(a => a.portfolioId === portfolio.id);
    const totalValue = portfolioAssets.reduce((sum, a) => sum + a.quantity * (a.currentPrice || 0), 0);
    const totalInvested = portfolioAssets.reduce((sum, a) => sum + a.quantity * (a.avgBuyPrice || 0), 0);
    const pnl = totalValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

    const byType = portfolioAssets.reduce((acc, a) => {
      const val = a.quantity * (a.currentPrice || 0);
      acc[a.type] = (acc[a.type] || 0) + val;
      return acc;
    }, {} as Record<string, number>);

    return { ...portfolio, assets: portfolioAssets, totalValue, totalInvested, pnl, pnlPercent, byType };
  }).sort((a, b) => b.pnlPercent - a.pnlPercent);

  const totalPortfolioValue = portfolioAnalytics.reduce((s, p) => s + p.totalValue, 0);
  const bestPortfolio = portfolioAnalytics[0];
  const worstPortfolio = portfolioAnalytics[portfolioAnalytics.length - 1];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPortfolio.mutate(
      { name, description: description || undefined },
      {
        onSuccess: () => {
          toast.success('Portfolio created');
          setDialogOpen(false);
          setName('');
          setDescription('');
        },
        onError: (error: any) => toast.error(error.message || 'Failed to create'),
      }
    );
  };

  const handleDelete = (id: string) => {
    deletePortfolio.mutate(id, {
      onSuccess: () => toast.success('Portfolio deleted'),
      onError: (error: any) => toast.error(error.message || 'Failed to delete'),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolios</h1>
          <p className="text-muted-foreground">Manage your investment portfolios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Portfolio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Portfolio</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="My Portfolio" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input placeholder="Long-term investments" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={createPortfolio.isPending}>
                {createPortfolio.isPending ? 'Creating...' : 'Create'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <IndicesTicker />

      {!portfolios || portfolios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No portfolios yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Create your first portfolio to get started</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Portfolio Analytics */}
          {portfolioAnalytics.length > 1 && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Across All</span>
                  </div>
                  <p className="text-2xl font-bold">${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-muted-foreground">{portfolioAnalytics.length} portfolios</p>
                </CardContent>
              </Card>

              {bestPortfolio && (
                <Card className="border-emerald/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-emerald" />
                      <span className="text-sm text-muted-foreground">Best Performer</span>
                    </div>
                    <p className="font-semibold">{bestPortfolio.name}</p>
                    <p className={cn("text-lg font-bold", bestPortfolio.pnlPercent >= 0 ? 'text-profit' : 'text-loss')}>
                      {bestPortfolio.pnlPercent >= 0 ? '+' : ''}{bestPortfolio.pnlPercent.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
              )}

              {worstPortfolio && portfolioAnalytics.length > 1 && (
                <Card className="border-loss/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-loss" />
                      <span className="text-sm text-muted-foreground">Needs Attention</span>
                    </div>
                    <p className="font-semibold">{worstPortfolio.name}</p>
                    <p className={cn("text-lg font-bold", worstPortfolio.pnlPercent >= 0 ? 'text-profit' : 'text-loss')}>
                      {worstPortfolio.pnlPercent >= 0 ? '+' : ''}{worstPortfolio.pnlPercent.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Portfolio Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portfolioAnalytics.map(portfolio => (
              <Link key={portfolio.id} to={`/portfolios/${portfolio.id}`}>
                <Card className="hover:border-emerald/50 transition-colors h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald/10 text-emerald font-bold">
                          {portfolio.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{portfolio.name}</h3>
                          {portfolio.description && (
                            <p className="text-xs text-muted-foreground">{portfolio.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(portfolio.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">Value</p>
                        <p className="font-semibold">${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">Invested</p>
                        <p className="font-semibold">${portfolio.totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">P&L</p>
                        <div className="flex items-center gap-1">
                          {portfolio.pnl >= 0
                            ? <ArrowUpRight className="h-3 w-3 text-profit" />
                            : <ArrowDownRight className="h-3 w-3 text-loss" />
                          }
                          <p className={cn("font-semibold", portfolio.pnl >= 0 ? 'text-profit' : 'text-loss')}>
                            {portfolio.pnlPercent >= 0 ? '+' : ''}{portfolio.pnlPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <span>{portfolio.assets.length} assets</span>
                      <span>·</span>
                      <span>{format(new Date(portfolio.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Portfolio"
        description="This will delete the portfolio and all its assets. This action cannot be undone."
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
}
