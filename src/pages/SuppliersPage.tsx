import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { ORDER_STATUS_META } from '../utils/helpers';
import type { SupplierOrderStatus } from '../types';

const STATUSES: SupplierOrderStatus[] = ['ordered', 'on_the_way', 'arrived', 'in_store'];

export function SuppliersPage() {
  const {
    state,
    updateSupplierOrderStatus,
    receiveSupplierOrder,
    addSupplierOrder,
    currentStaff,
  } = useStore();
  const isOwner = currentStaff?.role === 'owner';
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    supplierId: state.suppliers[0]?.id ?? '',
    productId: state.products[0]?.id ?? '',
    quantity: '12',
    unitCost: '1',
    expectedAt: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    notes: '',
  });

  const statusIndex = (s: SupplierOrderStatus) => STATUSES.indexOf(s);

  return (
    <div>
      <div className="page-header">
        <h2>Supplier orders</h2>
        {isOwner ? (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> New order
          </button>
        ) : null}
      </div>
      <p style={{ color: 'var(--color-muted)', marginTop: -8 }}>
        {isOwner
          ? 'Update status with one tap. When marked in store, receive to update inventory.'
          : 'View-only incoming deliveries for your shift.'}
      </p>

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {state.supplierOrders.map((order) => {
          const idx = statusIndex(order.status);
          return (
            <div key={order.id} className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{order.supplierName}</h3>
                  <div style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                    Expected {order.expectedAt} · Ordered {new Date(order.orderedAt).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className="badge"
                  style={{ background: ORDER_STATUS_META[order.status].color, color: '#fff' }}
                >
                  {ORDER_STATUS_META[order.status].label}
                </span>
              </div>

              <div className="timeline">
                {STATUSES.map((s, i) => (
                  <div
                    key={s}
                    className={`timeline-step ${i < idx ? 'done' : ''} ${i === idx ? 'active' : ''}`}
                  >
                    <div className="dot" />
                    {ORDER_STATUS_META[s].label}
                  </div>
                ))}
              </div>

              <div className="list-compact" style={{ marginTop: 8 }}>
                {order.items.map((item, i) => (
                  <div key={`${item.productName}-${i}`} className="row">
                    <span>{item.productName}</span>
                    <span>×{item.quantity}</span>
                  </div>
                ))}
              </div>

              {isOwner ? (
                <div className="filters" style={{ marginTop: 12 }}>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn btn-sm ${order.status === s ? 'btn-primary' : ''}`}
                      style={
                        order.status === s
                          ? undefined
                          : { borderColor: ORDER_STATUS_META[s].color, color: ORDER_STATUS_META[s].color }
                      }
                      onClick={() => updateSupplierOrderStatus(order.id, s)}
                    >
                      {ORDER_STATUS_META[s].label}
                    </button>
                  ))}
                  {(order.status === 'arrived' || order.status === 'in_store') && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() => receiveSupplierOrder(order.id)}
                      disabled={order.status === 'in_store'}
                    >
                      Receive into inventory
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New supplier order</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="field">
              <label>Supplier</label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              >
                {state.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Product</label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
              >
                {state.products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Quantity</label>
                <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="field">
                <label>Unit cost</label>
                <input value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Expected date</label>
              <input type="date" value={form.expectedAt} onChange={(e) => setForm({ ...form, expectedAt: e.target.value })} />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const supplier = state.suppliers.find((s) => s.id === form.supplierId);
                  const product = state.products.find((p) => p.id === form.productId);
                  if (!supplier || !product) return;
                  addSupplierOrder({
                    supplierId: supplier.id,
                    supplierName: supplier.name,
                    items: [
                      {
                        productId: product.id,
                        productName: product.name,
                        quantity: parseInt(form.quantity, 10) || 1,
                        unitCost: parseFloat(form.unitCost) || 0,
                      },
                    ],
                    status: 'ordered',
                    orderedAt: new Date().toISOString(),
                    expectedAt: form.expectedAt,
                    notes: form.notes,
                  });
                  setOpen(false);
                }}
              >
                Create order
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
