export type StockStatus = 'available' | 'reserved' | 'out_of_stock' | 'incoming';
export type PaymentMethod = 'cash' | 'card';
export type DiscountType = 'percent' | 'fixed';
export type UserRole = 'owner' | 'staff';
export type SupplierOrderStatus = 'ordered' | 'on_the_way' | 'arrived' | 'in_store';
export type EventType =
  | 'staff_schedule'
  | 'customer_pickup'
  | 'supplier_delivery'
  | 'business_task'
  | 'personal_note';
export type EventPriority = 'low' | 'medium' | 'high';
export type EventStatus = 'planned' | 'in_progress' | 'done' | 'cancelled';
export type ThemeMode = 'light' | 'dark' | 'custom';
export type WidgetId =
  | 'inventory'
  | 'sales'
  | 'staff'
  | 'top_products'
  | 'reserved'
  | 'calendar'
  | 'suppliers'
  | 'quick_actions';

export interface ShopSettings {
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  logoDataUrl: string | null;
  tvaPercent: number;
  currency: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  mode: ThemeMode;
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  cardSize: 'compact' | 'medium' | 'large';
  fontSize: 'small' | 'medium' | 'large';
  buttonShape: 'sharp' | 'rounded' | 'pill';
}

export interface StaffUser {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  canOverrideDiscount: boolean;
  active: boolean;
  layoutPrefs: DashboardLayout;
  themeId: string;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  brand: string;
  price: number;
  stock: number;
  reserved: number;
  incoming: number;
  imageDataUrl: string | null;
  barcode?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  isProfessional: boolean;
  discountType: DiscountType;
  discountValue: number;
  notes?: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  staffId: string;
  staffName: string;
  customerId: string | null;
  customerName: string;
  isGuest: boolean;
  items: SaleLine[];
  subtotalExTva: number;
  tvaAmount: number;
  discountAmount: number;
  totalIncTva: number;
  paymentMethod: PaymentMethod;
  tvaPercent: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
}

export interface SupplierOrderItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: SupplierOrderItem[];
  status: SupplierOrderStatus;
  orderedAt: string;
  expectedAt?: string;
  notes?: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  color: string;
  start: string;
  end?: string;
  staffId?: string;
  customerId?: string;
  supplierOrderId?: string;
  notes?: string;
  priority: EventPriority;
  status: EventStatus;
}

export interface ReservedOrder {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  pickupDate: string;
  status: 'reserved' | 'ready' | 'picked_up' | 'cancelled';
}

export interface DashboardWidget {
  id: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  relatedEventId?: string;
}
