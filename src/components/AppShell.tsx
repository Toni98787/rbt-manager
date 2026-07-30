import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  CalendarDays,
  Truck,
  Settings,
  Bell,
  LogOut,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import type { PageId } from '../App';

const NAV: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'pos', label: 'POS', icon: ShoppingCart },
  { id: 'inventory', label: 'Stock', icon: Package },
  { id: 'customers', label: 'Clients', icon: Users },
  { id: 'sales', label: 'Sales', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'suppliers', label: 'Orders', icon: Truck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppShell({
  page,
  setPage,
  children,
}: {
  page: PageId;
  setPage: (p: PageId) => void;
  children: ReactNode;
}) {
  const { state, currentStaff, logout, markNotificationRead } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;
  const title =
    NAV.find((n) => n.id === page)?.label === 'Home'
      ? 'Dashboard'
      : NAV.find((n) => n.id === page)?.label ?? 'RBT Manager';

  return (
    <div className="app-shell">
      <nav className="side-nav">
        <div className="brand-mark">
          {state.shop.logoDataUrl ? (
            <img src={state.shop.logoDataUrl} alt="logo" />
          ) : (
            'R'
          )}
        </div>
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-btn ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="main-area">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {state.shop.logoDataUrl ? (
              <img
                src={state.shop.logoDataUrl}
                alt=""
                style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
              />
            ) : null}
            <div>
              <h1>{title}</h1>
              <div className="meta" style={{ marginTop: 2 }}>
                {state.shop.shopName}
              </div>
            </div>
          </div>
          <div className="meta">
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                title="Notifications"
                onClick={() => {
                  state.notifications
                    .filter((n) => !n.read)
                    .forEach((n) => markNotificationRead(n.id));
                }}
              >
                <Bell size={18} />
                {unread > 0 ? <span className="notif-dot" /> : null}
              </button>
            </div>
            <span>{currentStaff?.name}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </header>
        <div className={`content ${page === 'pos' ? '' : ''}`} style={page === 'pos' ? { padding: '10px 12px' } : undefined}>
          {children}
        </div>
      </div>
    </div>
  );
}
