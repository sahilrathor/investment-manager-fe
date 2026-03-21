import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePortfolio } from '@/hooks/queries/usePortfolios';
import { useAssets, useCreateAsset, useDeleteAsset, Asset } from '@/hooks/queries/useAssets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, ArrowLeft, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export function PortfolioDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: portfolio } = usePortfolio(id!);
  const { data: assets } = useAssets(id!);
  const createAsset = useCreateAsset();
  const deleteAsset = useDeleteAsset();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: 'stock',
    symbol: '',
    name: '',
    quantity: '',
    avgBuyPrice: '',
    currentPrice: '',
    useLivePrice: true,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAsset.mutate(
      {
        portfolioId: id!,
        payload: {
          type: form.type,
          symbol: form.symbol.toUpperCase(),
          name: form.name,
          quantity: Number(form.quantity) || 0,
          avgBuyPrice: Number(form.avgBuyPrice) || 0,
          currentPrice: Number(form.currentPrice) || 0,
          useLivePrice: form.useLivePrice,
        },
      },
      {
        onSuccess: () => {
          toast.success('Asset added');
          setDialogOpen(false);
          setForm({ type: 'stock', symbol: '', name: '', quantity: '', avgBuyPrice: '', currentPrice: '', useLivePrice: true });
        },
        onError: (error: any) => toast.error(error.message || 'Failed to add asset'),
      }
    );
  };

  const handleDelete = (assetId: string) => {
    deleteAsset.mutate(assetId, {
      onSuccess: () => toast.success('Asset deleted'),
      onError: (error: any) => toast.error(error.message || 'Failed to delete'),
    });
  };

  const stockAssets = assets?.filter((a) => a.type === 'stock' || a.type === 'mutual_fund') || [];
  const cryptoAssets = assets?.filter((a) => a.type === 'crypto') || [];
  const sipAssets = assets?.filter((a) => a.type === 'sip') || [];

  const renderAssetCard = (asset: Asset) => (
    <Card key={asset.id}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{asset.name}</h3>
            <p className="text-sm text-muted-foreground">{asset.symbol}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{asset.quantity}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Price</p>
                <p className="font-medium">${asset.avgBuyPrice}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Price</p>
                <p className="font-medium">${asset.currentPrice}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Value</p>
                <p className="font-medium">${(asset.quantity * asset.currentPrice).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Link to={`/transactions?assetId=${asset.id}`}>
              <Button variant="ghost" size="sm">Txns</Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => setDeleteId(asset.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/portfolios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{portfolio?.name}</h1>
            {portfolio?.description && (
              <p className="text-muted-foreground">{portfolio.description}</p>
            )}
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Asset</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                    <SelectItem value="sip">SIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Symbol</Label>
                  <Input placeholder="AAPL" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="Apple Inc." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" step="any" placeholder="10" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Avg Buy Price</Label>
                  <Input type="number" step="any" placeholder="150" value={form.avgBuyPrice} onChange={(e) => setForm({ ...form, avgBuyPrice: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Current Price</Label>
                <Input type="number" step="any" placeholder="175" value={form.currentPrice} onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={createAsset.isPending}>
                {createAsset.isPending ? 'Adding...' : 'Add Asset'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="stocks">
        <TabsList>
          <TabsTrigger value="stocks">Stocks ({stockAssets.length})</TabsTrigger>
          <TabsTrigger value="crypto">Crypto ({cryptoAssets.length})</TabsTrigger>
          <TabsTrigger value="sips">SIPs ({sipAssets.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="stocks" className="space-y-4">
          {stockAssets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No stocks or mutual funds yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">{stockAssets.map(renderAssetCard)}</div>
          )}
        </TabsContent>
        <TabsContent value="crypto" className="space-y-4">
          {cryptoAssets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No crypto assets yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">{cryptoAssets.map(renderAssetCard)}</div>
          )}
        </TabsContent>
        <TabsContent value="sips" className="space-y-4">
          {sipAssets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No SIP assets yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">{sipAssets.map(renderAssetCard)}</div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Asset"
        description="This will delete the asset and all its transactions. This action cannot be undone."
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
}
