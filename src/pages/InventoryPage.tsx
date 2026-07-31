import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ImagePicker } from '../components/common/ImagePicker';
import { Modal } from '../components/common/Modal';
import { money } from '../lib/money';
import { uid } from '../lib/dates';
import type { Product } from '../types';

const blank = (categoryId: string): Product => ({
  id: uid('p'),
  name: '',
  categoryId,
  brand: 'RBT',
  price: 0,
  stock: 0,
  reserved: 0,
  incoming: 0,
  imageDataUrl: null,
  active: true,
});

export function InventoryPage() {
  const shop = useAppStore((s) => s.shop);
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const upsertProduct = useAppStore((s) => s.upsertProduct);
  const deleteProduct = useAppStore((s) => s.deleteProduct);
  const setProductImage = useAppStore((s) => s.setProductImage);
  const addCategory = useAppStore((s) => s.addCategory);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);
  const reorderCategory = useAppStore((s) => s.reorderCategory);
  const receiveStock = useAppStore((s) => s.receiveStock);

  const [editing, setEditing] = useState<Product | null>(null);
  const [catName, setCatName] = useState('');
  const [manageCats, setManageCats] = useState(false);

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  return (
    <div className="stack">
      <div className="spread wrap">
        <div>
          <h1>Inventory</h1>
          <p className="muted">Add products with photos from your iPad gallery. Manage categories.</p>
        </div>
        <div className="row wrap">
          <button className="btn" onClick={() => setManageCats(true)}>
            Manage categories
          </button>
          <button
            className="btn primary"
            onClick={() => setEditing(blank(sorted[0]?.id || ''))}
          >
            Add product
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 12, overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Reserved</th>
              <th>Incoming</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: '#222',
                    }}
                  >
                    {p.imageDataUrl ? (
                      <img src={p.imageDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                  </div>
                </td>
                <td>{p.name}</td>
                <td>{categories.find((c) => c.id === p.categoryId)?.name || '—'}</td>
                <td>{p.brand}</td>
                <td>{money(p.price, shop.currency)}</td>
                <td>{p.stock}</td>
                <td>{p.reserved}</td>
                <td>{p.incoming}</td>
                <td>
                  <div className="row">
                    <button className="btn ghost" onClick={() => setEditing(p)}>
                      Edit
                    </button>
                    <button
                      className="btn ghost"
                      onClick={() => {
                        const q = Number(prompt('Receive quantity', '1'));
                        if (q > 0) receiveStock(p.id, q);
                      }}
                    >
                      Receive
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} title={editing && products.some((p) => p.id === editing.id) ? 'Edit product' : 'Add product'} onClose={() => setEditing(null)} wide>
        {editing ? (
          <div className="stack">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#222',
                  flex: '0 0 auto',
                }}
              >
                {editing.imageDataUrl ? (
                  <img
                    src={editing.imageDataUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="muted" style={{ padding: 16 }}>
                    No photo
                  </div>
                )}
              </div>
              <div className="stack">
                <ImagePicker
                  label="Import from iPad gallery"
                  onPick={(dataUrl) => {
                    setEditing({ ...editing, imageDataUrl: dataUrl });
                    setProductImage(editing.id, dataUrl);
                  }}
                />
                <button
                  className="btn ghost"
                  onClick={() => {
                    setEditing({ ...editing, imageDataUrl: null });
                    setProductImage(editing.id, null);
                  }}
                >
                  Remove photo
                </button>
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Name</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Brand</label>
                <input
                  value={editing.brand}
                  onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Category</label>
                <select
                  value={editing.categoryId}
                  onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                >
                  {sorted.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Price (ex TVA)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="field">
                <label>Stock</label>
                <input
                  type="number"
                  min={0}
                  value={editing.stock}
                  onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="field">
                <label>Incoming</label>
                <input
                  type="number"
                  min={0}
                  value={editing.incoming}
                  onChange={(e) => setEditing({ ...editing, incoming: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="field">
                <label>Barcode (optional)</label>
                <input
                  value={editing.barcode || ''}
                  onChange={(e) => setEditing({ ...editing, barcode: e.target.value })}
                />
              </div>
            </div>
            <div className="row">
              <button
                className="btn primary"
                onClick={() => {
                  if (!editing.name.trim()) return;
                  upsertProduct(editing);
                  setEditing(null);
                }}
              >
                Save product
              </button>
              {products.some((p) => p.id === editing.id) ? (
                <button
                  className="btn danger"
                  onClick={() => {
                    deleteProduct(editing.id);
                    setEditing(null);
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={manageCats} title="Categories / windows" onClose={() => setManageCats(false)}>
        <div className="stack">
          <div className="row">
            <input
              placeholder="New category name"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="btn primary"
              onClick={() => {
                if (!catName.trim()) return;
                addCategory(catName.trim());
                setCatName('');
              }}
            >
              Add
            </button>
          </div>
          {sorted.map((c) => (
            <div key={c.id} className="spread">
              <input
                value={c.name}
                onChange={(e) => updateCategory(c.id, e.target.value)}
                style={{ flex: 1 }}
              />
              <div className="row">
                <button className="btn ghost" onClick={() => reorderCategory(c.id, -1)}>
                  ↑
                </button>
                <button className="btn ghost" onClick={() => reorderCategory(c.id, 1)}>
                  ↓
                </button>
                <button className="btn danger" onClick={() => deleteCategory(c.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
