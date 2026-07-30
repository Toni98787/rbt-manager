export type StockStatus = 'available' | 'reserved' | 'out_of_stock' | 'incoming';
export type PaymentMethod = 'cash' | 'card';
export type DiscountType = 'percentage' | 'fixed';
export type SupplierOrderStatus = 'ordered' | 'on_the_way' | 'arrived' | 'in_store';
export type EventType = 'staff_schedule' | 'customer_pickup' | 'supplier_delivery' | 'business_task' | 'personal_note';
export type EventPriority = 'low' | 'medium' | 'high';
export type EventStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';
export type ThemeMode = 'light' | 'dark' | 'custom';
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';
export type WidgetType =
  | 'inventory'
  | 'sales'
  | 'staff'
  | 'top_products'
  | 'reserved_orders'
  | 'calendar'
  | 'supplier_orders'
  | 'quick_actions';

export interface ShopSettings {
  shopName: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  logoDataUrl: string | null;
  tvaPercent: number;
  currency: string;
  currencySymbol: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  mode: ThemeMode;
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  productCardSize: 'compact' | 'medium' | 'large';
  fontSize: 'sm' | 'md' | 'lg';
  buttonShape: 'sharp' | 'rounded' | 'pill';
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  order: number;
  visible: boolean;
}

export interface UserPreferences {
  themeId: string;
  widgets: DashboardWidget[];
  wallpaper: string | null;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  reserved: number;
  brand: string;
  imageDataUrl: string | null;
  barcode: string | null;
  status: StockStatus;
  saleDiscountPercent: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  isProfessional: boolean;
  defaultDiscountType: DiscountType | null;
  defaultDiscountValue: number;
  notes: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'owner' | 'staff';
  pin: string;
  canOverrideDiscount: boolean;
  active: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export interface SaleLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotalExTva: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  staffId: string;
  staffName: string;
  customerId: string | null;
  customerName: string | null;
  isGuest: boolean;
  lines: SaleLine[];
  subtotalExTva: number;
  discountAmount: number;
  tvaPercent: number;
  tvaAmount: number;
  totalIncTva: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
}

export interface SupplierOrderItem {
  productId: string | null;
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: SupplierOrderItem[];
  status: SupplierOrderStatus;
  orderedAt: string;
  expectedAt: string;
  notes: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  endTime: string;
  staffIds: string[];
  notes: string;
  priority: EventPriority;
  status: EventStatus;
  linkedOrderId: string | null;
  linkedCustomerId: string | null;
  color: string;
}

export interface ReservedOrder {
  id: string;
  customerId: string;
  customerName: string;
  productIds: string[];
  productNames: string[];
  pickupDate: string;
  status: 'pending' | 'ready' | 'picked_up' | 'cancelled';
  notes: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  relatedType?: string;
  relatedId?: string;
}

export interface AppState {
  shop: ShopSettings;
  themes: ThemeConfig[];
  preferences: UserPreferences;
  categories: Category[];
  products: Product[];
  customers: Customer[];
  staff: StaffMember[];
  sales: Sale[];
  suppliers: Supplier[];
  supplierOrders: SupplierOrder[];
  events: CalendarEvent[];
  reservedOrders: ReservedOrder[];
  notifications: AppNotification[];
  currentStaffId: string | null;
  invoiceCounter: number;
}
