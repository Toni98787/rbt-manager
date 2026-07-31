import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore, useCurrentUser } from '../../store/useAppStore';

const links = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/pos', label: 'POS', icon: '▣' },
  { to: '/inventory', label: 'Stock', icon: '▤' },
  { to: '/customers', label: 'Clients', icon: '☺' },
  { to: '/sales', label: 'Sales', icon: '↗' },
  { to: '/calendar', label: 'Plan', icon: '▦' },
  { to: '/suppliers', label: 'Orders', icon: '⇢' },
  { to: '/settings', label: 'Setup', icon: '⚙' },
];

export function AppShell() {
  const shop = useAppStore((s) => s.shop);
  const logout = useAppStore((s) => s.logout);
  const user = useCurrentUser();
  const unread = useAppStore((s) => s.notifications.filter((n) => !n.read).length);

  return (
    <div className="app-shell">
      <aside className="nav-rail">
        <div className="nav-logo" title={shop.name}>
          {shop.logoDataUrl ? <img src={shop.logoDataUrl} alt={shop.name} /> : <span>RBT</span>}
        </div>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
          >
            <span className="icon">{l.icon}</span>
            <span className="label">{l.label}</span>
          </NavLink>
        ))}
        <div style={{ flex: 1 }} />
        <div className="tiny muted" style={{ textAlign: 'center', marginBottom: 6 }}>
          {user?.name}
          {unread > 0 ? ` · ${unread}` : ''}
        </div>
        <button className="nav-btn" onClick={logout}>
          <span className="icon">⎋</span>
          <span className="label">Logout</span>
        </button>
      </aside>
      <main className="main-pane">
        <Outlet />
      </main>
    </div>
  );
}
