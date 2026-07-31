import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Modal } from '../components/common/Modal';
import { uid } from '../lib/dates';
import type { Customer } from '../types';

const blank = (): Customer => ({
  id: uid('cust'),
  name: '',
  phone: '',
  email: '',
  isProfessional: false,
  discountType: 'percent',
  discountValue: 0,
  createdAt: new Date().toISOString(),
});

export function CustomersPage() {
  const customers = useAppStore((s) => s.customers);
  const upsertCustomer = useAppStore((s) => s.upsertCustomer);
  const convertGuestToCustomer = useAppStore((s) => s.convertGuestToCustomer);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [guestName, setGuestName] = useState('');

  return (
    <div className="stack">
      <div className="spread wrap">
        <div>
          <h1>Customers</h1>
          <p className="muted">
            Optional accounts with automatic discounts. Guests can buy without an account.
          </p>
        </div>
        <button className="btn primary" onClick={() => setEditing(blank())}>
          Create customer
        </button>
      </div>

      <div className="panel" style={{ padding: 14 }}>
        <h3>Convert guest to account</h3>
        <div className="row" style={{ marginTop: 8 }}>
          <input
            placeholder="Guest name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn"
            onClick={() => {
              if (!guestName.trim()) return;
              const id = convertGuestToCustomer(guestName.trim());
              const created = useAppStore.getState().customers.find((c) => c.id === id);
              if (created) setEditing(created);
              setGuestName('');
            }}
          >
            Convert in a few taps
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 12, overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Type</th>
              <th>Default discount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.email || '—'}</td>
                <td>{c.isProfessional ? 'Professional' : 'Regular'}</td>
                <td>
                  {c.discountValue
                    ? c.discountType === 'percent'
                      ? `${c.discountValue}%`
                      : c.discountValue
                    : 'None'}
                </td>
                <td>
                  <button className="btn ghost" onClick={() => setEditing(c)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} title="Customer account" onClose={() => setEditing(null)}>
        {editing ? (
          <div className="stack">
            <div className="grid-2">
              <div className="field">
                <label>Name</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input
                  value={editing.phone || ''}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  value={editing.email || ''}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Account type</label>
                <select
                  value={editing.isProfessional ? 'pro' : 'regular'}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      isProfessional: e.target.value === 'pro',
                      discountValue:
                        e.target.value === 'pro' && !editing.discountValue
                          ? 10
                          : editing.discountValue,
                    })
                  }
                >
                  <option value="regular">Regular</option>
                  <option value="pro">Professional</option>
                </select>
              </div>
              <div className="field">
                <label>Discount type</label>
                <select
                  value={editing.discountType}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      discountType: e.target.value as 'percent' | 'fixed',
                    })
                  }
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <div className="field">
                <label>Discount value</label>
                <input
                  type="number"
                  min={0}
                  value={editing.discountValue}
                  onChange={(e) =>
                    setEditing({ ...editing, discountValue: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                rows={3}
                value={editing.notes || ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              />
            </div>
            <button
              className="btn primary"
              onClick={() => {
                if (!editing.name.trim()) return;
                upsertCustomer(editing);
                setEditing(null);
              }}
            >
              Save account
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
