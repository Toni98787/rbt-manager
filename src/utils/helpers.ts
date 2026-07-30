import type { CartItem, Product, Customer, SaleLine } from '../types';

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatMoney(amount: number, symbol = '$'): string {
  return `${symbol}${amount.toFixed(2)}`;
}

export function calcLineExTva(item: CartItem): number {
  const base = item.unitPrice * item.quantity;
  return base * (1 - (item.discountPercent || 0) / 100);
}

export function calcCartTotals(
  items: CartItem[],
  tvaPercent: number,
  extraDiscountAmount = 0,
) {
  const subtotalExTva = items.reduce((sum, i) => sum + calcLineExTva(i), 0);
  const afterDiscount = Math.max(0, subtotalExTva - extraDiscountAmount);
  const tvaAmount = afterDiscount * (tvaPercent / 100);
  const totalIncTva = afterDiscount + tvaAmount;
  return { subtotalExTva, afterDiscount, tvaAmount, totalIncTva, discountAmount: extraDiscountAmount };
}

export function customerDiscountAmount(
  customer: Customer | null,
  subtotalExTva: number,
): number {
  if (!customer || !customer.defaultDiscountType || !customer.defaultDiscountValue) return 0;
  if (customer.defaultDiscountType === 'percentage') {
    return subtotalExTva * (customer.defaultDiscountValue / 100);
  }
  return Math.min(customer.defaultDiscountValue, subtotalExTva);
}

export function toSaleLines(items: CartItem[], products: Product[]): SaleLine[] {
  return items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const lineTotalExTva = calcLineExTva(item);
    return {
      productId: item.productId,
      productName: product?.name ?? 'Unknown',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent,
      lineTotalExTva,
    };
  });
}

export function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfWeek(d = new Date()): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function startOfYear(d = new Date()): Date {
  return new Date(d.getFullYear(), 0, 1);
}

export function isAfter(iso: string, boundary: Date): boolean {
  return new Date(iso).getTime() >= boundary.getTime();
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  staff_schedule: 'Staff schedule',
  customer_pickup: 'Customer pickup',
  supplier_delivery: 'Supplier delivery',
  business_task: 'Business task',
  personal_note: 'Personal note',
};

export const ORDER_STATUS_META: Record<
  string,
  { label: string; color: string }
> = {
  ordered: { label: 'Ordered', color: '#64748b' },
  on_the_way: { label: 'On the way', color: '#2563eb' },
  arrived: { label: 'Arrived', color: '#d97706' },
  in_store: { label: 'In store', color: '#16a34a' },
};

export const STOCK_STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  reserved: 'Reserved',
  out_of_stock: 'Out of stock',
  incoming: 'Incoming',
};
