import { useMemo, useState } from 'react';
import { Package, Plus, Trash2, Pencil, UserRound } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { formatMoney } from '../utils/helpers';
import { InvoiceModal } from '../components/InvoiceModal';
import type { PaymentMethod, Sale } from '../types';

export function POSPage() {
  const {
    state,
    cart,
    setCart,
    selectedCustomerId,
    setSelectedCustomerId,
    setCartDiscountOverride,
    cartTotals,
    activeCustomer,
    currentStaff,
    completeSale,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [catModal, setCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#c9a227');
  const [overrideInput, setOverrideInput] = useState('');

  const symbol = state.shop.currencySymbol;
  const categories = [...state.categories].sort((a, b) => a.order - b.order);

  const products = useMemo(() => {
    return state.products.filter((p) =>
      activeCategory === 'all' ? true : p.categoryId === activeCategory,
    );
  }, [state.products, activeCategory]);

  const getQty = (id: string) => qtyMap[id] ?? 1;

  const setQty = (id: string, qty: number) => {
    setQtyMap((m) => ({ ...m, [id]: Math.max(1, qty) }));
  };

  const addToCart = (productId: string) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product || product.stock <= 0) return;
    const qty = Math.min(getQty(productId), product.stock);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(product.stock, i.quantity + qty) }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId,
          quantity: qty,
          unitPrice: product.price,
          discountPercent: product.saleDiscountPercent || 0,
        },
      ];
    });
    setQtyMap((m) => ({ ...m, [productId]: 1 }));
  };

  const updateCartQty = (productId: string, quantity: number) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(product.stock, quantity) }
          : i,
      ),
    );
  };

  const pay = (method: PaymentMethod) => {
    const sale = completeSale(method);
    if (sale) {
      setLastSale(sale);
      setCheckoutOpen(false);
    }
  };

  const canOverride = currentStaff?.canOverrideDiscount || currentStaff?.role === 'owner';

  return (
    <div className="pos-layout">
      <div className="pos-main">
        <div className="category-tabs">
          <button
            type="button"
            className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`category-tab ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
              style={
                activeCategory === c.id
                  ? undefined
                  : { borderColor: c.color, color: c.color }
              }
            >
              {c.name}
            </button>
          ))}
          <button
            type="button"
            className="category-tab"
            onClick={() => setCatModal(true)}
            title="Manage categories"
          >
            <Pencil size={14} /> Manage
          </button>
        </div>

        <div className="product-grid">
          {products.map((p) => {
            const out = p.stock <= 0;
            return (
              <div key={p.id} className={`product-card ${out ? 'out' : ''}`}>
                <div className="product-image">
                  {p.imageDataUrl ? (
                    <img src={p.imageDataUrl} alt={p.name} />
                  ) : (
                    <span>
                      <Package size={28} />
                      <div style={{ marginTop: 4 }}>Add photo</div>
                    </span>
                  )}
                </div>
                <div className="product-name">{p.name}</div>
                <div className="product-price">
                  {formatMoney(p.price, symbol)}
                  {p.saleDiscountPercent ? (
                    <span className="badge" style={{ marginLeft: 6 }}>
                      -{p.saleDiscountPercent}%
                    </span>
                  ) : null}
                </div>
                <div className="qty-controls">
                  <button
                    type="button"
                    disabled={out}
                    onClick={() => setQty(p.id, getQty(p.id) - 1)}
                  >
                    −
                  </button>
                  <div className="qty">{getQty(p.id)}</div>
                  <button
                    type="button"
                    disabled={out}
                    onClick={() => setQty(p.id, Math.min(p.stock, getQty(p.id) + 1))}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="product-select"
                  disabled={out}
                  onClick={() => addToCart(p.id)}
                >
                  {out ? 'Out of stock' : 'Select'}
                </button>
              </div>
            );
          })}
          {!products.length ? (
            <div className="empty" style={{ gridColumn: '1 / -1' }}>
              No products in this category. Add some in Stock.
            </div>
          ) : null}
        </div>
      </div>

      <aside className="cart-panel">
        <div className="cart-header">
          <h3>Cart ({cart.reduce((a, i) => a + i.quantity, 0)})</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setCart([])}
            disabled={!cart.length}
          >
            Clear
          </button>
        </div>

        <div style={{ padding: '8px 12px', borderBottom: '1px solid color-mix(in srgb, var(--color-text) 8%, transparent)' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label><UserRound size={12} /> Customer</label>
            <select
              value={selectedCustomerId ?? ''}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value || null);
                setCartDiscountOverride(null);
                setOverrideInput('');
              }}
            >
              <option value="">Guest (walk-in)</option>
              {state.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isProfessional ? ' ★ Pro' : ''}
                </option>
              ))}
            </select>
          </div>
          {activeCustomer?.defaultDiscountType ? (
            <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--color-muted)' }}>
              Auto discount:{' '}
              {activeCustomer.defaultDiscountType === 'percentage'
                ? `${activeCustomer.defaultDiscountValue}%`
                : formatMoney(activeCustomer.defaultDiscountValue, symbol)}
              {canOverride ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input
                    placeholder="Override amount"
                    value={overrideInput}
                    onChange={(e) => setOverrideInput(e.target.value)}
                    style={{ flex: 1, minHeight: 34, borderRadius: 8, border: '1px solid #444', background: 'transparent', padding: '0 8px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      const n = parseFloat(overrideInput);
                      if (!Number.isNaN(n)) setCartDiscountOverride(Math.max(0, n));
                    }}
                  >
                    Apply
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="cart-items">
          {cart.map((item) => {
            const product = state.products.find((p) => p.id === item.productId);
            return (
              <div key={item.productId} className="cart-item">
                <div className="name">{product?.name ?? 'Item'}</div>
                <strong>{formatMoney(item.unitPrice * item.quantity * (1 - item.discountPercent / 100), symbol)}</strong>
                <div className="meta">
                  <div className="qty-controls" style={{ maxWidth: 140 }}>
                    <button type="button" onClick={() => updateCartQty(item.productId, item.quantity - 1)}>−</button>
                    <div className="qty">{item.quantity}</div>
                    <button type="button" onClick={() => updateCartQty(item.productId, item.quantity + 1)}>+</button>
                  </div>
                </div>
              </div>
            );
          })}
          {!cart.length ? <div className="empty">Tap Select on products to build the cart</div> : null}
        </div>

        <div className="cart-footer">
          <div className="totals-row">
            <span>Subtotal (excl. TVA)</span>
            <span>{formatMoney(cartTotals.subtotalExTva, symbol)}</span>
          </div>
          {cartTotals.discountAmount > 0 ? (
            <div className="totals-row">
              <span>Discount</span>
              <span>−{formatMoney(cartTotals.discountAmount, symbol)}</span>
            </div>
          ) : null}
          <div className="totals-row">
            <span>TVA ({state.shop.tvaPercent}%)</span>
            <span>{formatMoney(cartTotals.tvaAmount, symbol)}</span>
          </div>
          <div className="totals-row total">
            <span>Total</span>
            <span>{formatMoney(cartTotals.totalIncTva, symbol)}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!cart.length}
            onClick={() => setCheckoutOpen(true)}
          >
            Charge · {formatMoney(cartTotals.totalIncTva, symbol)}
          </button>
        </div>
      </aside>

      {checkoutOpen ? (
        <div className="modal-backdrop" onClick={() => setCheckoutOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm payment</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCheckoutOpen(false)}>Close</button>
            </div>
            <p style={{ color: 'var(--color-muted)' }}>
              Process the payment yourself, then confirm how the client paid. An invoice will be generated.
            </p>
            <div className="stat-row" style={{ marginBottom: 16 }}>
              <div className="stat-chip">
                <div className="label">Customer</div>
                <div className="value" style={{ fontSize: '1rem' }}>
                  {activeCustomer?.name ?? 'Guest'}
                </div>
              </div>
              <div className="stat-chip">
                <div className="label">Total incl. TVA</div>
                <div className="value">{formatMoney(cartTotals.totalIncTva, symbol)}</div>
              </div>
            </div>
            <div className="cart-actions">
              <button type="button" className="btn btn-success" onClick={() => pay('cash')}>
                Paid by cash
              </button>
              <button type="button" className="btn btn-primary" onClick={() => pay('card')}>
                Paid by card
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {lastSale ? (
        <InvoiceModal sale={lastSale} onClose={() => setLastSale(null)} />
      ) : null}

      {catModal ? (
        <div className="modal-backdrop" onClick={() => setCatModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage categories</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCatModal(false)}>Close</button>
            </div>
            <div className="list-compact">
              {categories.map((c) => (
                <div key={c.id} className="row">
                  <input
                    value={c.name}
                    onChange={(e) => updateCategory(c.id, { name: e.target.value })}
                    style={{ flex: 1, minHeight: 36, borderRadius: 8, border: '1px solid #444', background: 'transparent', padding: '0 8px' }}
                  />
                  <input
                    type="color"
                    value={c.color}
                    onChange={(e) => updateCategory(c.id, { color: e.target.value })}
                  />
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteCategory(c.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="field-row" style={{ marginTop: 14 }}>
              <div className="field">
                <label>New category</label>
                <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Name" />
              </div>
              <div className="field">
                <label>Color</label>
                <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!newCatName.trim()) return;
                addCategory(newCatName.trim(), newCatColor);
                setNewCatName('');
              }}
            >
              <Plus size={16} /> Add category
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
