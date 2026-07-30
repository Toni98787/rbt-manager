import { useMemo, useState } from 'react';
import { useStore } from '../store/StoreContext';
import {
  formatMoney,
  isAfter,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from '../utils/helpers';
import { InvoiceModal } from '../components/InvoiceModal';
import type { Sale } from '../types';

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

export function SalesPage() {
  const { state } = useStore();
  const [period, setPeriod] = useState<Period>('day');
  const [selected, setSelected] = useState<Sale | null>(null);
  const symbol = state.shop.currencySymbol;

  const filtered = useMemo(() => {
    const from =
      period === 'day'
        ? startOfDay()
        : period === 'week'
          ? startOfWeek()
          : period === 'month'
            ? startOfMonth()
            : period === 'year'
              ? startOfYear()
              : new Date(0);
    return state.sales.filter((s) => isAfter(s.createdAt, from));
  }, [state.sales, period]);

  const totals = useMemo(() => {
    const ex = filtered.reduce((a, s) => a + (s.subtotalExTva - s.discountAmount), 0);
    const tva = filtered.reduce((a, s) => a + s.tvaAmount, 0);
    const total = filtered.reduce((a, s) => a + s.totalIncTva, 0);
    return { ex, tva, total, count: filtered.length };
  }, [filtered]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; value: number }>();
    filtered.forEach((s) => {
      s.lines.forEach((l) => {
        const cur = map.get(l.productId) ?? { name: l.productName, qty: 0, value: 0 };
        cur.qty += l.quantity;
        cur.value += l.lineTotalExTva;
        map.set(l.productId, cur);
      });
    });
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [filtered]);

  return (
    <div>
      <div className="page-header">
        <h2>Sales & reports</h2>
      </div>

      <div className="filters" style={{ marginBottom: 12 }}>
        {(
          [
            ['day', 'Today'],
            ['week', 'This week'],
            ['month', 'This month'],
            ['year', 'This year'],
            ['all', 'All'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn btn-sm ${period === id ? 'btn-primary' : ''}`}
            onClick={() => setPeriod(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="stat-row" style={{ marginBottom: 14 }}>
        <div className="stat-chip">
          <div className="label">Sales count</div>
          <div className="value">{totals.count}</div>
        </div>
        <div className="stat-chip">
          <div className="label">Excl. TVA</div>
          <div className="value">{formatMoney(totals.ex, symbol)}</div>
        </div>
        <div className="stat-chip">
          <div className="label">TVA collected</div>
          <div className="value">{formatMoney(totals.tva, symbol)}</div>
        </div>
        <div className="stat-chip">
          <div className="label">Total incl. tax</div>
          <div className="value">{formatMoney(totals.total, symbol)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Transactions</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>When</th>
                <th>Client</th>
                <th>Staff</th>
                <th>Pay</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(s)}>
                  <td>{s.invoiceNumber}</td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>{s.customerName ?? 'Guest'}</td>
                  <td>{s.staffName}</td>
                  <td>{s.paymentMethod}</td>
                  <td>{formatMoney(s.totalIncTva, symbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length ? <div className="empty">No sales in this period</div> : null}
        </div>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Best sellers</h3>
          <div className="list-compact">
            {topProducts.map((p, i) => (
              <div key={p.name} className="row">
                <span>
                  {i + 1}. {p.name}
                </span>
                <span>
                  {p.qty} · {formatMoney(p.value, symbol)}
                </span>
              </div>
            ))}
            {!topProducts.length ? <div className="empty">Nothing sold yet</div> : null}
          </div>
        </div>
      </div>

      {selected ? <InvoiceModal sale={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
