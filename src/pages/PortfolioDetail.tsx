import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePortfolio } from '@/hooks/queries/usePortfolios';
import { useAssets, useCreateAsset, useDeleteAsset } from '@/hooks/queries/useAssets';
import { useMarketSearch, useStockPrice, useCryptoPrice, SearchResult } from '@/hooks/queries/useMarket';
import { AssetCard } from '@/components/common/AssetCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ArrowLeft, Package, Search, Loader2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export function PortfolioDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: portfolio } = usePortfolio(id!);
  const { data: assets } = useAssets(id!);
  const createAsset = useCreateAsset();
  const deleteAsset = useDeleteAsset();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCryptoId, setSelectedCryptoId] = useState<string>('');
  const [form, setForm] = useState({
    type: 'stock',
    symbol: '',
    name: '',
    quantity: '',
    avgBuyPrice: '',
    currentPrice: '',
    useLivePrice: true,
  });

  const { data: searchResults, isLoading: isSearching } = useMarketSearch(searchQuery, form.type);
  const { data: stockPrice, isLoading: isLoadingStockPrice } = useStockPrice(
    form.type === 'stock' && form.symbol ? form.symbol : ''
  );
  const { data: cryptoPrice, isLoading: isLoadingCryptoPrice } = useCryptoPrice(
    form.type === 'crypto' && selectedCryptoId ? selectedCryptoId : ''
  );

  const isFetchingPrice = isLoadingStockPrice || isLoadingCryptoPrice;
  const livePrice = form.type === 'stock' ? stockPrice?.price : form.type === 'crypto' ? cryptoPrice?.price : undefined;

  useEffect(() => {
    if (livePrice !== undefined) {
      setForm((prev) => ({ ...prev, currentPrice: String(livePrice) }));
    }
  }, [livePrice]);

  const handleSelectSearchResult = (result: SearchResult) => {
    setForm({
      ...form,
      symbol: result.symbol,
      name: result.name,
      currentPrice: '',
    });
    if (result.type === 'crypto' && result.id) {
      setSelectedCryptoId(result.id);
    } else {
      setSelectedCryptoId('');
    }
    setSearchQuery('');
  };

  const handleTypeChange = (type: string) => {
    setForm({ ...form, type, symbol: '', name: '', currentPrice: '' });
    setSearchQuery('');
    setSelectedCryptoId('');
  };

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
          setSearchQuery('');
          setSelectedCryptoId('');
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
                <Select value={form.type} onValueChange={handleTypeChange}>
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
              <div className="space-y-2">
                <Label>Search {form.type === 'stock' ? 'Stock' : form.type === 'crypto' ? 'Crypto' : form.type === 'mutual_fund' ? 'Mutual Fund' : 'Asset'}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search by name or symbol...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
                  <div className="border rounded-md max-h-48 overflow-y-auto bg-background">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.symbol}-${result.id || ''}`}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between"
                        onClick={() => handleSelectSearchResult(result)}
                      >
                        <div>
                          <p className="font-medium text-sm">{result.symbol}</p>
                          <p className="text-xs text-muted-foreground">{result.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">{result.type}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && !isSearching && (!searchResults || searchResults.length === 0) && (
                  <p className="text-xs text-muted-foreground px-1">No results found. You can manually enter the details below.</p>
                )}
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
                {(form.type === 'stock' || form.type === 'crypto') ? (
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="any"
                      placeholder="Select an asset to fetch price"
                      value={form.currentPrice}
                      onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
                      className="pl-9"
                      disabled={isFetchingPrice}
                    />
                    {isFetchingPrice && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                ) : (
                  <Input type="number" step="any" placeholder="Enter current price" value={form.currentPrice} onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} />
                )}
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
            <div className="grid gap-4 md:grid-cols-2">{stockAssets.map((asset) => <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />)}</div>
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
            <div className="grid gap-4 md:grid-cols-2">{cryptoAssets.map((asset) => <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />)}</div>
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
            <div className="grid gap-4 md:grid-cols-2">{sipAssets.map((asset) => <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />)}</div>
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
