import type { Product, Sale, StaffUser } from '../types';
import { inPeriod, type Period } from './dates';
import { round2 } from './money';

export function salesInPeriod(sales: Sale[], period: Period) {
  return sales.filter((s) => inPeriod(s.createdAt, period));
}

export function periodTotals(sales: Sale[], period: Period) {
  const rows = salesInPeriod(sales, period);
  const ex = round2(rows.reduce((s, r) => s + r.subtotalExTva, 0));
  const tva = round2(rows.reduce((s, r) => s + r.tvaAmount, 0));
  const total = round2(rows.reduce((s, r) => s + r.totalIncTva, 0));
  return { count: rows.length, exTva: ex, tva, total };
}

export function staffPerformance(sales: Sale[], staff: StaffUser[], period: Period) {
  const rows = salesInPeriod(sales, period);
  return staff.map((member) => {
    const theirs = rows.filter((s) => s.staffId === member.id);
    return {
      staffId: member.id,
      name: member.name,
      salesCount: theirs.length,
      totalValue: round2(theirs.reduce((s, r) => s + r.totalIncTva, 0)),
      itemsSold: theirs.reduce((s, r) => s + r.items.reduce((a, i) => a + i.quantity, 0), 0),
    };
  });
}

export function topProducts(sales: Sale[], products: Product[], period: Period, limit = 5) {
  const rows = salesInPeriod(sales, period);
  const map = new Map<string, { productId: string; name: string; qty: number; revenue: number }>();
  rows.forEach((sale) => {
    sale.items.forEach((item) => {
      const prev = map.get(item.productId) || {
        productId: item.productId,
        name: item.productName,
        qty: 0,
        revenue: 0,
      };
      prev.qty += item.quantity;
      prev.revenue += item.lineTotal;
      map.set(item.productId, prev);
    });
  });
  return [...map.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit)
    .map((row) => ({
      ...row,
      stock: products.find((p) => p.id === row.productId)?.stock ?? 0,
    }));
}
