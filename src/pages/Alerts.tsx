import { useState } from 'react';
import { useAlerts, useCreateAlert, useDeleteAlert } from '@/hooks/queries/useAlerts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Trash2, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    assetId: '',
    targetPrice: '',
    direction: 'above',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAlert.mutate(
      {
        assetId: form.assetId,
        targetPrice: Number(form.targetPrice),
        direction: form.direction as 'above' | 'below',
      },
      {
        onSuccess: () => {
          toast.success('Alert created');
          setDialogOpen(false);
          setForm({ assetId: '', targetPrice: '', direction: 'above' });
        },
        onError: (error: any) => toast.error(error.message || 'Failed to create'),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteAlert.mutate(id, {
      onSuccess: () => toast.success('Alert deleted'),
      onError: (error: any) => toast.error(error.message || 'Failed to delete'),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const activeAlerts = alerts?.filter((a) => !a.isTriggered) || [];
  const triggeredAlerts = alerts?.filter((a) => a.isTriggered) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Price Alerts</h1>
          <p className="text-muted-foreground">Get notified when prices hit your targets</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Alert</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Asset ID</Label>
                <Input placeholder="Paste asset ID" value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Target Price</Label>
                <Input type="number" step="any" placeholder="70000" value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createAlert.isPending}>
                {createAlert.isPending ? 'Creating...' : 'Create Alert'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <h2 className="text-lg font-semibold">Active ({activeAlerts.length})</h2>
      {activeAlerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No active alerts</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeAlerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {alert.direction === 'above' ? (
                        <TrendingUp className="h-4 w-4 text-profit" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-loss" />
                      )}
                      <h3 className="font-semibold">{alert.assetName}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.assetSymbol}</p>
                    <div className="mt-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Current:</span>{' '}
                        <span className="font-medium">${alert.currentPrice?.toLocaleString()}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Target:</span>{' '}
                        <span className="font-medium">
                          {alert.direction} ${alert.targetPrice.toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(alert.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {triggeredAlerts.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-muted-foreground">Triggered ({triggeredAlerts.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
            {triggeredAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{alert.assetName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {alert.direction} ${alert.targetPrice.toLocaleString()}
                      </p>
                      <span className="inline-block mt-2 text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        TRIGGERED
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(alert.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Alert"
        description="This action cannot be undone."
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
}
