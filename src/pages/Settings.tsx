import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { api } from '@/lib/api/apiService';
import { endpointsConfig } from '@/config/endpointsConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun, MessageCircle, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';

export function Settings() {
  const { data: auth, setData: setAuth } = useAuthStore();
  const { data: ui, setData: setUI } = useUIStore();
  const [chatId, setChatId] = useState('');
  const [loading, setLoading] = useState(false);

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
    </div>
  );
}
