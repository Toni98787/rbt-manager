import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppNotification,
  CalendarEvent,
  CartItem,
  Category,
  Customer,
  DiscountType,
  PaymentMethod,
  Product,
  ReservedOrder,
  Sale,
  ShopSettings,
  StaffUser,
  Supplier,
  SupplierOrder,
  SupplierOrderStatus,
  ThemePreset,
  WidgetId,
} from '../types';
import {
  defaultLayout,
  defaultShop,
  seedCategories,
  seedCustomers,
  seedEvents,
  seedProducts,
  seedReserved,
  seedSales,
  seedStaff,
  seedSupplierOrders,
  seedSuppliers,
  themePresets,
} from '../data/seed';
import { calcTva, round2 } from '../lib/money';
import { uid } from '../lib/dates';

interface CartState {
  items: CartItem[];
  qtyDraft: Record<string, number>;
  customerId: string | null;
  manualDiscountType: DiscountType | null;
  manualDiscountValue: number;
  note: string;
}

interface AppState {
  shop: ShopSettings;
  themes: ThemePreset[];
  activeThemeId: string;
  staff: StaffUser[];
  currentUserId: string | null;
  categories: Category[];
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  suppliers: Supplier[];
  supplierOrders: SupplierOrder[];
  events: CalendarEvent[];
  reservedOrders: ReservedOrder[];
  notifications: AppNotification[];
  cart: CartState;
  editModeDashboard: boolean;

  login: (pin: string) => boolean;
  logout: () => void;
  setThemeId: (id: string) => void;
  upsertTheme: (theme: ThemePreset) => void;
  updateShop: (patch: Partial<ShopSettings>) => void;
  setLogo: (dataUrl: string | null) => void;

  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  reorderCategory: (id: string, direction: -1 | 1) => void;

  upsertProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  setProductImage: (id: string, dataUrl: string | null) => void;
  receiveStock: (productId: string, qty: number) => void;

  upsertCustomer: (customer: Customer) => void;
  convertGuestToCustomer: (name: string, extras?: Partial<Customer>) => string;

  setQtyDraft: (productId: string, qty: number) => void;
  addToCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setCartCustomer: (customerId: string | null) => void;
  setManualDiscount: (type: DiscountType | null, value: number) => void;
  checkout: (method: PaymentMethod) => Sale | null;

  updateSupplierOrderStatus: (id: string, status: SupplierOrderStatus) => void;
  receiveSupplierOrder: (id: string) => void;
  upsertSupplierOrder: (order: SupplierOrder) => void;

  upsertEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;

  toggleWidget: (id: WidgetId) => void;
  resizeWidget: (id: WidgetId, w: number, h: number) => void;
  moveWidget: (id: WidgetId, direction: 'up' | 'down') => void;
  setEditModeDashboard: (v: boolean) => void;
  saveUserThemeAndLayout: () => void;

  markNotificationRead: (id: string) => void;
  pushNotification: (title: string, body: string, relatedEventId?: string) => void;
}

const emptyCart = (): CartState => ({
  items: [],
  qtyDraft: {},
  customerId: null,
  manualDiscountType: null,
  manualDiscountValue: 0,
  note: '',
});

