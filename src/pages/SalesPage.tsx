import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { periodTotals, topProducts, salesInPeriod } from '../lib/salesStats';
import { money } from '../lib/money';
import { fmtDateTime, type Period } from '../lib/dates';
import { downloadInvoice, openInvoicePreview, mailtoInvoice } from '../lib/invoice';

export function SalesPage() {
  const shop = useAppStore((s) => s.shop);
  const sales = useAppStore((s) => s.sales);
  const products = useAppStore((s) => s.products);
  const customers = useAppStore((s) => s.customers);
  const [active, setActive] = useState<Period>('today');
  const rows = useMemo(() => salesInPeriod(sales, active), [sales, active]);
  const tops = topProducts(sales, products, active, 10);

  return (
    <div className="stack">
      <div>
        <h1>Sales & reports</h1>
        <p className="muted">Day, week, month, and year — with TVA breakdowns and best sellers.</p>
      </div>

      <div className="row wrap">
        {(['today', 'week', 'month', 'year'] as Period[]).map((p) => (
          <button
            key={p}
            className={`chip ${active === p ? 'active' : ''}`}
            onClick={() => setActive(p)}
          >
            {p === 'today' ? 'Day' : p}
          </button>
        ))}
      </div>

      <div className="grid-3">
        {(['today', 'week', 'month', 'year'] as Period[]).map((p) => {
          const t = periodTotals(sales, p);
          return (
            <div key={p} className="panel" style={{ padding: 14 }}>
              <div className="tiny muted">{p === 'today' ? 'Today' : `This ${p}`}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4 }}>
                {money(t.total, shop.currency)}
              </div>
              <div className="tiny muted" style={{ marginTop: 8 }}>
                Ex TVA: {money(t.exTva, shop.currency)}
              </div>
              <div className="tiny muted">TVA collected: {money(t.tva, shop.currency)}</div>
              <div className="tiny muted">{t.count} sales · inc tax total above</div>
            </div>
          );
        })}
      </div>

      <div className="grid-2">
        <div className="panel" style={{ padding: 12, overflow: 'auto' }}>
          <h3>Transactions — {active}</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>When</th>
                <th>Client</th>
                <th>Staff</th>
                <th>Pay</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>{s.invoiceNumber}</td>
                  <td>{fmtDateTime(s.createdAt)}</td>
                  <td>
                    {s.customerName}
                    {s.isGuest ? ' (Guest)' : ''}
                  </td>
                  <td>{s.staffName}</td>
                  <td>{s.paymentMethod}</td>
                  <td>{money(s.totalIncTva, shop.currency)}</td>
                  <td>
                    <div className="row">
                      <button className="btn ghost" onClick={() => openInvoicePreview(s, shop, true)}>
                        PDF
                      </button>
                      <button className="btn ghost" onClick={() => downloadInvoice(s, shop, true)}>
                        Save
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() =>
                          mailtoInvoice(
                            s,
                            shop,
                            customers.find((c) => c.id === s.customerId)?.email,
                          )
                        }
                      >
                        Mail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel" style={{ padding: 12 }}>
          <h3>What is selling quickly</h3>
          <p className="tiny muted">Best sellers for {active}</p>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty sold</th>
                <th>Revenue</th>
                <th>Stock left</th>
              </tr>
            </thead>
            <tbody>
              {tops.map((t) => (
                <tr key={t.productId}>
                  <td>{t.name}</td>
                  <td>{t.qty}</td>
                  <td>{money(t.revenue, shop.currency)}</td>
                  <td>{t.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
