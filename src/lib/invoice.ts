import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Sale, ShopSettings } from '../types';
import { money } from './money';
import { fmtDateTime } from './dates';

const A4 = { width: 210, height: 297 };
const MARGIN = 16;
const ACCENT: [number, number, number] = [201, 162, 39];

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function copyLabel(forClient: boolean) {
  return forClient ? 'CLIENT INVOICE' : 'SHOP COPY';
}

export function generateInvoicePdf(sale: Sale, shop: ShopSettings, forClient = true) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = A4.width;
  const innerW = pageW - MARGIN * 2;
  let y = MARGIN;

  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageW, 42, 'F');
  doc.setFillColor(...ACCENT);
  doc.rect(0, 42, pageW, 1.4, 'F');

  if (shop.logoDataUrl) {
    try {
      doc.addImage(shop.logoDataUrl, 'PNG', MARGIN, 10, 22, 22);
    } catch {
      /* ignore invalid logo */
    }
  }

  const textX = shop.logoDataUrl ? MARGIN + 26 : MARGIN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...ACCENT);
  doc.text(shop.name, textX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(230, 224, 210);
  doc.text([shop.ownerName, shop.address, `${shop.phone}  ·  ${shop.email}`], textX, 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(copyLabel(forClient), pageW - MARGIN, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(230, 224, 210);
  doc.text(`Invoice ${sale.invoiceNumber}`, pageW - MARGIN, 23, { align: 'right' });
  doc.text(fmtDateTime(sale.createdAt), pageW - MARGIN, 28, { align: 'right' });

  y = 54;
  doc.setTextColor(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('BILL TO', MARGIN, y);
  doc.text('PAYMENT', pageW / 2, y);
  doc.text('SERVED BY', pageW - MARGIN - 50, y);

  y += 6;
  doc.setTextColor(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(sale.customerName + (sale.isGuest ? ' (Guest)' : ''), MARGIN, y);
  doc.text(sale.paymentMethod.toUpperCase(), pageW / 2, y);
  doc.text(sale.staffName, pageW - MARGIN - 50, y);

  autoTable(doc, {
    startY: 70,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: innerW,
    head: [['Product', 'Qty', 'Unit price', 'Amount']],
    body: sale.items.map((i) => [
      i.productName,
      String(i.quantity),
      money(i.unitPrice, shop.currency),
      money(i.lineTotal, shop.currency),
    ]),
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: { top: 3.2, bottom: 3.2, left: 2, right: 2 },
      textColor: [30, 30, 30],
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 15, 15],
      textColor: [245, 240, 230],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: innerW * 0.46 },
      1: { cellWidth: innerW * 0.12, halign: 'center' },
      2: { cellWidth: innerW * 0.21, halign: 'right' },
      3: { cellWidth: innerW * 0.21, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [250, 248, 244] },
  });

  const tableBottom =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const boxW = 88;
  const boxX = pageW - MARGIN - boxW;
  const summary: [string, string, boolean][] = [
    ['Subtotal (ex TVA)', money(sale.subtotalExTva + sale.discountAmount, shop.currency), false],
  ];
  if (sale.discountAmount > 0) {
    summary.push(['Discount', `-${money(sale.discountAmount, shop.currency)}`, false]);
  }
  summary.push(
    ['Subtotal after discount', money(sale.subtotalExTva, shop.currency), false],
    [`TVA (${sale.tvaPercent}%)`, money(sale.tvaAmount, shop.currency), false],
    ['Total (inc TVA)', money(sale.totalIncTva, shop.currency), true],
  );

  const boxH = 8 + summary.length * 8 + 4;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.setFillColor(252, 250, 246);
  doc.roundedRect(boxX, tableBottom, boxW, boxH, 2, 2, 'FD');

  summary.forEach(([label, value, strong], idx) => {
    const lineY = tableBottom + 8 + idx * 8;
    doc.setFont('helvetica', strong ? 'bold' : 'normal');
    doc.setFontSize(strong ? 11 : 9);
    doc.setTextColor(strong ? 20 : 90);
    doc.text(label, boxX + 4, lineY);
    doc.text(value, boxX + boxW - 4, lineY, { align: 'right' });
  });

  const footerY = A4.height - 18;
  doc.setFillColor(...ACCENT);
  doc.rect(0, footerY - 6, pageW, 1, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110);
  doc.text('Thank you for visiting. This invoice is sized for A4 paper (210 × 297 mm).', MARGIN, footerY);
  doc.text('Generated by RBT Manager', pageW - MARGIN, footerY, { align: 'right' });
  doc.text(`Page 1 of ${doc.getNumberOfPages()}`, pageW / 2, footerY + 6, { align: 'center' });

  return doc;
}

function buildA4InvoiceHtml(sale: Sale, shop: ShopSettings, forClient: boolean, autoPrint = false) {
  const rows = sale.items
    .map(
      (i) => `<tr>
        <td>${esc(i.productName)}</td>
        <td class="num">${i.quantity}</td>
        <td class="num">${esc(money(i.unitPrice, shop.currency))}</td>
        <td class="num">${esc(money(i.lineTotal, shop.currency))}</td>
      </tr>`,
    )
    .join('');

  const discountRow =
    sale.discountAmount > 0
      ? `<div class="sum-line"><span>Discount</span><span>-${esc(money(sale.discountAmount, shop.currency))}</span></div>`
      : '';

  const logo = shop.logoDataUrl
    ? `<img class="logo" src="${shop.logoDataUrl}" alt="" />`
    : `<div class="mark">RBT</div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(sale.invoiceNumber)} — ${esc(shop.name)}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #e8e4dc;
      color: #1a1a1a;
      font-family: Helvetica, Arial, sans-serif;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      gap: 8px;
      justify-content: center;
      padding: 12px;
      background: #111;
    }
    .toolbar button {
      border: 0;
      border-radius: 10px;
      padding: 10px 16px;
      font-weight: 700;
      cursor: pointer;
    }
    .toolbar .print { background: #c9a227; }
    .toolbar .close { background: #333; color: #fff; }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 16px auto;
      background: #fff;
      box-shadow: 0 8px 30px rgba(0,0,0,.18);
      display: flex;
      flex-direction: column;
    }
    header {
      background: #0f0f0f;
      color: #f5f0e6;
      padding: 14mm 16mm 10mm;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 4px solid #c9a227;
    }
    .brand { display: flex; gap: 12px; align-items: flex-start; }
    .logo, .mark {
      width: 22mm; height: 22mm; border-radius: 6px; object-fit: cover;
    }
    .mark {
      display: grid; place-items: center; background: #c9a227; color: #111;
      font-weight: 800; font-size: 14px;
    }
    h1 { margin: 0; font-size: 22px; color: #c9a227; }
    .meta { font-size: 12px; opacity: .85; line-height: 1.45; }
    .copy { text-align: right; }
    .copy strong { display: block; font-size: 16px; margin-bottom: 4px; }
    .body { padding: 10mm 16mm; flex: 1; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 8mm; }
    .lbl { font-size: 10px; letter-spacing: .08em; color: #777; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0f0f0f; color: #f5f0e6; font-size: 11px; text-align: left; padding: 8px; }
    td { padding: 9px 8px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:nth-child(even) td { background: #faf8f4; }
    .num { text-align: right; }
    .totals {
      width: 88mm; margin-left: auto; margin-top: 8mm;
      border: 1.5px solid #c9a227; border-radius: 6px; padding: 8px 12px; background: #fcfaf6;
    }
    .sum-line { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #555; }
    .sum-line.total { font-weight: 800; font-size: 16px; color: #111; border-top: 1px solid #ead9a8; margin-top: 4px; padding-top: 8px; }
    footer {
      margin-top: auto;
      padding: 8mm 16mm 12mm;
      border-top: 3px solid #c9a227;
      font-size: 11px;
      color: #777;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      html, body { background: #fff; }
      .toolbar { display: none !important; }
      .sheet { margin: 0; box-shadow: none; width: 210mm; min-height: 297mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="print" onclick="window.print()">Print A4</button>
    <button class="close" onclick="window.close()">Close</button>
  </div>
  <article class="sheet">
    <header>
      <div class="brand">
        ${logo}
        <div>
          <h1>${esc(shop.name)}</h1>
          <div class="meta">${esc(shop.ownerName)}<br/>${esc(shop.address)}<br/>${esc(shop.phone)} · ${esc(shop.email)}</div>
        </div>
      </div>
      <div class="copy">
        <strong>${copyLabel(forClient)}</strong>
        <div class="meta">Invoice ${esc(sale.invoiceNumber)}<br/>${esc(fmtDateTime(sale.createdAt))}</div>
      </div>
    </header>
    <div class="body">
      <div class="grid3">
        <div><div class="lbl">BILL TO</div><div><strong>${esc(sale.customerName)}${sale.isGuest ? ' (Guest)' : ''}</strong></div></div>
        <div><div class="lbl">PAYMENT</div><div><strong>${esc(sale.paymentMethod.toUpperCase())}</strong></div></div>
        <div><div class="lbl">SERVED BY</div><div><strong>${esc(sale.staffName)}</strong></div></div>
      </div>
      <table>
        <thead>
          <tr><th>Product</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div class="sum-line"><span>Subtotal (ex TVA)</span><span>${esc(money(sale.subtotalExTva + sale.discountAmount, shop.currency))}</span></div>
        ${discountRow}
        <div class="sum-line"><span>Subtotal after discount</span><span>${esc(money(sale.subtotalExTva, shop.currency))}</span></div>
        <div class="sum-line"><span>TVA (${sale.tvaPercent}%)</span><span>${esc(money(sale.tvaAmount, shop.currency))}</span></div>
        <div class="sum-line total"><span>Total (inc TVA)</span><span>${esc(money(sale.totalIncTva, shop.currency))}</span></div>
      </div>
    </div>
    <footer>
      <span>Thank you for visiting. This invoice is sized for A4 paper (210 × 297 mm).</span>
      <span>Generated by RBT Manager</span>
    </footer>
  </article>
  ${autoPrint ? '<script>window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 350); });</script>' : ''}
</body>
</html>`;
}

export function downloadInvoice(sale: Sale, shop: ShopSettings, forClient = true) {
  const doc = generateInvoicePdf(sale, shop, forClient);
  doc.save(`${sale.invoiceNumber}-${forClient ? 'client' : 'shop'}-A4.pdf`);
}

export function openInvoicePreview(sale: Sale, shop: ShopSettings, forClient = true) {
  const html = buildA4InvoiceHtml(sale, shop, forClient, false);
  const win = window.open('', '_blank');
  if (!win) {
    downloadInvoice(sale, shop, forClient);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export function printInvoice(sale: Sale, shop: ShopSettings, forClient = true) {
  const html = buildA4InvoiceHtml(sale, shop, forClient, true);
  const win = window.open('', '_blank');
  if (!win) {
    downloadInvoice(sale, shop, forClient);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function invoiceFile(sale: Sale, shop: ShopSettings, forClient: boolean) {
  const blob = generateInvoicePdf(sale, shop, forClient).output('blob');
  return new File([blob], `${sale.invoiceNumber}-${forClient ? 'client' : 'shop'}-A4.pdf`, {
    type: 'application/pdf',
  });
}

export async function sendInvoice(
  sale: Sale,
  shop: ShopSettings,
  email?: string,
  forClient = true,
) {
  const file = invoiceFile(sale, shop, forClient);
  const title = `Invoice ${sale.invoiceNumber} — ${shop.name}`;
  const text = `Hello ${sale.customerName},\n\nInvoice ${sale.invoiceNumber} for ${money(sale.totalIncTva, shop.currency)}.\nPayment: ${sale.paymentMethod}.\nFormat: A4.\n\n${shop.name}`;

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  const shareData = { files: [file], title, text } as ShareData & { files: File[] };

  if (typeof nav.canShare === 'function' && nav.canShare(shareData) && nav.share) {
    try {
      await nav.share(shareData);
      return;
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
    }
  }

  downloadInvoice(sale, shop, forClient);
  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(
    `${text}\n\nThe A4 PDF invoice was downloaded. Attach that file to this email before sending.`,
  );
  window.location.href = `mailto:${email || ''}?subject=${subject}&body=${body}`;
}

export function mailtoInvoice(sale: Sale, shop: ShopSettings, email?: string) {
  void sendInvoice(sale, shop, email, true);
}
