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
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface EditTransactionDialogProps {
  transaction: {
    id: string;
    assetId: string;
    type: string;
    quantity: number;
    pricePerUnit: number;
    date: string;
    notes: string | null;
  };
}

export function EditTransactionDialog({ transaction }: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(transaction.notes || '');
  const [quantity, setQuantity] = useState(String(transaction.quantity));
  const [pricePerUnit, setPricePerUnit] = useState(String(transaction.pricePerUnit));
  const [date, setDate] = useState(format(new Date(transaction.date), 'yyyy-MM-dd'));
  const qc = useQueryClient();

  const updateTxn = useMutation({
    mutationFn: () => api.put(endpointsConfig.TRANSACTIONS.UPDATE(transaction.id), {
      notes: notes || null,
      quantity: Number(quantity),
      pricePerUnit: Number(pricePerUnit),
      date,
    }),
    onSuccess: () => {
      toast.success('Transaction updated');
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: queryKeys.assets.all });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !pricePerUnit) {
      toast.error('Quantity and price are required');
      return;
    }
    updateTxn.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <span className="text-muted-foreground">Type: </span>
            <span className={`font-medium ${transaction.type === 'buy' ? 'text-loss' : 'text-profit'}`}>
              {transaction.type.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Price per unit</Label>
              <Input type="number" step="any" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {quantity && pricePerUnit && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">${(Number(quantity) * Number(pricePerUnit)).toLocaleString()}</span>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={updateTxn.isPending}>
            {updateTxn.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
