import { useMemo, useState } from 'react';
import { useAppStore, useCurrentUser } from '../store/useAppStore';
import { money, calcTva, round2 } from '../lib/money';
import { Modal } from '../components/common/Modal';
import { downloadInvoice, printInvoice, sendInvoice } from '../lib/invoice';
import type { PaymentMethod, Sale } from '../types';

export function PosPage() {
  const shop = useAppStore((s) => s.shop);
  const categories = useAppStore((s) => s.categories);
  const products = useAppStore((s) => s.products);
  const customers = useAppStore((s) => s.customers);
  const cart = useAppStore((s) => s.cart);
  const setQtyDraft = useAppStore((s) => s.setQtyDraft);
  const addToCart = useAppStore((s) => s.addToCart);
  const updateCartQty = useAppStore((s) => s.updateCartQty);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const setCartCustomer = useAppStore((s) => s.setCartCustomer);
  const setManualDiscount = useAppStore((s) => s.setManualDiscount);
  const checkout = useAppStore((s) => s.checkout);
  const user = useCurrentUser();

  const [categoryId, setCategoryId] = useState<string>('all');
  const [payOpen, setPayOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);

  const sortedCats = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories],
  );

  const visibleProducts = products.filter(
    (p) => p.active && (categoryId === 'all' || p.categoryId === categoryId),
  );

  const customer = customers.find((c) => c.id === cart.customerId) || null;

  const gross = round2(cart.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
  const discountType = cart.manualDiscountType ?? customer?.discountType ?? null;
  const discountValue =
    cart.manualDiscountType != null ? cart.manualDiscountValue : customer?.discountValue ?? 0;
  let discountAmount = 0;
  if (discountType === 'percent') discountAmount = round2(gross * (discountValue / 100));
  if (discountType === 'fixed') discountAmount = round2(Math.min(gross, discountValue));
  const afterDiscount = round2(Math.max(0, gross - discountAmount));
  const tax = calcTva(afterDiscount, shop.tvaPercent);

  const confirmPay = (method: PaymentMethod) => {
    const sale = checkout(method);
    if (!sale) return;
    setPayOpen(false);
    setLastSale(sale);
  };

  return (
    <div className="pos-layout">
      <section className="pos-main panel">
        <div className="spread" style={{ marginBottom: 8 }}>
          <div className="row">
            {shop.logoDataUrl ? (
              <img
                src={shop.logoDataUrl}
                alt=""
                style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }}
              />
            ) : null}
            <div>
              <div className="tiny muted">Point of sale</div>
              <h2>{shop.name}</h2>
            </div>
          </div>
          <div className="tiny muted">Tap photo · set qty · Select</div>
        </div>

        <div className="category-tabs">
          <button className={categoryId === 'all' ? 'active' : ''} onClick={() => setCategoryId('all')}>
            All
          </button>
          {sortedCats.map((c) => (
            <button
              key={c.id}
              className={categoryId === c.id ? 'active' : ''}
              onClick={() => setCategoryId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {visibleProducts.map((p, idx) => {
            const qty = cart.qtyDraft[p.id] ?? 1;
            const out = p.stock <= 0;
            return (
              <article
                key={p.id}
                className="product-card"
                style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}
              >
                <div className="photo">
                  {p.imageDataUrl ? (
                    <img src={p.imageDataUrl} alt={p.name} />
                  ) : (
                    <span className="muted">No photo</span>
                  )}
                </div>
                <div className="name">{p.name}</div>
                <div className="spread">
                  <span className="price">{money(p.price, shop.currency)}</span>
                  <span className="tiny muted">{out ? 'Out' : `${p.stock} left`}</span>
                </div>
                <div className="qty-row">
                  <button
                    type="button"
                    disabled={out}
                    onClick={() => setQtyDraft(p.id, Math.max(1, qty - 1))}
                  >
                    −
                  </button>
                  <div className="qty">{qty}</div>
                  <button
                    type="button"
                    disabled={out}
                    onClick={() => setQtyDraft(p.id, Math.min(p.stock, qty + 1))}
                  >
                    +
                  </button>
                </div>
                <button
                  className="btn primary select-btn"
                  disabled={out}
                  onClick={() => addToCart(p.id)}
                >
                  Select
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="pos-cart panel">
        <div className="spread">
          <h3>Cart</h3>
          <button className="btn ghost" onClick={clearCart} disabled={!cart.items.length}>
            Clear
          </button>
        </div>

        <div className="field" style={{ marginTop: 8 }}>
          <label>Customer (optional)</label>
          <select
            value={cart.customerId ?? ''}
            onChange={(e) => setCartCustomer(e.target.value || null)}
          >
            <option value="">Guest walk-in</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isProfessional ? ' · Pro' : ''}
                {c.discountValue
                  ? ` (−${c.discountValue}${c.discountType === 'percent' ? '%' : ''})`
                  : ''}
              </option>
            ))}
          </select>
        </div>

        {customer?.discountValue ? (
          <div className="tiny" style={{ color: 'var(--accent)', marginTop: 6 }}>
            Auto discount applied from account
            {user?.canOverrideDiscount ? (
              <>
                {' '}
                ·{' '}
                <button className="btn ghost" style={{ padding: '2px 8px' }} onClick={() => setOverrideOpen(true)}>
                  Override
                </button>
              </>
            ) : null}
          </div>
        ) : user?.canOverrideDiscount ? (
          <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => setOverrideOpen(true)}>
            Apply discount
          </button>
        ) : null}

        <div className="cart-lines" style={{ marginTop: 10 }}>
          {cart.items.length === 0 ? (
            <div className="muted">No items yet — select products on the left.</div>
          ) : (
            cart.items.map((item) => {
              const p = products.find((x) => x.id === item.productId);
              return (
                <div key={item.productId} className="cart-line">
                  <div>
                    <div style={{ fontWeight: 700 }}>{p?.name}</div>
                    <div className="tiny muted">{money(item.unitPrice, shop.currency)} each</div>
                    <div className="qty-row" style={{ marginTop: 6, maxWidth: 140 }}>
                      <button onClick={() => updateCartQty(item.productId, item.quantity - 1)}>−</button>
                      <div className="qty">{item.quantity}</div>
                      <button onClick={() => updateCartQty(item.productId, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>
                      {money(item.quantity * item.unitPrice, shop.currency)}
                    </div>
                    <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => removeFromCart(item.productId)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="totals">
          <div className="line">
            <span>Subtotal (ex TVA)</span>
            <span>{money(gross, shop.currency)}</span>
          </div>
          {discountAmount > 0 ? (
            <div className="line">
              <span>Discount</span>
              <span>−{money(discountAmount, shop.currency)}</span>
            </div>
          ) : null}
          <div className="line">
            <span>TVA ({shop.tvaPercent}%)</span>
            <span>{money(tax.tvaAmount, shop.currency)}</span>
          </div>
          <div className="line total">
            <span>Total</span>
            <span>{money(tax.totalIncTva, shop.currency)}</span>
          </div>
          <button
            className="btn primary"
            style={{ marginTop: 8 }}
            disabled={!cart.items.length}
            onClick={() => setPayOpen(true)}
          >
            Confirm payment
          </button>
        </div>
      </aside>

      <Modal open={payOpen} title="Confirm payment" onClose={() => setPayOpen(false)}>
        <p className="muted">
          Process the payment yourself on your terminal or cash drawer, then confirm the method here.
        </p>
        <div className="spread" style={{ margin: '14px 0' }}>
          <strong>Total due</strong>
          <strong style={{ color: 'var(--accent)', fontSize: '1.3rem' }}>
            {money(tax.totalIncTva, shop.currency)}
          </strong>
        </div>
        <div className="grid-2">
          <button className="btn primary" onClick={() => confirmPay('cash')}>
            Paid by cash
          </button>
          <button className="btn primary" onClick={() => confirmPay('card')}>
            Paid by card
          </button>
        </div>
      </Modal>

      <Modal open={overrideOpen} title="Discount" onClose={() => setOverrideOpen(false)}>
        <div className="grid-2">
          <div className="field">
            <label>Type</label>
            <select
              value={cart.manualDiscountType ?? 'percent'}
              onChange={(e) =>
                setManualDiscount(e.target.value as 'percent' | 'fixed', cart.manualDiscountValue)
              }
            >
              <option value="percent">Percent</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div className="field">
            <label>Value</label>
            <input
              type="number"
              min={0}
              value={cart.manualDiscountValue}
              onChange={(e) =>
                setManualDiscount(cart.manualDiscountType ?? 'percent', Number(e.target.value) || 0)
              }
            />
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button
            className="btn ghost"
            onClick={() => {
              setManualDiscount(null, 0);
              setOverrideOpen(false);
            }}
          >
            Clear override
          </button>
          <button className="btn primary" onClick={() => setOverrideOpen(false)}>
            Apply
          </button>
        </div>
      </Modal>

      <Modal open={!!lastSale} title="Sale complete" onClose={() => setLastSale(null)}>
        {lastSale ? (
          <div className="stack">
            <p>
              Invoice <strong>{lastSale.invoiceNumber}</strong> ·{' '}
              {money(lastSale.totalIncTva, shop.currency)} · {lastSale.paymentMethod}
            </p>
            <p className="tiny muted">A4 invoice (210 × 297 mm) — print, download, or send.</p>
            <div className="grid-2">
              <button className="btn primary" onClick={() => printInvoice(lastSale, shop, true)}>
                Print client A4
              </button>
              <button className="btn primary" onClick={() => printInvoice(lastSale, shop, false)}>
                Print shop A4
              </button>
              <button className="btn" onClick={() => downloadInvoice(lastSale, shop, true)}>
                Download client PDF
              </button>
              <button className="btn" onClick={() => downloadInvoice(lastSale, shop, false)}>
                Download shop PDF
              </button>
            </div>
            <button
              className="btn"
              onClick={() => {
                const email = customers.find((c) => c.id === lastSale.customerId)?.email;
                void sendInvoice(lastSale, shop, email, true);
              }}
            >
              Send / share invoice
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
