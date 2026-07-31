import type {
  CalendarEvent,
  Category,
  Customer,
  DashboardLayout,
  Product,
  ReservedOrder,
  Sale,
  ShopSettings,
  StaffUser,
  Supplier,
  SupplierOrder,
  ThemePreset,
} from '../types';

export const defaultShop: ShopSettings = {
  name: 'RBT Barbershop',
  ownerName: 'Toni Lyau',
  address: '123 Main Street',
  phone: '+000 000 000',
  email: 'hello@rbt.shop',
  logoDataUrl: null,
  tvaPercent: 16,
  currency: 'USD',
};

export const themePresets: ThemePreset[] = [
  {
    id: 'roots-black-gold',
    name: 'Roots Black & Gold',
    mode: 'dark',
    primary: '#0a0a0a',
    accent: '#c9a227',
    background: '#0f0f0f',
    surface: '#1a1a1a',
    text: '#f5f0e6',
    muted: '#9a917f',
    cardSize: 'medium',
    fontSize: 'medium',
    buttonShape: 'rounded',
  },
  {
    id: 'light-mode',
    name: 'Light Mode',
    mode: 'light',
    primary: '#1c1917',
    accent: '#b45309',
    background: '#faf7f2',
    surface: '#ffffff',
    text: '#1c1917',
    muted: '#78716c',
    cardSize: 'medium',
    fontSize: 'medium',
    buttonShape: 'rounded',
  },
  {
    id: 'night-mode',
    name: 'Night Mode',
    mode: 'dark',
    primary: '#020617',
    accent: '#38bdf8',
    background: '#020617',
    surface: '#0f172a',
    text: '#e2e8f0',
    muted: '#94a3b8',
    cardSize: 'medium',
    fontSize: 'medium',
    buttonShape: 'rounded',
  },
];

export const defaultLayout: DashboardLayout = {
  widgets: [
    { id: 'quick_actions', x: 0, y: 0, w: 12, h: 1, visible: true },
    { id: 'sales', x: 0, y: 1, w: 6, h: 2, visible: true },
    { id: 'inventory', x: 6, y: 1, w: 6, h: 2, visible: true },
    { id: 'top_products', x: 0, y: 3, w: 4, h: 2, visible: true },
    { id: 'staff', x: 4, y: 3, w: 4, h: 2, visible: true },
    { id: 'reserved', x: 8, y: 3, w: 4, h: 2, visible: true },
    { id: 'calendar', x: 0, y: 5, w: 6, h: 2, visible: true },
    { id: 'suppliers', x: 6, y: 5, w: 6, h: 2, visible: true },
  ],
};

export const seedStaff: StaffUser[] = [
  {
    id: 'staff-owner',
    name: 'Owner',
    pin: '1234',
    role: 'owner',
    canOverrideDiscount: true,
    active: true,
    layoutPrefs: defaultLayout,
    themeId: 'roots-black-gold',
  },
  {
    id: 'staff-alex',
    name: 'Alex',
    pin: '2222',
    role: 'staff',
    canOverrideDiscount: false,
    active: true,
    layoutPrefs: defaultLayout,
    themeId: 'roots-black-gold',
  },
  {
    id: 'staff-jordan',
    name: 'Jordan',
    pin: '3333',
    role: 'staff',
    canOverrideDiscount: true,
    active: true,
    layoutPrefs: defaultLayout,
    themeId: 'light-mode',
  },
];

export const seedCategories: Category[] = [
  { id: 'cat-hair', name: 'Hair Care', order: 0 },
  { id: 'cat-beard', name: 'Beard', order: 1 },
  { id: 'cat-tools', name: 'Tools', order: 2 },
  { id: 'cat-styling', name: 'Styling', order: 3 },
  { id: 'cat-accessories', name: 'Accessories', order: 4 },
];

