import { useMemo, useState, type CSSProperties } from 'react';
import {
  Plus,
  Minus,
  Package,
  TrendingUp,
  Users,
  Star,
  CalendarDays,
  Truck,
  Bookmark,
  Zap,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import type { PageId } from '../App';
import type { DashboardWidget, WidgetSize, StockStatus } from '../types';
import {
  formatMoney,
  isAfter,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  ORDER_STATUS_META,
  STOCK_STATUS_LABELS,
} from '../utils/helpers';

function periodSales(
  sales: ReturnType<typeof useStore>['state']['sales'],
  from: Date,
) {
  const filtered = sales.filter((s) => isAfter(s.createdAt, from));
  const ex = filtered.reduce((a, s) => a + (s.subtotalExTva - s.discountAmount), 0);
  const tva = filtered.reduce((a, s) => a + s.tvaAmount, 0);
  const total = filtered.reduce((a, s) => a + s.totalIncTva, 0);
  return { count: filtered.length, ex, tva, total };
}

export function Dashboard({ navigate }: { navigate: (p: PageId) => void }) {
  const { state, updateWidgets, currentStaff } = useStore();
  const [editMode, setEditMode] = useState(false);
  const [invFilter, setInvFilter] = useState<'all' | StockStatus | 'category'>('all');
  const [invCategory, setInvCategory] = useState('all');
  const [salesPeriod, setSalesPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const symbol = state.shop.currencySymbol;

  const widgets = useMemo(
    () =>
      [...state.preferences.widgets]
        .filter((w) => w.visible || editMode)
        .sort((a, b) => a.order - b.order),
    [state.preferences.widgets, editMode],
  );

  const salesToday = periodSales(state.sales, startOfDay());
  const salesWeek = periodSales(state.sales, startOfWeek());
  const salesMonth = periodSales(state.sales, startOfMonth());
  const salesYear = periodSales(state.sales, startOfYear());

  const salesMap = { today: salesToday, week: salesWeek, month: salesMonth, year: salesYear };

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; value: number }>();
    const from =
      salesPeriod === 'today'
        ? startOfDay()
        : salesPeriod === 'week'
          ? startOfWeek()
          : salesPeriod === 'month'
            ? startOfMonth()
            : startOfYear();
    state.sales
      .filter((s) => isAfter(s.createdAt, from))
      .forEach((s) => {
        s.lines.forEach((l) => {
          const cur = map.get(l.productId) ?? { name: l.productName, qty: 0, value: 0 };
          cur.qty += l.quantity;
          cur.value += l.lineTotalExTva;
          map.set(l.productId, cur);
        });
      });
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [state.sales, salesPeriod]);

  const staffPerf = useMemo(() => {
    return state.staff.map((st) => {
      const theirs = state.sales.filter((s) => s.staffId === st.id);
      return {
        id: st.id,
        name: st.name,
        count: theirs.length,
        value: theirs.reduce((a, s) => a + s.totalIncTva, 0),
        items: theirs.reduce((a, s) => a + s.lines.reduce((b, l) => b + l.quantity, 0), 0),
      };
    });
  }, [state.staff, state.sales]);

  const filteredProducts = state.products.filter((p) => {
    if (invCategory !== 'all' && p.categoryId !== invCategory) return false;
    if (invFilter === 'all') return true;
    if (invFilter === 'category') return true;
    if (invFilter === 'reserved') return p.reserved > 0;
    return p.status === invFilter;
  });

  const upcomingEvents = [...state.events]
    .filter((e) => {
      if (currentStaff?.role === 'staff') {
        return e.staffIds.length === 0 || e.staffIds.includes(currentStaff.id);
      }
      return true;
    })
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 5);

  const resizeWidget = (id: string, dir: 1 | -1) => {
    const sizes: WidgetSize[] = ['sm', 'md', 'lg', 'xl'];
    updateWidgets(
      state.preferences.widgets.map((w) => {
        if (w.id !== id) return w;
        const idx = sizes.indexOf(w.size);
        const next = sizes[Math.max(0, Math.min(sizes.length - 1, idx + dir))];
        return { ...w, size: next };
      }),
    );
  };

  const toggleVisible = (id: string) => {
    updateWidgets(
      state.preferences.widgets.map((w) =>
        w.id === id ? { ...w, visible: !w.visible } : w,
      ),
    );
  };

  const moveWidget = (id: string, dir: -1 | 1) => {
    const sorted = [...state.preferences.widgets].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((w) => w.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swap];
    updateWidgets(
      state.preferences.widgets.map((w) => {
        if (w.id === a.id) return { ...w, order: b.order };
        if (w.id === b.id) return { ...w, order: a.order };
        return w;
      }),
    );
  };

  const renderWidget = (w: DashboardWidget) => {
    const muted = !w.visible && editMode;
    return (
      <div
        key={w.id}
        className={`widget size-${w.size}`}
        style={muted ? { opacity: 0.45 } : undefined}
      >
        <div className="widget-header">
          <h3>
            {w.type === 'quick_actions' && 'Quick actions'}
            {w.type === 'sales' && 'Sales summary'}
            {w.type === 'inventory' && 'Inventory overview'}
            {w.type === 'staff' && 'Staff performance'}
            {w.type === 'top_products' && 'Top products'}
            {w.type === 'reserved_orders' && 'Reserved orders'}
            {w.type === 'calendar' && 'Calendar'}
            {w.type === 'supplier_orders' && 'Supplier orders'}
          </h3>
          {editMode ? (
            <div className="widget-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveWidget(w.id, -1)}>
                <Minus size={14} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveWidget(w.id, 1)}>
                <Plus size={14} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => resizeWidget(w.id, -1)}>
                <Minimize2 size={14} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => resizeWidget(w.id, 1)}>
                <Maximize2 size={14} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleVisible(w.id)}>
                {w.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          ) : null}
        </div>
        <div className="widget-body">
          {w.type === 'quick_actions' && (
            <div className="quick-actions">
              <button type="button" className="quick-action" onClick={() => navigate('pos')}>
                <Zap size={18} /> New sale
              </button>
              <button type="button" className="quick-action" onClick={() => navigate('inventory')}>
                <Package size={18} /> Add product
              </button>
              <button type="button" className="quick-action" onClick={() => navigate('suppliers')}>
                <Truck size={18} /> Receive stock
              </button>
              <button type="button" className="quick-action" onClick={() => navigate('customers')}>
                <Users size={18} /> Create customer
              </button>
              <button type="button" className="quick-action" onClick={() => navigate('sales')}>
                <TrendingUp size={18} /> View reports
              </button>
            </div>
          )}

          {w.type === 'sales' && (
            <>
              <div className="filters">
                {(['today', 'week', 'month', 'year'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${salesPeriod === p ? 'btn-primary' : ''}`}
                    onClick={() => setSalesPeriod(p)}
                  >
                    {p === 'today' ? 'Today' : p === 'week' ? 'This week' : p === 'month' ? 'This month' : 'This year'}
                  </button>
                ))}
              </div>
              <div className="stat-row" style={{ marginTop: 10 }}>
                {(
                  [
                    ['Today', salesToday],
                    ['Week', salesWeek],
                    ['Month', salesMonth],
                    ['Year', salesYear],
                  ] as const
                ).map(([label, data]) => (
                  <button
                    key={label}
                    type="button"
                    className="stat-chip"
                    style={{ textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => navigate('sales')}
                  >
                    <div className="label">{label}</div>
                    <div className="value">{formatMoney(data.total, symbol)}</div>
                    <div className="sub">Ex TVA {formatMoney(data.ex, symbol)}</div>
                    <div className="sub">TVA {formatMoney(data.tva, symbol)}</div>
                    <div className="sub">{data.count} sales</div>
                  </button>
                ))}
              </div>
              <div className="panel" style={{ marginTop: 10, padding: 10 }}>
                <strong>
                  Selected:{' '}
                  {salesPeriod === 'today'
                    ? 'Today'
                    : salesPeriod === 'week'
                      ? 'This week'
                      : salesPeriod === 'month'
                        ? 'This month'
                        : 'This year'}
                </strong>
                <div className="stat-row" style={{ marginTop: 8 }}>
                  <div className="stat-chip">
                    <div className="label">Excl. TVA</div>
                    <div className="value">{formatMoney(salesMap[salesPeriod].ex, symbol)}</div>
                  </div>
                  <div className="stat-chip">
                    <div className="label">TVA collected</div>
                    <div className="value">{formatMoney(salesMap[salesPeriod].tva, symbol)}</div>
                  </div>
                  <div className="stat-chip">
                    <div className="label">Incl. tax</div>
                    <div className="value">{formatMoney(salesMap[salesPeriod].total, symbol)}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {w.type === 'inventory' && (
            <>
              <div className="filters">
                <select value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
                  <option value="all">All categories</option>
                  {state.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {(['all', 'available', 'reserved', 'out_of_stock', 'incoming'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`btn btn-sm ${invFilter === f ? 'btn-primary' : ''}`}
                    onClick={() => setInvFilter(f)}
                  >
                    {f === 'all' ? 'All' : STOCK_STATUS_LABELS[f] ?? f}
                  </button>
                ))}
              </div>
              <div className="list-compact" style={{ marginTop: 8 }}>
                {filteredProducts.slice(0, 8).map((p) => (
                  <div key={p.id} className="row">
                    <span>{p.name}</span>
                    <span>
                      <span className="badge">{p.stock}</span>{' '}
                      <span className="badge muted">{STOCK_STATUS_LABELS[p.status]}</span>
                    </span>
                  </div>
                ))}
                {!filteredProducts.length ? <div className="empty">No products match</div> : null}
              </div>
            </>
          )}

          {w.type === 'staff' && (
            <div className="list-compact">
              {staffPerf.map((s) => (
                <div key={s.id} className="row">
                  <span>{s.name}</span>
                  <span>
                    {s.count} sales · {formatMoney(s.value, symbol)} · {s.items} items
                  </span>
                </div>
              ))}
            </div>
          )}

          {w.type === 'top_products' && (
            <>
              <div className="filters">
                {(['today', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${salesPeriod === p ? 'btn-primary' : ''}`}
                    onClick={() => setSalesPeriod(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="list-compact" style={{ marginTop: 8 }}>
                {topProducts.length ? (
                  topProducts.map((p, i) => (
                    <div key={p.name} className="row">
                      <span>
                        <Star size={12} style={{ marginRight: 4 }} />
                        {i + 1}. {p.name}
                      </span>
                      <span>
                        {p.qty} sold · {formatMoney(p.value, symbol)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty">No sales in this period yet</div>
                )}
              </div>
            </>
          )}

          {w.type === 'reserved_orders' && (
            <div className="list-compact">
              {state.reservedOrders.map((o) => (
                <div key={o.id} className="row">
                  <span>
                    <Bookmark size={12} style={{ marginRight: 4 }} />
                    {o.customerName}
                  </span>
                  <span>
                    {o.pickupDate} · <span className="badge">{o.status}</span>
                  </span>
                </div>
              ))}
              {!state.reservedOrders.length ? <div className="empty">No reserved orders</div> : null}
            </div>
          )}

          {w.type === 'calendar' && (
            <div className="list-compact">
              {upcomingEvents.map((e) => (
                <div key={e.id} className="row">
                  <span>
                    <CalendarDays size={12} style={{ marginRight: 4 }} />
                    {e.title}
                  </span>
                  <span>
                    {e.date} {e.time}
                  </span>
                </div>
              ))}
              <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('calendar')}>
                Open calendar
              </button>
            </div>
          )}

          {w.type === 'supplier_orders' && (
            <div className="list-compact">
              {state.supplierOrders
                .filter((o) => o.status !== 'in_store')
                .map((o) => (
                  <div key={o.id} className="row">
                    <span>
                      <Truck size={12} style={{ marginRight: 4 }} />
                      {o.supplierName}
                    </span>
                    <span
                      className="badge"
                      style={{ background: ORDER_STATUS_META[o.status].color, color: '#fff' }}
                    >
                      {ORDER_STATUS_META[o.status].label}
                    </span>
                  </div>
                ))}
              {!state.supplierOrders.filter((o) => o.status !== 'in_store').length ? (
                <div className="empty">Nothing incoming</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div
        className="dash-hero"
        style={
          state.preferences.wallpaper
            ? ({
                ['--dash-wallpaper' as string]: `url(${state.preferences.wallpaper}) center/cover`,
              } as CSSProperties)
            : undefined
        }
      >
        <div className="dash-hero-content">
          <div className="dash-hero-logo">
            {state.shop.logoDataUrl ? (
              <img src={state.shop.logoDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              'RBT'
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2>{state.shop.shopName}</h2>
            <p>
              Welcome back, {currentStaff?.name}. Here is everything happening in your business.
            </p>
          </div>
        </div>
      </div>

      <div className="widget-toolbar">
        <button
          type="button"
          className={`btn ${editMode ? 'btn-primary' : ''}`}
          onClick={() => setEditMode((v) => !v)}
        >
          {editMode ? 'Done customizing' : 'Customize dashboard'}
        </button>
        {editMode ? (
          <span style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
            Resize, reorder, or hide widgets — your layout is saved per session preferences.
          </span>
        ) : null}
      </div>

      <div className="widget-grid">{widgets.map(renderWidget)}</div>
    </div>
  );
}
