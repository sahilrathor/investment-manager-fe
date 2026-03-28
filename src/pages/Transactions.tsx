import { useState } from 'react';
import { useAllTransactions, useCreateTransaction, useDeleteTransaction } from '@/hooks/queries/useTransactions';
import { useAllAssets } from '@/hooks/queries/useAssets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function Transactions() {
  const { data: transactions, isLoading } = useAllTransactions();
  const { data: allAssets } = useAllAssets();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    assetId: '',
    type: 'buy',
    quantity: '',
    pricePerUnit: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assetId) {
      toast.error('Please select an asset');
      return;
    }
    createTransaction.mutate(
      {
        assetId: form.assetId,
        payload: {
          type: form.type as 'buy' | 'sell',
          quantity: Number(form.quantity),
          pricePerUnit: Number(form.pricePerUnit),
          date: form.date,
          notes: form.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Transaction added');
          setDialogOpen(false);
          setForm({ assetId: '', type: 'buy', quantity: '', pricePerUnit: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
        },
        onError: (error: any) => toast.error(error.message || 'Failed to add'),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteTransaction.mutate(id, {
      onSuccess: () => toast.success('Transaction deleted'),
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
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View all buy/sell history</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Asset</Label>
                <Select value={form.assetId} onValueChange={(v) => setForm({ ...form, assetId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {allAssets?.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.symbol})
                      </SelectItem>
                    ))}
                    {(!allAssets || allAssets.length === 0) && (
                      <SelectItem value="none" disabled>
                        No assets found. Create an asset first.
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" step="any" placeholder="10" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Price per unit</Label>
                  <Input type="number" step="any" placeholder="150" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input placeholder="Bought on dip" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={createTransaction.isPending}>
                {createTransaction.isPending ? 'Adding...' : 'Add Transaction'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!transactions || transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No transactions yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Add your first transaction</p>
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
                    <th className="p-4">Asset</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Notes</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4 text-sm">{format(new Date(txn.date), 'MMM dd, yyyy')}</td>
                      <td className="p-4">
                        <p className="font-medium text-sm">{txn.assetName}</p>
                        <p className="text-xs text-muted-foreground">{txn.assetSymbol}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${txn.type === 'buy' ? 'bg-loss/10 text-loss' : 'bg-profit/10 text-profit'}`}>
                          {txn.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{txn.quantity}</td>
                      <td className="p-4 text-sm">${txn.pricePerUnit}</td>
                      <td className="p-4 text-sm font-medium">${txn.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-sm text-muted-foreground">{txn.notes || '-'}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(txn.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