const placeholder = (label: string, tone: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${tone}"/>
        <stop offset="100%" stop-color="#111"/>
      </linearGradient>
    </defs>
    <rect width="240" height="240" fill="url(#g)"/>
    <text x="120" y="125" text-anchor="middle" fill="#f5f0e6" font-family="Georgia, serif" font-size="22">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const seedProducts: Product[] = [
  {
    id: 'p1',
    name: 'Pomade Classic',
    categoryId: 'cat-styling',
    brand: 'RBT',
    price: 18,
    stock: 24,
    reserved: 2,
    incoming: 12,
    imageDataUrl: placeholder('Pomade', '#3f2e14'),
    active: true,
  },
  {
    id: 'p2',
    name: 'Beard Oil',
    categoryId: 'cat-beard',
    brand: 'RBT',
    price: 22,
    stock: 18,
    reserved: 1,
    incoming: 0,
    imageDataUrl: placeholder('Beard Oil', '#2a2118'),
    active: true,
  },
  {
    id: 'p3',
    name: 'Shampoo Pro',
    categoryId: 'cat-hair',
    brand: 'Roots',
    price: 16,
    stock: 30,
    reserved: 0,
    incoming: 20,
    imageDataUrl: placeholder('Shampoo', '#1f2937'),
    active: true,
  },
  {
    id: 'p4',
    name: 'Clipper Guard Set',
    categoryId: 'cat-tools',
    brand: 'Wahl',
    price: 35,
    stock: 8,
    reserved: 1,
    incoming: 6,
    imageDataUrl: placeholder('Guards', '#292524'),
    active: true,
  },
  {
    id: 'p5',
    name: 'Matte Clay',
    categoryId: 'cat-styling',
    brand: 'RBT',
    price: 20,
    stock: 15,
    reserved: 0,
    incoming: 0,
    imageDataUrl: placeholder('Clay', '#44403c'),
    active: true,
  },
  {
    id: 'p6',
    name: 'Aftershave Balm',
    categoryId: 'cat-hair',
    brand: 'Roots',
    price: 19,
    stock: 0,
    reserved: 0,
    incoming: 10,
    imageDataUrl: placeholder('Balm', '#365314'),
    active: true,
  },
  {
    id: 'p7',
    name: 'Beard Comb',
    categoryId: 'cat-accessories',
    brand: 'RBT',
    price: 12,
    stock: 40,
    reserved: 0,
    incoming: 0,
    imageDataUrl: placeholder('Comb', '#713f12'),
    active: true,
  },
  {
    id: 'p8',
    name: 'Hair Toner',
    categoryId: 'cat-hair',
    brand: 'Roots',
    price: 28,
    stock: 11,
    reserved: 3,
    incoming: 0,
    imageDataUrl: placeholder('Toner', '#1e3a5f'),
    active: true,
  },
];

export const seedCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Marcus Hill',
    phone: '555-0101',
    email: 'marcus@example.com',
    isProfessional: true,
    discountType: 'percent',
    discountValue: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'Sam Rivera',
    phone: '555-0102',
    isProfessional: false,
    discountType: 'fixed',
    discountValue: 0,
    createdAt: new Date().toISOString(),
  },
];

export const seedSuppliers: Supplier[] = [
  {
    id: 'sup1',
    name: 'Pro Barber Supply',
    contact: 'Lee',
    email: 'orders@probaber.example',
    phone: '555-2000',
  },
  {
    id: 'sup2',
    name: 'Roots Wholesale',
    contact: 'Pat',
    email: 'sales@roots.example',
    phone: '555-2001',
  },
];

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

export const seedSupplierOrders: SupplierOrder[] = [
  {
    id: 'so1',
    supplierId: 'sup1',
    supplierName: 'Pro Barber Supply',
    items: [
      { productId: 'p3', productName: 'Shampoo Pro', quantity: 20 },
      { productId: 'p6', productName: 'Aftershave Balm', quantity: 10 },
    ],
    status: 'on_the_way',
    orderedAt: daysFromNow(-5),
    expectedAt: daysFromNow(1),
    notes: 'Express delivery',
    updatedAt: daysFromNow(-1),
  },
  {
    id: 'so2',
    supplierId: 'sup2',
    supplierName: 'Roots Wholesale',
    items: [{ productId: 'p1', productName: 'Pomade Classic', quantity: 12 }],
    status: 'ordered',
    orderedAt: daysFromNow(-2),
    expectedAt: daysFromNow(4),
    updatedAt: daysFromNow(-2),
  },
  {
    id: 'so3',
    supplierId: 'sup1',
    supplierName: 'Pro Barber Supply',
    items: [{ productId: 'p4', productName: 'Clipper Guard Set', quantity: 6 }],
    status: 'arrived',
    orderedAt: daysFromNow(-8),
    expectedAt: daysFromNow(0),
    updatedAt: daysFromNow(0),
  },
];

