import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { endpointsConfig } from '@/config/endpointsConfig';
import { queryKeys } from '@/lib/queryKeys';
import { usePortfolios } from '@/hooks/queries/usePortfolios';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface MoveAssetDialogProps {
  assetId: string;
  currentPortfolioId: string;
  assetName: string;
  onMoved?: () => void;
}

export function MoveAssetDialog({ assetId, currentPortfolioId, assetName, onMoved }: MoveAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [targetPortfolioId, setTargetPortfolioId] = useState('');
  const { data: portfolios } = usePortfolios();
  const qc = useQueryClient();

  const otherPortfolios = (portfolios || []).filter(p => p.id !== currentPortfolioId);

  const moveAsset = useMutation({
    mutationFn: (portfolioId: string) =>
      api.patch(endpointsConfig.ASSETS.MOVE(assetId), { portfolioId }),
    onSuccess: () => {
      toast.success(`Moved "${assetName}" successfully`);
      qc.invalidateQueries({ queryKey: queryKeys.assets.all });
      qc.invalidateQueries({ queryKey: queryKeys.portfolios.all });
      setOpen(false);
      setTargetPortfolioId('');
      onMoved?.();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to move asset');
    },
  });

  const handleMove = () => {
    if (!targetPortfolioId) {
      toast.error('Select a target portfolio');
      return;
    }
    moveAsset.mutate(targetPortfolioId);
  };

  if (otherPortfolios.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightLeft className="h-4 w-4 mr-1" /> Move
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Move <span className="font-medium text-foreground">{assetName}</span> to another portfolio.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Portfolio</label>
            <Select value={targetPortfolioId} onValueChange={setTargetPortfolioId}>
              <SelectTrigger>
                <SelectValue placeholder="Select portfolio" />
              </SelectTrigger>
              <SelectContent>
                {otherPortfolios.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={handleMove}
            disabled={!targetPortfolioId || moveAsset.isPending}
          >
            {moveAsset.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRightLeft className="h-4 w-4 mr-2" />
            )}
            Move Asset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
