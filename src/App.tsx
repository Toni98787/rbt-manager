import { useState } from 'react';
import { StoreProvider, useStore } from './store/StoreContext';
import { LoginScreen } from './pages/LoginScreen';
import { AppShell } from './components/AppShell';
import { Dashboard } from './pages/Dashboard';
import { POSPage } from './pages/POSPage';
import { InventoryPage } from './pages/InventoryPage';
import { CustomersPage } from './pages/CustomersPage';
import { SalesPage } from './pages/SalesPage';
import { CalendarPage } from './pages/CalendarPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SettingsPage } from './pages/SettingsPage';
import './styles/app.css';

export type PageId =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'customers'
  | 'sales'
  | 'calendar'
  | 'suppliers'
  | 'settings';

function AppRoutes() {
  const { state } = useStore();
  const [page, setPage] = useState<PageId>('dashboard');

  if (!state.currentStaffId) {
    return <LoginScreen />;
  }

  return (
    <AppShell page={page} setPage={setPage}>
      {page === 'dashboard' && <Dashboard navigate={setPage} />}
      {page === 'pos' && <POSPage />}
      {page === 'inventory' && <InventoryPage />}
      {page === 'customers' && <CustomersPage />}
      {page === 'sales' && <SalesPage />}
      {page === 'calendar' && <CalendarPage />}
      {page === 'suppliers' && <SuppliersPage />}
      {page === 'settings' && <SettingsPage />}
    </AppShell>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppRoutes />
    </StoreProvider>
  );
}
