import { useState } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { formatMoney, readFileAsDataUrl, STOCK_STATUS_LABELS } from '../utils/helpers';
import type { Product, StockStatus } from '../types';

const emptyForm = {
  name: '',
  categoryId: '',
  price: '',
  stock: '',
  brand: '',
  barcode: '',
  status: 'available' as StockStatus,
  saleDiscountPercent: '0',
  imageDataUrl: null as string | null,
};

export function InventoryPage() {
  const { state, addProduct, updateProduct, deleteProduct } = useStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm, categoryId: state.categories[0]?.id ?? '' });
  const [filterCat, setFilterCat] = useState('all');
  const symbol = state.shop.currencySymbol;

  const products = state.products.filter((p) =>
    filterCat === 'all' ? true : p.categoryId === filterCat,
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: state.categories[0]?.id ?? '' });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      categoryId: p.categoryId,
      price: String(p.price),
      stock: String(p.stock),
      brand: p.brand,
      barcode: p.barcode ?? '',
      status: p.status,
      saleDiscountPercent: String(p.saleDiscountPercent),
      imageDataUrl: p.imageDataUrl,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.categoryId) return;
    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock, 10) || 0,
      reserved: 0,
      brand: form.brand.trim(),
      imageDataUrl: form.imageDataUrl,
      barcode: form.barcode.trim() || null,
      status: form.status,
      saleDiscountPercent: parseFloat(form.saleDiscountPercent) || 0,
    };
    if (editingId) updateProduct(editingId, payload);
    else addProduct(payload);
    setOpen(false);
  };

  const onImage = async (file: File | null) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setForm((f) => ({ ...f, imageDataUrl: dataUrl }));
  };

  return (
    <div>
      <div className="page-header">
        <h2>Inventory</h2>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add product
        </button>
      </div>

      <div className="toolbar">
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="all">All categories</option>
          {state.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <span style={{ color: 'var(--color-muted)' }}>{products.length} products</span>
      </div>

      <div className="product-grid" style={{ maxHeight: 'none' }}>
        {products.map((p) => {
          const cat = state.categories.find((c) => c.id === p.categoryId);
          return (
            <div key={p.id} className="product-card">
              <div className="product-image" onClick={() => openEdit(p)} style={{ cursor: 'pointer' }}>
                {p.imageDataUrl ? (
                  <img src={p.imageDataUrl} alt={p.name} />
                ) : (
                  <span>
                    <Package size={28} />
                    <div style={{ marginTop: 4 }}>Tap to add photo</div>
                  </span>
                )}
              </div>
              <div className="product-name">{p.name}</div>
              <div className="product-price">{formatMoney(p.price, symbol)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                {cat?.name ?? '—'} · Stock {p.stock} · {STOCK_STATUS_LABELS[p.status]}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="btn btn-sm" style={{ flex: 1 }} onClick={() => openEdit(p)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit product' : 'Add product'}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Close</button>
            </div>

            <div
              className="product-image"
              style={{ marginBottom: 12, maxWidth: 180, aspectRatio: '1', marginInline: 'auto' }}
            >
              {form.imageDataUrl ? (
                <img src={form.imageDataUrl} alt="" />
              ) : (
                <span>Product photo</span>
              )}
            </div>
            <div className="field">
              <label>Photo</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => onImage(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  {state.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Brand</label>
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Price (excl. TVA)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Stock</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as StockStatus })}
                >
                  {Object.entries(STOCK_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Sale discount %</label>
                <input
                  type="number"
                  value={form.saleDiscountPercent}
                  onChange={(e) => setForm({ ...form, saleDiscountPercent: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Barcode (optional)</label>
              <input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="Leave empty — tap-to-select POS does not require scanning"
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={save}>Save product</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
