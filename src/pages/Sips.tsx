import { useState } from 'react';
import { useSips, useCreateSip, useUpdateSip, useDeleteSip } from '@/hooks/queries/useSips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Trash2, Repeat, Pause, Play } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function Sips() {
  const { data: sips, isLoading } = useSips();
  const createSip = useCreateSip();
  const updateSip = useUpdateSip();
  const deleteSip = useDeleteSip();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    assetId: '',
    amount: '',
    frequency: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSip.mutate(
      {
        assetId: form.assetId,
        amount: Number(form.amount),
        frequency: form.frequency,
        startDate: form.startDate,
      },
      {
        onSuccess: () => {
          toast.success('SIP created');
          setDialogOpen(false);
          setForm({ assetId: '', amount: '', frequency: 'monthly', startDate: format(new Date(), 'yyyy-MM-dd') });
        },
        onError: (error: any) => toast.error(error.message || 'Failed to create'),
      }
    );
  };

  const handleToggleStatus = (sip: any) => {
    const newStatus = sip.status === 'active' ? 'paused' : 'active';
    updateSip.mutate(
      { id: sip.id, data: { status: newStatus } },
      {
        onSuccess: () => toast.success(`SIP ${newStatus}`),
        onError: (error: any) => toast.error(error.message || 'Failed to update'),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteSip.mutate(id, {
      onSuccess: () => toast.success('SIP deleted'),
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
          <h1 className="text-3xl font-bold">SIPs</h1>
          <p className="text-muted-foreground">Manage systematic investment plans</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New SIP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create SIP</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Asset ID</Label>
                <Input placeholder="Paste asset ID" value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="any" placeholder="500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full" disabled={createSip.isPending}>
                {createSip.isPending ? 'Creating...' : 'Create SIP'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!sips || sips.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Repeat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No SIPs yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Create your first SIP</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sips.map((sip) => (
            <Card key={sip.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{sip.assetName}</h3>
                    <p className="text-sm text-muted-foreground">{sip.assetSymbol}</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Amount:</span> <span className="font-medium">${sip.amount}</span></p>
                      <p><span className="text-muted-foreground">Frequency:</span> <span className="font-medium capitalize">{sip.frequency}</span></p>
                      <p><span className="text-muted-foreground">Next:</span> <span className="font-medium">{format(new Date(sip.nextPaymentDate), 'MMM dd, yyyy')}</span></p>
                    </div>
                    <span className={`inline-block mt-3 text-xs font-medium px-2 py-1 rounded-full ${sip.status === 'active' ? 'bg-profit/10 text-profit' : 'bg-muted text-muted-foreground'}`}>
                      {sip.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(sip)}>
                      {sip.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(sip.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete SIP"
        description="This will delete the SIP. This action cannot be undone."
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
}