function applyTheme(theme: ThemePreset) {
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.background);
  root.style.setProperty('--surface', theme.surface);
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--muted', theme.muted);
  root.dataset.cardSize = theme.cardSize;
  root.dataset.fontSize = theme.fontSize;
  root.dataset.buttonShape = theme.buttonShape;
  root.dataset.mode = theme.mode;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      shop: defaultShop,
      themes: themePresets,
      activeThemeId: 'roots-black-gold',
      staff: seedStaff,
      currentUserId: null,
      categories: seedCategories,
      products: seedProducts,
      customers: seedCustomers,
      sales: seedSales,
      suppliers: seedSuppliers,
      supplierOrders: seedSupplierOrders,
      events: seedEvents,
      reservedOrders: seedReserved,
      notifications: [
        {
          id: 'n1',
          title: 'Delivery tomorrow',
          body: 'Pro Barber Supply order is expected tomorrow.',
          createdAt: new Date().toISOString(),
          read: false,
          relatedEventId: 'ev3',
        },
      ],
      cart: emptyCart(),
      editModeDashboard: false,

      login: (pin) => {
        const user = get().staff.find((s) => s.active && s.pin === pin);
        if (!user) return false;
        set({ currentUserId: user.id, activeThemeId: user.themeId });
        const theme = get().themes.find((t) => t.id === user.themeId) || get().themes[0];
        applyTheme(theme);
        return true;
      },

      logout: () => set({ currentUserId: null, cart: emptyCart() }),

      setThemeId: (id) => {
        const theme = get().themes.find((t) => t.id === id);
        if (!theme) return;
        set({ activeThemeId: id });
        applyTheme(theme);
        const uidUser = get().currentUserId;
        if (uidUser) {
          set({
            staff: get().staff.map((s) => (s.id === uidUser ? { ...s, themeId: id } : s)),
          });
        }
      },

      upsertTheme: (theme) => {
        const themes = [...get().themes];
        const idx = themes.findIndex((t) => t.id === theme.id);
        if (idx >= 0) themes[idx] = theme;
        else themes.push(theme);
        set({ themes, activeThemeId: theme.id });
        applyTheme(theme);
      },

      updateShop: (patch) => set({ shop: { ...get().shop, ...patch } }),
      setLogo: (dataUrl) => set({ shop: { ...get().shop, logoDataUrl: dataUrl } }),

      addCategory: (name) => {
        const order = get().categories.length;
        set({
          categories: [...get().categories, { id: uid('cat'), name, order }],
        });
      },
      updateCategory: (id, name) =>
        set({
          categories: get().categories.map((c) => (c.id === id ? { ...c, name } : c)),
        }),
      deleteCategory: (id) =>
        set({
          categories: get().categories.filter((c) => c.id !== id),
        }),
      reorderCategory: (id, direction) => {
        const cats = [...get().categories].sort((a, b) => a.order - b.order);
        const idx = cats.findIndex((c) => c.id === id);
        const swap = idx + direction;
        if (idx < 0 || swap < 0 || swap >= cats.length) return;
        const tmp = cats[idx].order;
        cats[idx] = { ...cats[idx], order: cats[swap].order };
        cats[swap] = { ...cats[swap], order: tmp };
        set({ categories: cats });
      },

      upsertProduct: (product) => {
        const products = [...get().products];
        const next = { ...product, price: Math.round(product.price) };
        const idx = products.findIndex((p) => p.id === next.id);
        if (idx >= 0) products[idx] = next;
        else products.push(next);
        set({ products });
      },
      deleteProduct: (id) => set({ products: get().products.filter((p) => p.id !== id) }),
      setProductImage: (id, dataUrl) =>
        set({
          products: get().products.map((p) => (p.id === id ? { ...p, imageDataUrl: dataUrl } : p)),
        }),
      receiveStock: (productId, qty) =>
        set({
          products: get().products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  stock: p.stock + qty,
                  incoming: Math.max(0, p.incoming - qty),
                }
              : p,
          ),
        }),

      upsertCustomer: (customer) => {
        const customers = [...get().customers];
        const idx = customers.findIndex((c) => c.id === customer.id);
        if (idx >= 0) customers[idx] = customer;
        else customers.push(customer);
        set({ customers });
      },
      convertGuestToCustomer: (name, extras = {}) => {
        const id = uid('cust');
        const customer: Customer = {
          id,
          name,
          isProfessional: false,
          discountType: 'percent',
          discountValue: 0,
          createdAt: new Date().toISOString(),
          ...extras,
        };
        set({ customers: [...get().customers, customer] });
        return id;
      },

      setQtyDraft: (productId, qty) =>
        set({
          cart: {
            ...get().cart,
            qtyDraft: { ...get().cart.qtyDraft, [productId]: Math.max(0, qty) },
          },
        }),
      addToCart: (productId) => {
        const product = get().products.find((p) => p.id === productId);
        if (!product || product.stock <= 0) return;
        const qty = Math.max(1, get().cart.qtyDraft[productId] || 1);
        if (qty > product.stock) return;
        const items = [...get().cart.items];
        const existing = items.find((i) => i.productId === productId);
        if (existing) {
          existing.quantity = Math.min(product.stock, existing.quantity + qty);
        } else {
          items.push({ productId, quantity: qty, unitPrice: product.price });
        }
        set({
          cart: {
            ...get().cart,
            items,
            qtyDraft: { ...get().cart.qtyDraft, [productId]: 1 },
          },
        });
      },
      updateCartQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set({
          cart: {
            ...get().cart,
            items: get().cart.items.map((i) =>
              i.productId === productId ? { ...i, quantity: qty } : i,
            ),
          },
        });
      },
      removeFromCart: (productId) =>
        set({
          cart: {
            ...get().cart,
            items: get().cart.items.filter((i) => i.productId !== productId),
          },
        }),
      clearCart: () => set({ cart: emptyCart() }),
      setCartCustomer: (customerId) => set({ cart: { ...get().cart, customerId } }),
      setManualDiscount: (type, value) =>
        set({
          cart: { ...get().cart, manualDiscountType: type, manualDiscountValue: value },
        }),

      checkout: (method) => {
        const state = get();
        const user = state.staff.find((s) => s.id === state.currentUserId);
        if (!user || state.cart.items.length === 0) return null;

        const lines = state.cart.items.map((item) => {
          const product = state.products.find((p) => p.id === item.productId)!;
          return {
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: round2(item.quantity * item.unitPrice),
          };
        });

        const gross = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
        const customer = state.customers.find((c) => c.id === state.cart.customerId) || null;

        let discountAmount = 0;
        const discountType = state.cart.manualDiscountType ?? customer?.discountType ?? null;
        const discountValue =
          state.cart.manualDiscountType != null
            ? state.cart.manualDiscountValue
            : customer?.discountValue ?? 0;

        if (discountType === 'percent') discountAmount = round2(gross * (discountValue / 100));
        if (discountType === 'fixed') discountAmount = round2(Math.min(gross, discountValue));

        const afterDiscount = round2(Math.max(0, gross - discountAmount));
        const tax = calcTva(afterDiscount, state.shop.tvaPercent);

        // stock check
        for (const line of lines) {
          const p = state.products.find((x) => x.id === line.productId)!;
          if (p.stock < line.quantity) return null;
        }

        const sale: Sale = {
          id: uid('sale'),
          invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
          createdAt: new Date().toISOString(),
          staffId: user.id,
          staffName: user.name,
          customerId: customer?.id ?? null,
          customerName: customer?.name ?? 'Guest',
          isGuest: !customer,
          items: lines,
          subtotalExTva: tax.subtotalExTva,
          tvaAmount: tax.tvaAmount,
          discountAmount,
          totalIncTva: tax.totalIncTva,
          paymentMethod: method,
          tvaPercent: state.shop.tvaPercent,
        };

        set({
          sales: [sale, ...state.sales],
          products: state.products.map((p) => {
            const line = lines.find((l) => l.productId === p.id);
            return line ? { ...p, stock: p.stock - line.quantity } : p;
          }),
          cart: emptyCart(),
        });

        return sale;
      },

      updateSupplierOrderStatus: (id, status) => {
        const orders = get().supplierOrders.map((o) =>
          o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
        );
        set({ supplierOrders: orders });
        const order = orders.find((o) => o.id === id);
        if (order?.status === 'arrived') {
          get().pushNotification('Order arrived', `${order.supplierName} delivery has arrived.`);
        }
        if (order?.status === 'in_store') {
          get().pushNotification('In store', `${order.supplierName} marked in store — receive stock when ready.`);
        }
        if (order && (status === 'on_the_way' || status === 'ordered')) {
          // keep calendar in sync for expected delivery
          const existing = get().events.find((e) => e.supplierOrderId === id);
          if (!existing && order.expectedAt) {
            get().upsertEvent({
              id: uid('ev'),
              title: `Delivery — ${order.supplierName}`,
              type: 'supplier_delivery',
              color: '#38bdf8',
              start: order.expectedAt,
              supplierOrderId: id,
              priority: 'high',
              status: 'planned',
            });
          }
        }
      },

      receiveSupplierOrder: (id) => {
        const order = get().supplierOrders.find((o) => o.id === id);
        if (!order || order.status !== 'in_store') return;
        order.items.forEach((item) => get().receiveStock(item.productId, item.quantity));
        get().pushNotification('Stock received', `Inventory updated from ${order.supplierName}.`);
      },

      upsertSupplierOrder: (order) => {
        const list = [...get().supplierOrders];
        const idx = list.findIndex((o) => o.id === order.id);
        if (idx >= 0) list[idx] = order;
        else list.push(order);
        set({ supplierOrders: list });
      },

      upsertEvent: (event) => {
        const list = [...get().events];
        const idx = list.findIndex((e) => e.id === event.id);
        if (idx >= 0) list[idx] = event;
        else list.push(event);
        set({ events: list });
      },
      deleteEvent: (id) => set({ events: get().events.filter((e) => e.id !== id) }),

      toggleWidget: (id) => {
        const userId = get().currentUserId;
        if (!userId) return;
        set({
          staff: get().staff.map((s) => {
            if (s.id !== userId) return s;
            return {
              ...s,
              layoutPrefs: {
                widgets: s.layoutPrefs.widgets.map((w) =>
                  w.id === id ? { ...w, visible: !w.visible } : w,
                ),
              },
            };
          }),
        });
      },

      resizeWidget: (id, w, h) => {
        const userId = get().currentUserId;
        if (!userId) return;
        set({
          staff: get().staff.map((s) => {
            if (s.id !== userId) return s;
            return {
              ...s,
              layoutPrefs: {
                widgets: s.layoutPrefs.widgets.map((widget) =>
                  widget.id === id
                    ? { ...widget, w: Math.min(12, Math.max(3, w)), h: Math.min(4, Math.max(1, h)) }
                    : widget,
                ),
              },
            };
          }),
        });
      },

      moveWidget: (id, direction) => {
        const userId = get().currentUserId;
        if (!userId) return;
        set({
          staff: get().staff.map((s) => {
            if (s.id !== userId) return s;
            const widgets = [...s.layoutPrefs.widgets].sort((a, b) => a.y - b.y || a.x - b.x);
            const idx = widgets.findIndex((w) => w.id === id);
            const swap = direction === 'up' ? idx - 1 : idx + 1;
            if (idx < 0 || swap < 0 || swap >= widgets.length) return s;
            const tmpY = widgets[idx].y;
            widgets[idx] = { ...widgets[idx], y: widgets[swap].y };
            widgets[swap] = { ...widgets[swap], y: tmpY };
            return { ...s, layoutPrefs: { widgets } };
          }),
        });
      },

      setEditModeDashboard: (v) => set({ editModeDashboard: v }),

      saveUserThemeAndLayout: () => {
        /* persisted via zustand */
      },

      markNotificationRead: (id) =>
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        }),

      pushNotification: (title, body, relatedEventId) =>
        set({
          notifications: [
            {
              id: uid('n'),
              title,
              body,
              createdAt: new Date().toISOString(),
              read: false,
              relatedEventId,
            },
            ...get().notifications,
          ],
        }),
    }),
    {
      name: 'rbt-manager-v1',
      partialize: (state) => ({
        shop: state.shop,
        themes: state.themes,
        activeThemeId: state.activeThemeId,
        staff: state.staff,
        categories: state.categories,
        products: state.products,
        customers: state.customers,
        sales: state.sales,
        suppliers: state.suppliers,
        supplierOrders: state.supplierOrders,
        events: state.events,
        reservedOrders: state.reservedOrders,
        notifications: state.notifications,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const theme =
          state.themes.find((t) => t.id === state.activeThemeId) || state.themes[0] || themePresets[0];
        applyTheme(theme);
      },
    },
  ),
);

export function useCurrentUser() {
  return useAppStore((s) => s.staff.find((u) => u.id === s.currentUserId) || null);
}

export function useActiveTheme() {
  return useAppStore((s) => s.themes.find((t) => t.id === s.activeThemeId) || s.themes[0]);
}

// Ensure default layout exists for older persisted users
export function ensureLayout(user: StaffUser): StaffUser {
  if (user.layoutPrefs?.widgets?.length) return user;
  return { ...user, layoutPrefs: defaultLayout };
}
