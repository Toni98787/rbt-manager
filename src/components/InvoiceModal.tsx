import { useStore } from '../store/StoreContext';
import { formatMoney } from '../utils/helpers';
import type { Sale } from '../types';

export function InvoiceModal({
  sale,
  onClose,
}: {
  sale: Sale;
  onClose: () => void;
}) {
  const { state, convertGuestToCustomer } = useStore();
  const shop = state.shop;
  const symbol = shop.currencySymbol;

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Invoice {sale.invoiceNumber}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={printInvoice}>
              Print / PDF
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="invoice-preview" id="invoice-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <div>
              {shop.logoDataUrl ? (
                <img
                  src={shop.logoDataUrl}
                  alt=""
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                />
              ) : null}
              <h2>{shop.shopName}</h2>
              <div className="muted">{shop.ownerName}</div>
              <div className="muted">{shop.address}</div>
              <div className="muted">{shop.phone}</div>
              <div className="muted">{shop.email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>{sale.invoiceNumber}</strong>
              <div className="muted">{new Date(sale.createdAt).toLocaleString()}</div>
              <div>Staff: {sale.staffName}</div>
              <div>
                Client: {sale.customerName ?? 'Guest'}
                {sale.isGuest ? ' (walk-in)' : ''}
              </div>
              <div>Payment: {sale.paymentMethod === 'cash' ? 'Cash' : 'Card'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Disc.</th>
                <th>Total excl. TVA</th>
              </tr>
            </thead>
            <tbody>
              {sale.lines.map((l) => (
                <tr key={`${l.productId}-${l.productName}`}>
                  <td>{l.productName}</td>
                  <td>{l.quantity}</td>
                  <td>{formatMoney(l.unitPrice, symbol)}</td>
                  <td>{l.discountPercent ? `${l.discountPercent}%` : '—'}</td>
                  <td>{formatMoney(l.lineTotalExTva, symbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal excl. TVA</span>
              <span>{formatMoney(sale.subtotalExTva, symbol)}</span>
            </div>
            {sale.discountAmount > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount</span>
                <span>−{formatMoney(sale.discountAmount, symbol)}</span>
              </div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TVA ({sale.tvaPercent}%)</span>
              <span>{formatMoney(sale.tvaAmount, symbol)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 6 }}>
              <span>Total incl. TVA</span>
              <span>{formatMoney(sale.totalIncTva, symbol)}</span>
            </div>
          </div>

          <p className="muted" style={{ marginTop: 24, fontSize: '0.8rem' }}>
            Thank you for shopping at {shop.shopName}.
          </p>
        </div>

        {sale.isGuest ? (
          <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const name = window.prompt('Customer name to create account:');
                if (name?.trim()) convertGuestToCustomer(name.trim());
              }}
            >
              Convert guest to customer account
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
