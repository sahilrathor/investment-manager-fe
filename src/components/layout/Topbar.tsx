import { Button } from '@/components/ui/button';
import { Menu, Moon, Sun, LogOut, User } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLogout } from '@/hooks/queries/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Topbar() {
  const { data: ui, setData: setUI } = useUIStore();
  const { data: auth } = useAuthStore();
  const logout = useLogout();

  const toggleTheme = () => {
    const newTheme = ui.theme === 'light' ? 'dark' : 'light';
    setUI({ ...ui, theme: newTheme });
    document.documentElement.classList.toggle('dark');
  };

  const toggleSidebar = () => {
    setUI({ ...ui, sidebarOpen: !ui.sidebarOpen });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {ui.theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {auth.user?.name || 'User'}
              <p className="text-xs text-muted-foreground">{auth.user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout.mutate()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
