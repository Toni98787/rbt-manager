import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createInitialState } from '../data/seed';
import type {
  AppState,
  CartItem,
  Category,
  Customer,
  Product,
  Sale,
  CalendarEvent,
  SupplierOrder,
  SupplierOrderStatus,
  ThemeConfig,
  DashboardWidget,
  ReservedOrder,
  PaymentMethod,
  ShopSettings,
  UserPreferences,
} from '../types';
import {
  calcCartTotals,
  customerDiscountAmount,
  toSaleLines,
  uid,
} from '../utils/helpers';

const STORAGE_KEY = 'rbt-manager-v1';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as AppState;
    const seed = createInitialState();
    return {
      ...seed,
      ...parsed,
      shop: { ...seed.shop, ...parsed.shop },
      preferences: {
        ...seed.preferences,
        ...parsed.preferences,
        widgets: parsed.preferences?.widgets?.length
          ? parsed.preferences.widgets
          : seed.preferences.widgets,
      },
      themes: parsed.themes?.length ? parsed.themes : seed.themes,
    };
  } catch {
    return createInitialState();
  }
}

interface StoreContextValue {
  state: AppState;
  theme: ThemeConfig;
  cart: CartItem[];
  selectedCustomerId: string | null;
  cartDiscountOverride: number | null;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  setSelectedCustomerId: (id: string | null) => void;
  setCartDiscountOverride: (v: number | null) => void;
  login: (staffId: string, pin: string) => boolean;
  logout: () => void;
  updateShop: (patch: Partial<ShopSettings>) => void;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  saveTheme: (theme: ThemeConfig) => void;
  setActiveTheme: (themeId: string) => void;
  updateWidgets: (widgets: DashboardWidget[]) => void;
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  convertGuestToCustomer: (
    name: string,
    extras?: Partial<Customer>,
  ) => string;
  completeSale: (paymentMethod: PaymentMethod) => Sale | null;
  updateSupplierOrderStatus: (id: string, status: SupplierOrderStatus) => void;
  receiveSupplierOrder: (id: string) => void;
  addSupplierOrder: (order: Omit<SupplierOrder, 'id' | 'updatedAt'>) => void;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  addReservedOrder: (order: Omit<ReservedOrder, 'id'>) => void;
  updateReservedOrder: (id: string, patch: Partial<ReservedOrder>) => void;
  markNotificationRead: (id: string) => void;
  clearCart: () => void;
  cartTotals: ReturnType<typeof calcCartTotals>;
  activeCustomer: Customer | null;
  currentStaff: AppState['staff'][0] | null;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [cartDiscountOverride, setCartDiscountOverride] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const theme =
    state.themes.find((t) => t.id === state.preferences.themeId) ??
    state.themes[0];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-bg', theme.background);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-muted', theme.textMuted);
    root.dataset.theme = theme.mode;
    root.dataset.cardSize = theme.productCardSize;
    root.dataset.fontSize = theme.fontSize;
    root.dataset.buttonShape = theme.buttonShape;
  }, [theme]);

  const activeCustomer =
    state.customers.find((c) => c.id === selectedCustomerId) ?? null;
  const currentStaff =
    state.staff.find((s) => s.id === state.currentStaffId) ?? null;

  const subtotalPreview = cart.reduce((sum, i) => {
    const base = i.unitPrice * i.quantity;
    return sum + base * (1 - (i.discountPercent || 0) / 100);
  }, 0);

  const autoDiscount = customerDiscountAmount(activeCustomer, subtotalPreview);
  const discountAmount =
    cartDiscountOverride !== null ? cartDiscountOverride : autoDiscount;

  const cartTotals = calcCartTotals(cart, state.shop.tvaPercent, discountAmount);

  const login = useCallback(
    (staffId: string, pin: string) => {
      const member = state.staff.find((s) => s.id === staffId && s.active);
      if (!member || member.pin !== pin) return false;
      setState((s) => ({ ...s, currentStaffId: staffId }));
      return true;
    },
    [state.staff],
  );

  const logout = useCallback(() => {
    setState((s) => ({ ...s, currentStaffId: null }));
    setCart([]);
    setSelectedCustomerId(null);
  }, []);

  const updateShop = (patch: Partial<ShopSettings>) =>
    setState((s) => ({ ...s, shop: { ...s.shop, ...patch } }));

  const updatePreferences = (patch: Partial<UserPreferences>) =>
    setState((s) => ({
      ...s,
      preferences: { ...s.preferences, ...patch },
    }));

  const saveTheme = (themeConfig: ThemeConfig) =>
    setState((s) => {
      const exists = s.themes.some((t) => t.id === themeConfig.id);
      return {
        ...s,
        themes: exists
          ? s.themes.map((t) => (t.id === themeConfig.id ? themeConfig : t))
          : [...s.themes, themeConfig],
        preferences: { ...s.preferences, themeId: themeConfig.id },
      };
    });

  const setActiveTheme = (themeId: string) =>
    setState((s) => ({
      ...s,
      preferences: { ...s.preferences, themeId },
    }));

  const updateWidgets = (widgets: DashboardWidget[]) =>
    setState((s) => ({
      ...s,
      preferences: { ...s.preferences, widgets },
    }));

  const addCategory = (name: string, color: string) =>
    setState((s) => ({
      ...s,
      categories: [
        ...s.categories,
        {
          id: uid('cat'),
          name,
          color,
          order: s.categories.length,
        },
      ],
    }));

  const updateCategory = (id: string, patch: Partial<Category>) =>
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  const deleteCategory = (id: string) =>
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
    }));

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) =>
    setState((s) => ({
      ...s,
      products: [
        ...s.products,
        { ...product, id: uid('p'), createdAt: new Date().toISOString() },
      ],
    }));

  const updateProduct = (id: string, patch: Partial<Product>) =>
    setState((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));

  const deleteProduct = (id: string) =>
    setState((s) => ({
      ...s,
      products: s.products.filter((p) => p.id !== id),
    }));

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) =>
    setState((s) => ({
      ...s,
      customers: [
        ...s.customers,
        { ...customer, id: uid('c'), createdAt: new Date().toISOString() },
      ],
    }));

  const updateCustomer = (id: string, patch: Partial<Customer>) =>
    setState((s) => ({
      ...s,
      customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  const convertGuestToCustomer = (name: string, extras: Partial<Customer> = {}) => {
    const id = uid('c');
    setState((s) => ({
      ...s,
      customers: [
        ...s.customers,
        {
          id,
          name,
          phone: extras.phone ?? '',
          email: extras.email ?? '',
          isProfessional: extras.isProfessional ?? false,
          defaultDiscountType: extras.defaultDiscountType ?? null,
          defaultDiscountValue: extras.defaultDiscountValue ?? 0,
          notes: extras.notes ?? 'Converted from guest sale',
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    return id;
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomerId(null);
    setCartDiscountOverride(null);
  };

  const completeSale = (paymentMethod: PaymentMethod): Sale | null => {
    if (!cart.length || !state.currentStaffId) return null;
    const staffMember = state.staff.find((s) => s.id === state.currentStaffId);
    if (!staffMember) return null;

    const lines = toSaleLines(cart, state.products);
    const totals = calcCartTotals(cart, state.shop.tvaPercent, discountAmount);
    const invoiceNumber = `INV-${state.invoiceCounter + 1}`;

    const sale: Sale = {
      id: uid('sale'),
      invoiceNumber,
      staffId: staffMember.id,
      staffName: staffMember.name,
      customerId: activeCustomer?.id ?? null,
      customerName: activeCustomer?.name ?? null,
      isGuest: !activeCustomer,
      lines,
      subtotalExTva: totals.subtotalExTva,
      discountAmount: totals.discountAmount,
      tvaPercent: state.shop.tvaPercent,
      tvaAmount: totals.tvaAmount,
      totalIncTva: totals.totalIncTva,
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      invoiceCounter: s.invoiceCounter + 1,
      sales: [sale, ...s.sales],
      products: s.products.map((p) => {
        const line = cart.find((c) => c.productId === p.id);
        if (!line) return p;
        const stock = Math.max(0, p.stock - line.quantity);
        return {
          ...p,
          stock,
          status: stock === 0 ? 'out_of_stock' : p.status === 'out_of_stock' ? 'available' : p.status,
        };
      }),
    }));

    clearCart();
    return sale;
  };

  const updateSupplierOrderStatus = (id: string, status: SupplierOrderStatus) => {
    setState((s) => {
      const order = s.supplierOrders.find((o) => o.id === id);
      const notifications = [...s.notifications];
      if (order && status === 'arrived') {
        notifications.unshift({
          id: uid('n'),
          title: 'Shipment arrived',
          body: `${order.supplierName} order has arrived — ready to receive`,
          createdAt: new Date().toISOString(),
          read: false,
          relatedType: 'supplier_order',
          relatedId: id,
        });
      }
      return {
        ...s,
        notifications,
        supplierOrders: s.supplierOrders.map((o) =>
          o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
        ),
        events: s.events.map((e) =>
          e.linkedOrderId === id
            ? {
                ...e,
                status: status === 'in_store' ? 'done' : e.status,
                notes: `${e.notes} · Status: ${status}`.trim(),
              }
            : e,
        ),
      };
    });
  };

  const receiveSupplierOrder = (id: string) => {
    setState((s) => {
      const order = s.supplierOrders.find((o) => o.id === id);
      if (!order) return s;
      const products = s.products.map((p) => {
        const item = order.items.find((i) => i.productId === p.id);
        if (!item) return p;
        const stock = p.stock + item.quantity;
        return {
          ...p,
          stock,
          status: 'available' as const,
        };
      });
      return {
        ...s,
        products,
        supplierOrders: s.supplierOrders.map((o) =>
          o.id === id
            ? { ...o, status: 'in_store' as const, updatedAt: new Date().toISOString() }
            : o,
        ),
        notifications: [
          {
            id: uid('n'),
            title: 'Stock received',
            body: `${order.supplierName} goods marked in store — inventory updated`,
            createdAt: new Date().toISOString(),
            read: false,
            relatedType: 'supplier_order',
            relatedId: id,
          },
          ...s.notifications,
        ],
      };
    });
  };

  const addSupplierOrder = (order: Omit<SupplierOrder, 'id' | 'updatedAt'>) => {
    const id = uid('so');
    setState((s) => ({
      ...s,
      supplierOrders: [
        {
          ...order,
          id,
          updatedAt: new Date().toISOString(),
        },
        ...s.supplierOrders,
      ],
      events: [
        {
          id: uid('e'),
          title: `${order.supplierName} delivery`,
          type: 'supplier_delivery',
          date: order.expectedAt,
          time: '09:00',
          endTime: '10:00',
          staffIds: [],
          notes: order.notes,
          priority: 'medium',
          status: 'pending',
          linkedOrderId: id,
          linkedCustomerId: null,
          color: '#2563eb',
        },
        ...s.events,
      ],
    }));
  };

  const addEvent = (event: Omit<CalendarEvent, 'id'>) =>
    setState((s) => ({
      ...s,
      events: [{ ...event, id: uid('e') }, ...s.events],
    }));

  const updateEvent = (id: string, patch: Partial<CalendarEvent>) =>
    setState((s) => ({
      ...s,
      events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));

  const deleteEvent = (id: string) =>
    setState((s) => ({
      ...s,
      events: s.events.filter((e) => e.id !== id),
    }));

  const addReservedOrder = (order: Omit<ReservedOrder, 'id'>) =>
    setState((s) => ({
      ...s,
      reservedOrders: [{ ...order, id: uid('ro') }, ...s.reservedOrders],
      events: [
        {
          id: uid('e'),
          title: `${order.customerName} pickup`,
          type: 'customer_pickup',
          date: order.pickupDate,
          time: '12:00',
          endTime: '12:30',
          staffIds: [],
          notes: order.notes,
          priority: 'medium',
          status: 'pending',
          linkedOrderId: null,
          linkedCustomerId: order.customerId,
          color: '#16a34a',
        },
        ...s.events,
      ],
    }));

  const updateReservedOrder = (id: string, patch: Partial<ReservedOrder>) =>
    setState((s) => ({
      ...s,
      reservedOrders: s.reservedOrders.map((o) =>
        o.id === id ? { ...o, ...patch } : o,
      ),
    }));

  const markNotificationRead = (id: string) =>
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));

  const value = useMemo(
    () => ({
      state,
      theme,
      cart,
      selectedCustomerId,
      cartDiscountOverride,
      setCart,
      setSelectedCustomerId,
      setCartDiscountOverride,
      login,
      logout,
      updateShop,
      updatePreferences,
      saveTheme,
      setActiveTheme,
      updateWidgets,
      addCategory,
      updateCategory,
      deleteCategory,
      addProduct,
      updateProduct,
      deleteProduct,
      addCustomer,
      updateCustomer,
      convertGuestToCustomer,
      completeSale,
      updateSupplierOrderStatus,
      receiveSupplierOrder,
      addSupplierOrder,
      addEvent,
      updateEvent,
      deleteEvent,
      addReservedOrder,
      updateReservedOrder,
      markNotificationRead,
      clearCart,
      cartTotals,
      activeCustomer,
      currentStaff,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      state,
      theme,
      cart,
      selectedCustomerId,
      cartDiscountOverride,
      cartTotals,
      activeCustomer,
      currentStaff,
      login,
      logout,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
