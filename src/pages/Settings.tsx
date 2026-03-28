import { useState, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useAllAssets } from '@/hooks/queries/useAssets';
import { usePortfolios } from '@/hooks/queries/usePortfolios';
import { useAllTransactions } from '@/hooks/queries/useTransactions';
import { api } from '@/lib/api/apiService';
import { endpointsConfig } from '@/config/endpointsConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Moon, Sun, MessageCircle, Unlink, Download, Upload, FileDown, FileUp, Loader2,
  User, Wallet, TrendingUp, PieChart, Edit3, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const ASSET_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'stock', label: 'Stocks' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'mutual_fund', label: 'Mutual Funds' },
  { value: 'sip', label: 'SIPs' },
];

const EXPORT_FORMAT_OPTIONS = [
  { value: 'assets', label: 'Assets' },
  { value: 'transactions', label: 'Transactions' },
];

export function Settings() {
  const { data: auth, setData: setAuth } = useAuthStore();
  const { data: ui, setData: setUI } = useUIStore();
  const { data: assets } = useAllAssets();
  const { data: portfolios } = usePortfolios();
  const { data: transactions } = useAllTransactions();

  const [chatId, setChatId] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(auth.user?.name || '');
  const [editEmail, setEditEmail] = useState(auth.user?.email || '');

  // Export state
  const [exportFormat, setExportFormat] = useState('assets');
  const [exportAssetType, setExportAssetType] = useState('all');
  const [exporting, setExporting] = useState(false);

  // Import state
  const [importFormat, setImportFormat] = useState('assets');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick stats
  const totalValue = (assets || []).reduce((sum, a) => sum + a.quantity * (a.currentPrice || 0), 0);
  const totalInvested = (assets || []).reduce((sum, a) => sum + a.quantity * (a.avgBuyPrice || 0), 0);
  const totalPnL = totalValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const toggleTheme = () => {
    const newTheme = ui.theme === 'light' ? 'dark' : 'light';
    setUI({ ...ui, theme: newTheme });
    document.documentElement.classList.toggle('dark');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('Name is required');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/me', { name: editName, email: editEmail });
      setAuth({ ...auth, user: auth.user ? { ...auth.user, name: editName, email: editEmail } : null });
      setEditingProfile(false);
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const linkTelegram = async () => {
    if (!chatId) { toast.error('Enter your Telegram chat ID'); return; }
    setLoading(true);
    try {
      await api.post(endpointsConfig.TELEGRAM.LINK, { chatId });
      setAuth({ ...auth, user: auth.user ? { ...auth.user, telegramChatId: chatId } : null });
      toast.success('Telegram linked');
      setChatId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to link Telegram');
    } finally {
      setLoading(false);
    }
  };

  const unlinkTelegram = async () => {
    setLoading(true);
    try {
      await api.post(endpointsConfig.TELEGRAM.UNLINK);
      setAuth({ ...auth, user: auth.user ? { ...auth.user, telegramChatId: null } : null });
      toast.success('Telegram unlinked');
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlink');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = `${endpointsConfig.DATA.EXPORT(exportFormat)}&assetType=${exportAssetType}`;
      const data = await api.get<any[]>(url);
      if (!data || data.length === 0) { toast.error('No data to export'); return; }
      const csv = convertToCSV(data);
      const typeLabel = exportFormat === 'assets' ? 'assets' : 'transactions';
      const assetLabel = exportAssetType === 'all' ? 'all' : exportAssetType;
      downloadCSV(csv, `${typeLabel}_${assetLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`Exported ${data.length} ${typeLabel}`);
    } catch (error: any) {
      toast.error(error.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) { toast.error('CSV is empty'); return; }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
      });
      const result = await api.post<{ message: string }>(endpointsConfig.DATA.IMPORT, { type: importFormat, data });
      toast.success(result.message || 'Import successful');
    } catch (error: any) {
      toast.error(error.message || 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
                <CardDescription>Your account information</CardDescription>
              </div>
              {!editingProfile ? (
                <Button variant="outline" size="sm" onClick={() => { setEditName(auth.user?.name || ''); setEditEmail(auth.user?.email || ''); setEditingProfile(true); }}>
                  <Edit3 className="h-4 w-4 mr-1" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingProfile(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleSaveProfile} disabled={loading}>
                    <Check className="h-4 w-4 mr-1" /> Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {editingProfile ? (
                <>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{auth.user?.name || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{auth.user?.email || '-'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Telegram */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Telegram Notifications
              </CardTitle>
              <CardDescription>Get price alerts and news via Telegram</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {auth.user?.telegramChatId ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-profit/5 border border-profit/20">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-profit" />
                    <span className="font-medium">Linked (Chat ID: {auth.user.telegramChatId})</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={unlinkTelegram} disabled={loading}>
                    <Unlink className="h-4 w-4 mr-1" /> Unlink
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Message @BotFather on Telegram to create a bot</li>
                    <li>Send /start to your bot</li>
                    <li>Get your chat ID and enter below</li>
                  </ol>
                  <div className="flex gap-2">
                    <Input placeholder="Your Telegram chat ID" value={chatId} onChange={e => setChatId(e.target.value)} />
                    <Button onClick={linkTelegram} disabled={loading}>
                      <MessageCircle className="h-4 w-4 mr-1" /> Link
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>Download your investment data as CSV</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPORT_FORMAT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select value={exportAssetType} onValueChange={setExportAssetType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleExport} disabled={exporting} className="w-full">
                {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                Export {exportAssetType === 'all' ? 'All' : ASSET_TYPE_OPTIONS.find(o => o.value === exportAssetType)?.label}
              </Button>
            </CardContent>
          </Card>

          {/* Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data
              </CardTitle>
              <CardDescription>Upload a CSV file to import data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Data Type</Label>
                <Select value={importFormat} onValueChange={setImportFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPORT_FORMAT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CSV File</Label>
                <Input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} disabled={importing} />
                <p className="text-xs text-muted-foreground">
                  {importFormat === 'assets'
                    ? 'Columns: portfolioId, type, symbol, name, quantity, avgBuyPrice, currentPrice, useLivePrice'
                    : 'Columns: assetId, type, quantity, pricePerUnit, date, notes'}
                </p>
              </div>
              {importing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Importing...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Stats */}
        <div className="space-y-6">
          <Card className="border-2 border-emerald/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald" />
                Portfolio Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Total Invested</p>
                <p className="text-xl font-semibold">${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">P&L</p>
                <p className={cn("text-xl font-semibold", totalPnL >= 0 ? 'text-profit' : 'text-loss')}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span className="text-sm ml-2">({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Assets</p>
                  <p className="text-lg font-bold">{assets?.length || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Portfolios</p>
                  <p className="text-lg font-bold">{portfolios?.length || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="text-lg font-bold">{transactions?.length || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Theme</p>
                  <p className="text-lg font-bold capitalize">{ui.theme}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {ui.theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span className="capitalize font-medium">{ui.theme} mode</span>
                </div>
                <Button variant="outline" size="sm" onClick={toggleTheme}>
                  Switch to {ui.theme === 'light' ? 'dark' : 'light'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Asset Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Asset Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['stock', 'crypto', 'mutual_fund', 'sip'].map(type => {
                const typeAssets = (assets || []).filter(a => a.type === type);
                const typeValue = typeAssets.reduce((sum, a) => sum + a.quantity * (a.currentPrice || 0), 0);
                const label = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) + 's';
                if (typeAssets.length === 0) return null;
                return (
                  <div key={type} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{typeAssets.length} items</p>
                    </div>
                    <p className="font-semibold text-sm">${typeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                );
              })}
              {(!assets || assets.length === 0) && (
                <p className="text-center text-muted-foreground text-sm py-4">No assets yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
