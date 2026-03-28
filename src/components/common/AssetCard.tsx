import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useStockPrice, useCryptoPrice } from '@/hooks/queries/useMarket';
import { Asset } from '@/hooks/queries/useAssets';
import { MoveAssetDialog } from './MoveAssetDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';

interface AssetCardProps {
  asset: Asset;
  onDelete: (id: string) => void;
}

export function AssetCard({ asset, onDelete }: AssetCardProps) {
  const shouldFetchStock = (asset.type === 'stock' || asset.type === 'mutual_fund') && asset.useLivePrice;
  const shouldFetchCrypto = asset.type === 'crypto' && asset.useLivePrice;

  const { data: stockPrice, isLoading: stockLoading, isError: stockError, refetch: refetchStock } = useStockPrice(
    shouldFetchStock ? asset.symbol : ''
  );
  const { data: cryptoPrice, isLoading: cryptoLoading, isError: cryptoError, refetch: refetchCrypto } = useCryptoPrice(
    shouldFetchCrypto ? asset.symbol : ''
  );

  const isLoadingPrice = stockLoading || cryptoLoading;
  const hasError = (shouldFetchStock && stockError) || (shouldFetchCrypto && cryptoError);

  const livePrice = shouldFetchStock ? stockPrice?.price
    : shouldFetchCrypto ? cryptoPrice?.price
    : undefined;

  const currentPrice = livePrice ?? asset.currentPrice ?? 0;
  const value = asset.quantity * currentPrice;
  const invested = asset.quantity * (asset.avgBuyPrice || 0);
  const pnl = value - invested;
  const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

  const handleRefresh = () => {
    if (shouldFetchStock) refetchStock();
    if (shouldFetchCrypto) refetchCrypto();
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Link to={`/assets/${asset.id}`} className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold hover:underline">{asset.name}</h3>
              {asset.useLivePrice && (
                isLoadingPrice ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : hasError ? (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                ) : (
                  <RefreshCw className="h-3 w-3 text-green-500" />
                )
              )}
            </div>
            <p className="text-sm text-muted-foreground">{asset.symbol}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{asset.quantity}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Price</p>
                <p className="font-medium">${(asset.avgBuyPrice || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Price</p>
                <p className="font-medium">
                  ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Value</p>
                <p className="font-medium">${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              {invested > 0 && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">P&L</p>
                  <p className={`font-medium ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    ${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                  </p>
                </div>
              )}
            </div>
          </Link>
          <div className="flex flex-col gap-1 ml-2">
            {asset.useLivePrice && (
              <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoadingPrice}>
                <RefreshCw className={`h-4 w-4 ${isLoadingPrice ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <MoveAssetDialog
              assetId={asset.id}
              currentPortfolioId={asset.portfolioId}
              assetName={asset.name}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => onDelete(asset.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
