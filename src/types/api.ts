import { Product, CartItem } from './product';

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  results: T[];
  pagination: {
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
  sortBy?: string;
  page?: number;
  limit?: number;
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
  status: 'active' | 'inactive';
  is_available: boolean;
  is_featured: boolean;
  stock: number;
  related_products?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {}

// Cart API Types
export interface AddToCartData {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemData {
  productId: string;
  quantity: number;
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
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: any;
}

export interface RefreshTokenData {
  refresh: string;
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
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Error Types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
} 

export interface Category {
  id: string;
  name: string;
}