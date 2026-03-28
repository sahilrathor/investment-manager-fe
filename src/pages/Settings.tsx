import { useState, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { api } from '@/lib/api/apiService';
import { endpointsConfig } from '@/config/endpointsConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Moon, Sun, MessageCircle, Unlink, Download, Upload, FileDown, FileUp, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [chatId, setChatId] = useState('');
  const [loading, setLoading] = useState(false);

  // Export state
  const [exportFormat, setExportFormat] = useState('assets');
  const [exportAssetType, setExportAssetType] = useState('all');
  const [exporting, setExporting] = useState(false);

  // Import state
  const [importFormat, setImportFormat] = useState('assets');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    const newTheme = ui.theme === 'light' ? 'dark' : 'light';
    setUI({ ...ui, theme: newTheme });
    document.documentElement.classList.toggle('dark');
  };

  const linkTelegram = async () => {
    if (!chatId) {
      toast.error('Enter your Telegram chat ID');
      return;
    }
    setLoading(true);
    try {
      await api.post(endpointsConfig.TELEGRAM.LINK, { chatId });
      setAuth({ ...auth, user: auth.user ? { ...auth.user, telegramChatId: chatId } : null });
      toast.success('Telegram linked successfully');
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
      toast.error(error.message || 'Failed to unlink Telegram');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = `${endpointsConfig.DATA.EXPORT(exportFormat)}&assetType=${exportAssetType}`;
      const data = await api.get<any[]>(url);

      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
      }

      const csv = convertToCSV(data);
      const typeLabel = exportFormat === 'assets' ? 'assets' : 'transactions';
      const assetLabel = exportAssetType === 'all' ? 'all' : exportAssetType;
      const filename = `${typeLabel}_${assetLabel}_${new Date().toISOString().slice(0, 10)}.csv`;

      downloadCSV(csv, filename);
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
      if (lines.length < 2) {
        toast.error('CSV file is empty or has no data rows');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
      });

      const result = await api.post<{ message: string }>(endpointsConfig.DATA.IMPORT, {
        type: importFormat,
        data,
      });

      toast.success(result.message || 'Import successful');
    } catch (error: any) {
      toast.error(error.message || 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={auth.user?.name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={auth.user?.email || ''} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {ui.theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="capitalize">{ui.theme} mode</span>
            </div>
            <Button variant="outline" onClick={toggleTheme}>
              Switch to {ui.theme === 'light' ? 'dark' : 'light'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram Notifications</CardTitle>
          <CardDescription>Get price alerts via Telegram</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {auth.user?.telegramChatId ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-profit" />
                <span>Linked (Chat ID: {auth.user.telegramChatId})</span>
              </div>
              <Button variant="outline" onClick={unlinkTelegram} disabled={loading}>
                <Unlink className="mr-2 h-4 w-4" />
                Unlink
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                1. Message @BotFather on Telegram to create a bot
                <br />
                2. Send /start to your bot
                <br />
                3. Get your chat ID (send a message, check the API response)
                <br />
                4. Enter your chat ID below
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Your Telegram chat ID"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                />
                <Button onClick={linkTelegram} disabled={loading}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Link
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
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {exporting ? 'Exporting...' : `Export ${exportAssetType === 'all' ? 'All' : ASSET_TYPE_OPTIONS.find(o => o.value === exportAssetType)?.label} as ${exportFormat}`}
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
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              disabled={importing}
            />
            <p className="text-xs text-muted-foreground">
              {importFormat === 'assets'
                ? 'CSV columns: portfolioId, type, symbol, name, quantity, avgBuyPrice, currentPrice, useLivePrice'
                : 'CSV columns: assetId, type, quantity, pricePerUnit, date, notes'}
            </p>
          </div>
          {importing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
