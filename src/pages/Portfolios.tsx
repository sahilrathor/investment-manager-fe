import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolios, useCreatePortfolio, useDeletePortfolio, Portfolio } from '@/hooks/queries/usePortfolios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Trash2, FolderKanban } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function Portfolios() {
  const { data: portfolios, isLoading } = usePortfolios();
  const createPortfolio = useCreatePortfolio();
  const deletePortfolio = useDeletePortfolio();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Portfolio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My Portfolio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Long-term investments"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createPortfolio.isPending}>
                {createPortfolio.isPending ? 'Creating...' : 'Create'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!portfolios || portfolios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No portfolios yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Create your first portfolio to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between">
                <Link to={`/portfolios/${portfolio.id}`} className="flex-1">
                  <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                  {portfolio.description && (
                    <p className="text-sm text-muted-foreground mt-1">{portfolio.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Created {format(new Date(portfolio.createdAt), 'MMM dd, yyyy')}
                  </p>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(portfolio.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
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
