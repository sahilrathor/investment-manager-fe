import { Outlet, Navigate } from 'react-router-dom';
import { Topbar } from './Topbar';
import { useAuthStore } from '@/stores/useAuthStore';
import Cookies from 'js-cookie';

export function AppLayout() {
  const { data: auth } = useAuthStore();
  const hasToken = !!Cookies.get('access_token');

  // If no token in cookies, definitely not logged in
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  // If has token but store says not authenticated yet (persist loading),
  // render layout anyway - auth will populate shortly
  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
