import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Moon, Sun, LogOut, TrendingUp, Settings, Menu, X
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/portfolios', label: 'Portfolios' },
  { path: '/screener', label: 'Screener' },
  { path: '/undervalued', label: 'Undervalued' },
  { path: '/transactions', label: 'Transactions' },
  { path: '/sips', label: 'SIPs' },
  { path: '/alerts', label: 'Alerts' },
];

export function Topbar() {
  const location = useLocation();
  const { data: ui, setData: setUI } = useUIStore();
  const { data: auth } = useAuthStore();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => {
    const newTheme = ui.theme === 'light' ? 'dark' : 'light';
    setUI({ ...ui, theme: newTheme });
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-50 border-b navbar-blur bg-background/80">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald text-primary-foreground shadow-lg shadow-emerald/25 group-hover:shadow-emerald/40 transition-shadow">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">Investments</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-emerald/10 text-emerald"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
              {ui.theme === 'light'
                ? <Moon className="h-4 w-4" />
                : <Sun className="h-4 w-4 text-yellow-400" />
              }
            </Button>

            <DropdownMenu >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald/20 text-emerald text-xs font-bold">
                    {auth.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-semibold">{auth.user?.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">{auth.user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout.mutate()} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-lg"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden pb-4 border-t pt-3">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-emerald/10 text-emerald"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Settings
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
