import type { ProductStatus } from "./product";
import { Product, CartItem } from './product';

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Product API Types
export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  price_range?: string;
  sortBy?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  limit?: number;
  // Optional: filter products by vendor (vendor ID)
  vendor?: string;
  /** "internal" (vendor deals) or "external" (retailer deals). */
  source?: string;
  /** Exact retailer name, e.g. "Shoprite". */
  source_platform?: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: string;
  discount_price?: string;
  discount_start?: string;
  discount_end?: string;
  image_url: string;
  category: string;
  tags: string[];
  status: ProductStatus;
  is_available: boolean;
  is_featured: boolean;
  stock: number;
  related_products?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {}

// Cart API Types
export interface AddToCartData {
  product: string;
  quantity: number;
}

export interface UpdateCartItemData {
  cartItemId: string; // The cart item ID (not product ID)
  product: string;    // The product ID
  quantity: number;
}

// Cart item response from API
export interface CartItemResponse {
  id: string;
  cart: string;
  product: Product; // Now contains the full product object instead of just the ID
  quantity: number;
  price: string;
  created_at: string;
  updated_at: string;
}

// Auth API Types
export interface LoginData {
  email: string;
  password: string;
  redirectTo?: string;
}


export interface RegisterData {
  first_name: string;
  last_name: string;
  username: string;
  phonenumber: string;
  email: string;    
  password: string;
  date_of_birth: string;
  gender: string;
  role: string;
  metadata?: Record<string, any>;
}

export interface AuthResponse {
  access?: string;
  refresh?: string;
  user?: any;
  id?: string;
  email?: string;
  phonenumber?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  date_of_birth?: string;
  gender?: string;
  role?: string;
  metadata?: Record<string, any>;
}

export interface RefreshTokenData {
  refresh: string;
}

// Vendor API Types
export interface VendorSignupData {
  email: string;
  phonenumber: string;
  password: string;
  first_name: string;
  last_name: string;
  vendor_name: string;
}

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejection_reason?: string;
  business_email: string;
  phone: string;
  address?: string;
  logo?: string;
  website?: string;
  about?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorOwner {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phonenumber: string;
}

// Vendor as seen by platform admins (includes the applicant/owner accounts)
export interface AdminVendor extends Vendor {
  owners: VendorOwner[];
}

export interface VendorUpdatePayload {
  name?: string;
  business_email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  website?: string;
  about?: string;
}

export interface VerifyTokenData {
  token: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

// Favorites API Types
export interface AddToFavoritesData {
  productId: string;
}

// Order API Types
export interface CreateOrderData {
  items: CartItem[];
  shippingAddress: any;
  paymentMethod: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  phonenumber: string;
  role: UserRole;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_deleted?: boolean;
  metadata?: Record<string, any>;
  vendor?: { id: string; name: string; status: Vendor['status'] } | null;
  date_joined?: string;
  last_login?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateUserData {
  email?: string;
  phonenumber?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  role?: UserRole;
  is_deleted?: boolean;
  metadata?: Record<string, any>;
}

// Error Types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
} 

export enum UserRole {
  SELLER = 'seller',
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  MANAGER = 'manager',
  VENDOR_ADMIN = 'vendor_admin',
}

// Notifications
export type NotificationType =
  | 'vendor_signup'
  | 'vendor_approved'
  | 'vendor_rejected'
  | 'vendor_suspended';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  vendor: { id: string; name: string; status: Vendor['status'] } | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// Admin portal types
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface AdminOrder {
  id: string;
  user: string;
  user_email: string;
  vendor: { id: string; name: string; status: Vendor['status'] } | null;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  } | null;
  status: OrderStatus;
  total: string;
  discount: string;
  tax: string;
  shipping: string;
  coupon: { code: string } | null;
  checked_out_at: string;
  tracking_number: string | null;
  admin_note?: string | null;
  items: { id: string; product_name: string; quantity: number; price: string }[];
  created_at: string;
}

export interface AdminStats {
  users: { total: number; active: number };
  vendors: { total: number; pending: number; approved: number; rejected: number; suspended: number };
  products: { total: number; active: number };
  orders: { total: number } & Record<OrderStatus, number>;
  revenue: string;
  pending_product_reviews: number;
  recent_orders: AdminOrder[];
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'fixed' | 'percent';
  discount_value: string;
  usage_limit: number | null;
  usage_limit_per_user: number | null;
  valid_from: string;
  valid_to: string;
  active: boolean;
  min_order_amount: string;
  max_discount: string | null;
  times_used: number;
}

export interface Country {
  id: number;
  code: string;
  name: string;
}

export interface ShippingZone {
  id: number;
  name: string;
  country: number;
  country_name: string;
  is_remote: boolean;
}

export interface ShippingMethod {
  id: number;
  name: string;
  zone: number;
  zone_name: string;
  base_rate: string;
  per_kg_rate: string;
  free_over: string | null;
  active: boolean;
}

export interface TaxZone {
  id: number;
  name: string;
  country: number;
  country_name: string;
  active: boolean;
}

export interface TaxRate {
  id: number;
  zone: number;
  zone_name: string;
  rate: string;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
}

export interface ProductReview {
  id: string;
  user: string;
  user_email: string;
  product_name: string;
  rating: number;
  review: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface OrderReview {
  id: string;
  order: string;
  user: string;
  user_email: string;
  rating: number;
  review: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}