export const seedEvents: CalendarEvent[] = [
  {
    id: 'ev1',
    title: 'Alex morning shift',
    type: 'staff_schedule',
    color: '#c9a227',
    start: daysFromNow(0),
    staffId: 'staff-alex',
    priority: 'medium',
    status: 'planned',
  },
  {
    id: 'ev2',
    title: 'Pickup — Marcus Hill',
    type: 'customer_pickup',
    color: '#22c55e',
    start: daysFromNow(1),
    customerId: 'c1',
    notes: 'Toner x3',
    priority: 'high',
    status: 'planned',
  },
  {
    id: 'ev3',
    title: 'Delivery — Pro Barber Supply',
    type: 'supplier_delivery',
    color: '#38bdf8',
    start: daysFromNow(1),
    supplierOrderId: 'so1',
    priority: 'high',
    status: 'planned',
  },
  {
    id: 'ev4',
    title: 'Inventory count',
    type: 'business_task',
    color: '#f97316',
    start: daysFromNow(3),
    priority: 'medium',
    status: 'planned',
  },
];

export const seedReserved: ReservedOrder[] = [
  {
    id: 'r1',
    customerId: 'c1',
    customerName: 'Marcus Hill',
    productId: 'p8',
    productName: 'Hair Toner',
    quantity: 3,
    pickupDate: daysFromNow(1),
    status: 'ready',
  },
  {
    id: 'r2',
    customerId: 'c2',
    customerName: 'Sam Rivera',
    productId: 'p1',
    productName: 'Pomade Classic',
    quantity: 2,
    pickupDate: daysFromNow(2),
    status: 'reserved',
  },
];

export const seedSales: Sale[] = (() => {
  const now = new Date();
  const mk = (
    daysAgo: number,
    staffId: string,
    staffName: string,
    items: { id: string; name: string; qty: number; price: number }[],
    payment: 'cash' | 'card',
    customer?: { id: string; name: string },
  ): Sale => {
    const created = new Date(now);
    created.setDate(created.getDate() - daysAgo);
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const discount = customer?.id === 'c1' ? subtotal * 0.1 : 0;
    const afterDiscount = subtotal - discount;
    const tva = afterDiscount * 0.16;
    return {
      id: `sale-${daysAgo}-${staffId}-${items[0].id}`,
      invoiceNumber: `INV-${1000 + daysAgo}`,
      createdAt: created.toISOString(),
      staffId,
      staffName,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? 'Guest',
      isGuest: !customer,
      items: items.map((i) => ({
        productId: i.id,
        productName: i.name,
        quantity: i.qty,
        unitPrice: i.price,
        lineTotal: i.qty * i.price,
      })),
      subtotalExTva: afterDiscount,
      tvaAmount: tva,
      discountAmount: discount,
      totalIncTva: afterDiscount + tva,
      paymentMethod: payment,
      tvaPercent: 16,
    };
  };

  return [
    mk(0, 'staff-alex', 'Alex', [{ id: 'p1', name: 'Pomade Classic', qty: 2, price: 18 }], 'card', {
      id: 'c1',
      name: 'Marcus Hill',
    }),
    mk(0, 'staff-jordan', 'Jordan', [{ id: 'p2', name: 'Beard Oil', qty: 1, price: 22 }], 'cash'),
    mk(1, 'staff-alex', 'Alex', [{ id: 'p5', name: 'Matte Clay', qty: 3, price: 20 }], 'card'),
    mk(3, 'staff-jordan', 'Jordan', [{ id: 'p3', name: 'Shampoo Pro', qty: 2, price: 16 }], 'cash', {
      id: 'c2',
      name: 'Sam Rivera',
    }),
    mk(10, 'staff-alex', 'Alex', [{ id: 'p7', name: 'Beard Comb', qty: 4, price: 12 }], 'card'),
    mk(40, 'staff-jordan', 'Jordan', [{ id: 'p4', name: 'Clipper Guard Set', qty: 1, price: 35 }], 'cash'),
  ];
})();
