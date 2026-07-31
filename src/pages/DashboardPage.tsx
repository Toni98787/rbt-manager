import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore, useCurrentUser, ensureLayout } from '../store/useAppStore';
import { periodTotals, staffPerformance, topProducts } from '../lib/salesStats';
import { money } from '../lib/money';
import { fmtDate, type Period } from '../lib/dates';
import type { StockStatus, WidgetId } from '../types';

function FinancialBlock({
  label,
  period,
  sales,
  currency,
}: {
  label: string;
  period: Period;
  sales: ReturnType<typeof useAppStore.getState>['sales'];
  currency: string;
}) {
  const t = periodTotals(sales, period);
  return (
    <div style={{ minWidth: 140 }}>
      <div className="tiny muted">{label}</div>
      <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{money(t.total, currency)}</div>
      <div className="tiny muted">ex TVA {money(t.exTva, currency)}</div>
      <div className="tiny muted">TVA {money(t.tva, currency)}</div>
    </div>
  );
}

export function DashboardPage() {
  const shop = useAppStore((s) => s.shop);
  const sales = useAppStore((s) => s.sales);
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const staff = useAppStore((s) => s.staff);
  const reserved = useAppStore((s) => s.reservedOrders);
  const events = useAppStore((s) => s.events);
  const supplierOrders = useAppStore((s) => s.supplierOrders);
  const editMode = useAppStore((s) => s.editModeDashboard);
  const setEditMode = useAppStore((s) => s.setEditModeDashboard);
  const toggleWidget = useAppStore((s) => s.toggleWidget);
  const resizeWidget = useAppStore((s) => s.resizeWidget);
  const moveWidget = useAppStore((s) => s.moveWidget);
  const userRaw = useCurrentUser();
  const user = userRaw ? ensureLayout(userRaw) : null;

  const [stockFilter, setStockFilter] = useState<StockStatus | 'all'>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [topPeriod, setTopPeriod] = useState<Period>('week');
  const [staffPeriod, setStaffPeriod] = useState<Period>('month');

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))],
    [products],
  );

  const filteredInventory = products.filter((p) => {
    if (catFilter !== 'all' && p.categoryId !== catFilter) return false;
    if (brandFilter !== 'all' && p.brand !== brandFilter) return false;
    const available = p.stock - p.reserved;
    if (stockFilter === 'available' && available <= 0) return false;
    if (stockFilter === 'reserved' && p.reserved <= 0) return false;
    if (stockFilter === 'out_of_stock' && p.stock > 0) return false;
    if (stockFilter === 'incoming' && p.incoming <= 0) return false;
    return true;
  });

  if (!user) return null;

  const widgets = [...user.layoutPrefs.widgets]
    .filter((w) => (editMode ? true : w.visible))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'quick_actions':
        return (
          <div className="row wrap">
            <Link className="btn primary" to="/pos">
              New sale
            </Link>
            <Link className="btn" to="/inventory">
              Add product
            </Link>
            <Link className="btn" to="/suppliers">
              Receive stock
            </Link>
            <Link className="btn" to="/customers">
              Create customer
            </Link>
            <Link className="btn" to="/sales">
              View reports
            </Link>
          </div>
        );
      case 'sales':
        return (
          <div className="row wrap" style={{ gap: 18 }}>
            <FinancialBlock label="Today" period="today" sales={sales} currency={shop.currency} />
            <FinancialBlock label="This week" period="week" sales={sales} currency={shop.currency} />
            <FinancialBlock label="This month" period="month" sales={sales} currency={shop.currency} />
            <FinancialBlock label="This year" period="year" sales={sales} currency={shop.currency} />
            <Link className="btn ghost" to="/sales">
              Details
            </Link>
          </div>
        );
      case 'inventory':
        return (
          <div className="stack">
            <div className="row wrap">
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                <option value="all">All brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as StockStatus | 'all')}
              >
                <option value="all">All stock levels</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="incoming">Incoming</option>
              </select>
            </div>
            <div className="tiny muted">{filteredInventory.length} products shown</div>
            <div style={{ overflow: 'auto', maxHeight: 140 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Reserved</th>
                    <th>Incoming</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.slice(0, 8).map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.stock}</td>
                      <td>{p.reserved}</td>
                      <td>{p.incoming}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'staff': {
        const rows = staffPerformance(sales, staff, staffPeriod);
        return (
          <div className="stack">
            <div className="row">
              {(['today', 'week', 'month', 'year'] as Period[]).map((p) => (
                <button
                  key={p}
                  className={`chip ${staffPeriod === p ? 'active' : ''}`}
                  onClick={() => setStaffPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Sales</th>
                  <th>Value</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.staffId}>
                    <td>{r.name}</td>
                    <td>{r.salesCount}</td>
                    <td>{money(r.totalValue, shop.currency)}</td>
                    <td>{r.itemsSold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case 'top_products': {
        const rows = topProducts(sales, products, topPeriod);
        return (
          <div className="stack">
            <div className="row">
              {(['today', 'week', 'month'] as Period[]).map((p) => (
                <button
                  key={p}
                  className={`chip ${topPeriod === p ? 'active' : ''}`}
                  onClick={() => setTopPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            {rows.length === 0 ? (
              <div className="muted">No sales in this period.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.productId}>
                      <td>{r.name}</td>
                      <td>{r.qty}</td>
                      <td>{money(r.revenue, shop.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      }
      case 'reserved':
        return (
          <div className="stack">
            {reserved.map((r) => (
              <div key={r.id} className="spread">
                <div>
                  <div style={{ fontWeight: 700 }}>{r.customerName}</div>
                  <div className="tiny muted">
                    {r.productName} × {r.quantity}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="tiny">{fmtDate(r.pickupDate)}</div>
                  <span className="chip">{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        );
      case 'calendar':
        return (
          <div className="stack">
            {events
              .slice()
              .sort((a, b) => a.start.localeCompare(b.start))
              .slice(0, 5)
              .map((e) => (
                <div key={e.id} className="spread">
                  <div className="row">
                    <span
                      className="color-swatch"
                      style={{ background: e.color, width: 12, height: 12 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700 }}>{e.title}</div>
                      <div className="tiny muted">{e.type.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="tiny muted">{fmtDate(e.start)}</div>
                </div>
              ))}
            <Link className="btn ghost" to="/calendar">
              Open calendar
            </Link>
          </div>
        );
      case 'suppliers':
        return (
          <div className="stack">
            {supplierOrders.slice(0, 4).map((o) => (
              <div key={o.id} className="spread">
                <div>
                  <div style={{ fontWeight: 700 }}>{o.supplierName}</div>
                  <div className="tiny muted">{o.items.length} line items</div>
                </div>
                <span className={`status-pill status-${o.status}`}>{o.status.replaceAll('_', ' ')}</span>
              </div>
            ))}
            <Link className="btn ghost" to="/suppliers">
              Manage orders
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  const titles: Record<WidgetId, string> = {
    inventory: 'Inventory overview',
    sales: 'Sales summary',
    staff: 'Staff performance',
    top_products: 'Top products',
    reserved: 'Reserved orders',
    calendar: 'Calendar',
    suppliers: 'Supplier orders',
    quick_actions: 'Quick actions',
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div
        className="panel"
        style={{
          padding: 18,
          backgroundImage: shop.logoDataUrl
            ? `linear-gradient(90deg, color-mix(in srgb, var(--surface) 88%, transparent), transparent), url(${shop.logoDataUrl})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
        }}
      >
        <div className="spread wrap">
          <div>
            <div className="tiny muted">RBT Manager</div>
            <h1 style={{ fontSize: '2.4rem' }}>{shop.name}</h1>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              Your business at a glance — customize this home dashboard.
            </p>
          </div>
          <div className="row wrap">
            <button className="btn" onClick={() => setEditMode(!editMode)}>
              {editMode ? 'Done editing' : 'Customize layout'}
            </button>
          </div>
        </div>
      </div>

      {editMode ? (
        <div className="panel" style={{ padding: 12 }}>
          <div className="tiny muted" style={{ marginBottom: 8 }}>
            Toggle widgets on/off. Resize width (3–12) and height (1–3). Move up/down.
          </div>
          <div className="row wrap">
            {user.layoutPrefs.widgets.map((w) => (
              <button
                key={w.id}
                className={`chip ${w.visible ? 'active' : ''}`}
                onClick={() => toggleWidget(w.id)}
              >
                {titles[w.id]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="dashboard-grid">
        {widgets.map((w) => (
          <section
            key={w.id}
            className={`widget panel w-${w.w} h-${w.h} ${editMode ? 'editing' : ''} ${
              !w.visible ? 'muted' : ''
            }`}
            style={!w.visible ? { opacity: 0.55 } : undefined}
          >
            <div className="spread">
              <h3>{titles[w.id]}</h3>
              {editMode ? (
                <div className="row">
                  <button className="btn ghost" onClick={() => moveWidget(w.id, 'up')}>
                    ↑
                  </button>
                  <button className="btn ghost" onClick={() => moveWidget(w.id, 'down')}>
                    ↓
                  </button>
                  <button className="btn ghost" onClick={() => resizeWidget(w.id, w.w - 2, w.h)}>
                    −W
                  </button>
                  <button className="btn ghost" onClick={() => resizeWidget(w.id, w.w + 2, w.h)}>
                    +W
                  </button>
                  <button className="btn ghost" onClick={() => resizeWidget(w.id, w.w, w.h - 1)}>
                    −H
                  </button>
                  <button className="btn ghost" onClick={() => resizeWidget(w.id, w.w, w.h + 1)}>
                    +H
                  </button>
                </div>
              ) : null}
            </div>
            {w.visible ? renderWidget(w.id) : <div className="muted">Hidden on home</div>}
          </section>
        ))}
      </div>
    </div>
  );
}
