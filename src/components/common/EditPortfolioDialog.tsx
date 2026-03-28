import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { endpointsConfig } from '@/config/endpointsConfig';
import { queryKeys } from '@/lib/queryKeys';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditPortfolioDialogProps {
  portfolioId: string;
  currentName: string;
  currentDescription?: string | null;
}

export function EditPortfolioDialog({ portfolioId, currentName, currentDescription }: EditPortfolioDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || '');
  const qc = useQueryClient();

  const updatePortfolio = useMutation({
    mutationFn: () => api.put(`/portfolios/${portfolioId}`, { name, description: description || null }),
    onSuccess: () => {
      toast.success('Portfolio updated');
      qc.invalidateQueries({ queryKey: queryKeys.portfolios.detail(portfolioId) });
      qc.invalidateQueries({ queryKey: queryKeys.portfolios.lists() });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    updatePortfolio.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit3 className="h-4 w-4 mr-1" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Portfolio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={updatePortfolio.isPending}>
            {updatePortfolio.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
