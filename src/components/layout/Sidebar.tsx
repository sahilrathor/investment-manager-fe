import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  ArrowLeftRight,
  Repeat,
  Bell,
  Settings,
  Menu,
  TrendingUp,
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/portfolios', label: 'Portfolios', icon: FolderKanban },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/sips', label: 'SIPs', icon: Repeat },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { data: ui } = useUIStore();

  if (!ui.sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Investments</span>
      </div>

      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
