import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Portfolios } from '@/pages/Portfolios';
import { PortfolioDetail } from '@/pages/PortfolioDetail';
import { AssetDetail } from '@/pages/AssetDetail';
import { Compare } from '@/pages/Compare';
import { Transactions } from '@/pages/Transactions';
import { Sips } from '@/pages/Sips';
import { Alerts } from '@/pages/Alerts';
import { Settings } from '@/pages/Settings';
import { Screener } from '@/pages/Screener';
import { Undervalued } from '@/pages/Undervalued';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolios" element={<Portfolios />} />
          <Route path="/portfolios/:id" element={<PortfolioDetail />} />
          <Route path="/assets/:id" element={<AssetDetail />} />
          <Route path="/screener" element={<Screener />} />
          <Route path="/undervalued" element={<Undervalued />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/sips" element={<Sips />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
