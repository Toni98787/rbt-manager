import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import type { Customer, DiscountType } from '../types';

const blank = {
  name: '',
  phone: '',
  email: '',
  isProfessional: false,
  defaultDiscountType: '' as '' | DiscountType,
  defaultDiscountValue: '0',
  notes: '',
};

export function CustomersPage() {
  const { state, addCustomer, updateCustomer } = useStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blank);

  const openCreate = () => {
    setEditingId(null);
    setForm(blank);
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      isProfessional: c.isProfessional,
      defaultDiscountType: c.defaultDiscountType ?? '',
      defaultDiscountValue: String(c.defaultDiscountValue),
      notes: c.notes,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      isProfessional: form.isProfessional,
      defaultDiscountType: (form.defaultDiscountType || null) as DiscountType | null,
      defaultDiscountValue: parseFloat(form.defaultDiscountValue) || 0,
      notes: form.notes,
    };
    if (editingId) updateCustomer(editingId, payload);
    else addCustomer(payload);
    setOpen(false);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Create customer
        </button>
      </div>
      <p style={{ color: 'var(--color-muted)', marginTop: -8 }}>
        Guest walk-ins work without an account. Create profiles for regulars and professionals to apply automatic discounts at checkout.
      </p>

      <div className="panel" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Contact</th>
              <th>Default discount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>
                  <span className={`badge ${c.isProfessional ? 'success' : 'muted'}`}>
                    {c.isProfessional ? 'Professional' : 'Personal'}
                  </span>
                </td>
                <td>
                  {c.phone}
                  <div style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>{c.email}</div>
                </td>
                <td>
                  {c.defaultDiscountType
                    ? c.defaultDiscountType === 'percentage'
                      ? `${c.defaultDiscountValue}%`
                      : `${state.shop.currencySymbol}${c.defaultDiscountValue.toFixed(2)}`
                    : '—'}
                </td>
                <td>
                  <button type="button" className="btn btn-sm" onClick={() => openEdit(c)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit customer' : 'New customer'}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="field">
                <label>Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={form.isProfessional}
                onChange={(e) => setForm({ ...form, isProfessional: e.target.checked })}
              />
              Professional account
            </label>
            <div className="field-row">
              <div className="field">
                <label>Discount type</label>
                <select
                  value={form.defaultDiscountType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      defaultDiscountType: e.target.value as '' | DiscountType,
                    })
                  }
                >
                  <option value="">None</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <div className="field">
                <label>Discount value</label>
                <input
                  type="number"
                  value={form.defaultDiscountValue}
                  onChange={(e) => setForm({ ...form, defaultDiscountValue: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
