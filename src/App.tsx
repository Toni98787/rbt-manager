import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PosPage } from './pages/PosPage';
import { InventoryPage } from './pages/InventoryPage';
import { CustomersPage } from './pages/CustomersPage';
import { SalesPage } from './pages/SalesPage';
import { CalendarPage } from './pages/CalendarPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SettingsPage } from './pages/SettingsPage';
import { useCurrentUser } from './store/useAppStore';

function Protected({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
