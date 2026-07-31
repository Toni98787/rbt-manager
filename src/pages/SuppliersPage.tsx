import { useState } from 'react';
import { useAppStore, useCurrentUser } from '../store/useAppStore';
import { Modal } from '../components/common/Modal';
import { fmtDate, uid } from '../lib/dates';
import type { SupplierOrder, SupplierOrderStatus } from '../types';

const statuses: SupplierOrderStatus[] = ['ordered', 'on_the_way', 'arrived', 'in_store'];

const blank = (): SupplierOrder => ({
  id: uid('so'),
  supplierId: '',
  supplierName: '',
  items: [],
  status: 'ordered',
  orderedAt: new Date().toISOString(),
  expectedAt: new Date(Date.now() + 3 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
});

export function SuppliersPage() {
  const orders = useAppStore((s) => s.supplierOrders);
  const suppliers = useAppStore((s) => s.suppliers);
  const products = useAppStore((s) => s.products);
  const updateStatus = useAppStore((s) => s.updateSupplierOrderStatus);
  const receive = useAppStore((s) => s.receiveSupplierOrder);
  const upsert = useAppStore((s) => s.upsertSupplierOrder);
  const user = useCurrentUser();
  const isOwner = user?.role === 'owner';
  const [editing, setEditing] = useState<SupplierOrder | null>(null);

  return (
    <div className="stack">
      <div className="spread wrap">
        <div>
          <h1>Supplier orders</h1>
          <p className="muted">
            Track Ordered → On the way → Arrived → In store. Receive stock when ready.
          </p>
        </div>
        {isOwner ? (
          <button
            className="btn primary"
            onClick={() => {
              const first = suppliers[0];
              setEditing({
                ...blank(),
                supplierId: first?.id || '',
                supplierName: first?.name || '',
                items: products[0]
                  ? [{ productId: products[0].id, productName: products[0].name, quantity: 10 }]
                  : [],
              });
            }}
          >
            New order
          </button>
        ) : null}
      </div>

      {!isOwner ? (
        <div className="panel" style={{ padding: 14 }}>
          <h3>Incoming (staff view)</h3>
          <div className="stack" style={{ marginTop: 8 }}>
            {orders
              .filter((o) => o.status !== 'in_store')
              .map((o) => (
                <div key={o.id} className="spread">
                  <div>
                    <div style={{ fontWeight: 700 }}>{o.supplierName}</div>
                    <div className="tiny muted">
                      Expected {o.expectedAt ? fmtDate(o.expectedAt) : 'TBD'}
                    </div>
                  </div>
                  <span className={`status-pill status-${o.status}`}>
                    {o.status.replaceAll('_', ' ')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      <div className="stack">
        {orders.map((o) => {
          const stepIndex = statuses.indexOf(o.status);
          return (
            <article key={o.id} className="panel" style={{ padding: 14 }}>
              <div className="spread wrap">
                <div>
                  <h3>{o.supplierName}</h3>
                  <div className="tiny muted">
                    Ordered {fmtDate(o.orderedAt)}
                    {o.expectedAt ? ` · Expected ${fmtDate(o.expectedAt)}` : ''}
                  </div>
                </div>
                <span className={`status-pill status-${o.status}`}>
                  {o.status.replaceAll('_', ' ')}
                </span>
              </div>

              <div className="timeline">
                {statuses.map((s, i) => (
                  <div
                    key={s}
                    className={`step ${i < stepIndex ? 'done' : ''} ${i === stepIndex ? 'current' : ''}`}
                  >
                    {s.replaceAll('_', ' ')}
                  </div>
                ))}
              </div>

              <div className="tiny muted" style={{ marginTop: 10 }}>
                {o.items.map((i) => `${i.productName} × ${i.quantity}`).join(' · ')}
              </div>

              {isOwner ? (
                <div className="row wrap" style={{ marginTop: 12 }}>
                  {statuses.map((s) => (
                    <button
                      key={s}
                      className={`chip ${o.status === s ? 'active' : ''}`}
                      onClick={() => updateStatus(o.id, s)}
                    >
                      {s.replaceAll('_', ' ')}
                    </button>
                  ))}
                  {o.status === 'in_store' ? (
                    <button className="btn primary" onClick={() => receive(o.id)}>
                      Receive into inventory
                    </button>
                  ) : null}
                  <button className="btn ghost" onClick={() => setEditing(o)}>
                    Edit
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <Modal open={!!editing && isOwner} title="Supplier order" onClose={() => setEditing(null)}>
        {editing ? (
          <div className="stack">
            <div className="field">
              <label>Supplier</label>
              <select
                value={editing.supplierId}
                onChange={(e) => {
                  const sup = suppliers.find((s) => s.id === e.target.value);
                  setEditing({
                    ...editing,
                    supplierId: e.target.value,
                    supplierName: sup?.name || '',
                  });
                }}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Expected date</label>
              <input
                type="date"
                value={(editing.expectedAt || '').slice(0, 10)}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    expectedAt: new Date(e.target.value).toISOString(),
                  })
                }
              />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                rows={2}
                value={editing.notes || ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              />
            </div>
            <div className="field">
              <label>First line product</label>
              <select
                value={editing.items[0]?.productId || ''}
                onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value);
                  if (!p) return;
                  setEditing({
                    ...editing,
                    items: [
                      {
                        productId: p.id,
                        productName: p.name,
                        quantity: editing.items[0]?.quantity || 10,
                      },
                    ],
                  });
                }}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Quantity</label>
              <input
                type="number"
                min={1}
                value={editing.items[0]?.quantity || 1}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    items: editing.items.map((item, idx) =>
                      idx === 0
                        ? { ...item, quantity: Number(e.target.value) || 1 }
                        : item,
                    ),
                  })
                }
              />
            </div>
            <button
              className="btn primary"
              onClick={() => {
                upsert({ ...editing, updatedAt: new Date().toISOString() });
                setEditing(null);
              }}
            >
              Save order
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
