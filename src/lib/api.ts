import api from './axios';
import { API_BASE_URL } from './axios';
import type { AdminPaymentSubmission, PaymentAccount, PaymentSubmission } from '@/types/payments';
import { 
  Product, 
  CartItem,
  ApiResponse, 
  PaginatedResponse, 
  ProductFilters, 
  CreateProductData, 
  UpdateProductData,
  AddToCartData,
  UpdateCartItemData,
  LoginData,
  RegisterData,
  AuthResponse,
  RefreshTokenData,
  VerifyTokenData,
  TokenResponse,
  AddToFavoritesData,
  CreateOrderData,
  Category,
  CartItemResponse,
  User,
  UpdateUserData,
  Vendor,
  VendorUpdatePayload,
  AdminVendor,
  CreateVendorPayload,
  CreateVendorResponse,
  VendorRequest,
  VendorRequestPayload,
  VendorRequestStatus,
  AdminOrder,
  AdminStats,
  AppNotification,
  Coupon,
  Country,
  ListParams,
  OrderReview,
  OrderStatus,
  ProductReview,
  ShippingMethod,
  ShippingZone,
  Tag,
  TaxRate,
  TaxZone,
} from '@/types';

// Test API connectivity
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const endpoints = ['/health/', '/products/', '/category/'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        return true;
      } catch (error: any) {
        // If we get a 401 or 403, it means the server is reachable but we need auth
        if (error.response?.status === 401 || error.response?.status === 403) {
          return true;
        }
        // If we get a 404, try the next endpoint
        if (error.response?.status === 404) {
          continue;
        }
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

// Product API
export const productApi = {
  // Get all products with optional filters
  getProducts: async (params?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products/', { params });
    return response.data;
  },

  // Get products from a specific URL (for pagination)
  getProductsFromUrl: async (url: string): Promise<PaginatedResponse<Product>> => {
    const response = await api.get(url);
    return response.data;
  },

  // Get featured products
  getFeaturedProducts: async (): Promise<Product[]> => {
    const response = await api.get('/products/featured');
    return response.data.data;
  },

  // Get single product
  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}/`);
    return response.data;
  },

  // Create product (Admin only)
  createProduct: async (product: CreateProductData): Promise<Product> => {
    const response = await api.post('/products/', product);
    return response.data;
  },

  // Update product (Admin only)
  updateProduct: async (id: string, product: UpdateProductData): Promise<Product> => {
    const response = await api.put(`/products/${id}/`, product);
    return response.data;
  },

  // Attach an uploaded photo; the API stores it in S3 and returns the product.
  uploadProductImage: async (id: string, file: File): Promise<Product> => {
    const form = new FormData();
    form.append('image', file);
    const response = await api.patch(`/products/${id}/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  },

  // Delete product (Admin only)
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  // Bulk upload products (Admin only)
  bulkUploadProducts: async (products: any[]): Promise<any> => {
    const response = await api.post('/products/bulk-upload/', { products });
    return response.data;
  },
};

// Cart API
export const cartApi = {
  // Get user's cart
  getCart: async (): Promise<CartItemResponse[]> => {
    const response = await api.get('/cart/cartitems/');
    return response.data.results;
  },

  // Add item to cart
  addToCart: async (data: AddToCartData): Promise<CartItem> => {
    const response = await api.post('/cart/cartitems/', data);
    return response.data.data;
  },

  // Update cart item quantity
  updateCartItem: async (data: UpdateCartItemData): Promise<CartItem> => {
    const response = await api.patch(`/cart/cartitems/${data.cartItemId}/`, {
      product: data.product,
      quantity: data.quantity
    });
    return response.data.data;
  },

  // Remove item from cart
  removeFromCart: async (cartItemId: string): Promise<void> => {
    await api.delete(`/cart/cartitems/${cartItemId}/`);
  },

  // Clear cart by removing all items individually
  clearCartByItems: async (): Promise<void> => {
    try {
      const cartItems = await cartApi.getCart();
      
      // Delete each cart item individually
      for (const item of cartItems) {
        if (item.id) {
          await cartApi.removeFromCart(item.id);
        }
      }
    } catch (error) {
      throw error;
    }
  },

  // Clear cart
  clearCart: async (cartId: string): Promise<void> => {
    // Try different approaches to clear the cart
    try {
      // First try the original endpoint
      await api.delete(`/cart/${cartId}/clear/`);
    } catch (error: any) {
      if (error.response?.status === 405) {
        // If method not allowed, try alternative approaches
        
        // Option 1: Try POST instead of DELETE
        try {
          await api.post(`/cart/${cartId}/clear/`);
          return;
        } catch (postError) {
        }
        
        // Option 2: Get cart items and delete them individually
        try {
          await cartApi.clearCartByItems();
          return;
        } catch (individualError) {
          throw individualError;
        }
      } else {
        throw error;
      }
    }
  },
};

// Favorites API
export const favoritesApi = {
  getFavorites: async (): Promise<Product[]> => {
    const response = await api.get('/favorites');
    return response.data.data;
  },
  addToFavorites: async (data: AddToFavoritesData): Promise<void> => {
    await api.post('/favorites', data);
  },
  removeFromFavorites: async (productId: string): Promise<void> => {
    await api.delete(`/favorites/${productId}`);
  },
};

// Auth API
export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/token/', data);
    return response.data;
  },
  register: async (data: RegisterData): Promise<AuthResponse> => {
    
    // Add metadata field as required by the API
    const payload = {
      ...data,
      metadata: {}
    };
    
    const response = await api.post('/users/register/', payload);
    return response.data;
  },
  refreshToken: async (data: RefreshTokenData): Promise<TokenResponse> => {
    const response = await api.post('/auth/token/refresh/', data);
    return response.data;
  },
  verifyToken: async (data: VerifyTokenData): Promise<boolean> => {
    try {
      await api.post('/auth/token/verify/', data);
      return true;
    } catch (error) {
      return false;
    }
  },
  logout: async (): Promise<void> => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  getCurrentUser: async (): Promise<any> => {
    const response = await api.get('/users/me/');
    return response.data;
  },
  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/users/password-reset/', { email });
  },
  confirmPasswordReset: async (data: { uid: string; token: string; new_password: string }): Promise<{ detail: string }> => {
    const response = await api.post('/users/password-reset-confirm/', data);
    return response.data;
  },
};

// Vendors API
export const vendorsApi = {
  getVendors: async (params?: ListParams): Promise<PaginatedResponse<Vendor>> => {
    const response = await api.get('/vendors/', { params });
    return response.data;
  },
  createVendor: async (data: CreateVendorPayload | FormData): Promise<CreateVendorResponse> => {
    const response = await api.post(
      '/vendors/',
      data,
      data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined,
    );
    return response.data;
  },
  resendInvite: async (id: string): Promise<{ invite_sent: boolean }> => {
    const response = await api.post(`/vendors/${id}/resend-invite/`);
    return response.data;
  },
  submitRequest: async (data: VendorRequestPayload): Promise<{ detail: string }> => {
    const response = await api.post('/vendors/requests/', data);
    return response.data;
  },
  listRequests: async (params?: { status?: VendorRequestStatus; page?: number; page_size?: number }): Promise<PaginatedResponse<VendorRequest>> => {
    const response = await api.get('/vendors/requests/', { params });
    return response.data;
  },
  dismissRequest: async (id: string): Promise<VendorRequest> => {
    const response = await api.patch(`/vendors/requests/${id}/dismiss/`);
    return response.data;
  },
  getVendorMe: async (): Promise<Vendor> => {
    const response = await api.get('/vendors/me/');
    return response.data;
  },
  updateVendorMe: async (data: Partial<VendorUpdatePayload>): Promise<Vendor> => {
    // Some backends expect multipart/form-data for profile updates
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as any);
      }
    });

    const response = await api.patch('/vendors/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getVendor: async (id: string): Promise<Vendor> => {
    const response = await api.get(`/vendors/${id}/`);
    return response.data;
  },
  updateVendor: async (id: string, data: Partial<VendorUpdatePayload>): Promise<Vendor> => {
    const response = await api.patch(`/vendors/${id}/`, data);
    return response.data;
  },
  approveVendor: async (id: string): Promise<void> => {
    await api.patch(`/vendors/${id}/approve/`);
  },
  rejectVendor: async (id: string, reason?: string): Promise<void> => {
    await api.patch(`/vendors/${id}/reject/`, { reason: reason ?? '' });
  },
  suspendVendor: async (id: string): Promise<void> => {
    await api.patch(`/vendors/${id}/suspend/`);
  },
};

// Order API
export const orderApi = {
  // Create order (legacy)
  createOrder: async (orderData: CreateOrderData): Promise<any> => {
    const response = await api.post('/orders', orderData);
    return response.data.data;
  },
  // Checkout with optional coupon
  checkout: async (payload: { coupon_code?: string }): Promise<any> => {
    const response = await api.post('/orders/checkout/', payload);
    return response.data;
  },
  // Get user's orders
  getOrders: async (): Promise<any[]> => {
    const response = await api.get('/orders/');
    return response.data.results;
  },
  // Get single order
  getOrder: async (orderId: string): Promise<any> => {
    const response = await api.get(`/orders/${orderId}/`);
    return response.data;
  },
};

// Category API
export const categoryApi = {
  getCategories: async (): Promise<any> => {
    const response = await api.get('/category/');
    return response.data.results;
  },
  createCategories: async (categoryData: Category): Promise<any> => {
    const response = await api.post('/category/', categoryData);
    return response.data;
  },
  bulkUploadCategories: async (categories: any[]): Promise<any> => {
    const response = await api.post('/category/bulk-upload/', { categories });
    return response.data;
  },
};  

// Manual payments (bank / MoMo transfer, admin-confirmed)
export const paymentsApi = {
  listAccounts: async (): Promise<PaymentAccount[]> => {
    const response = await api.get('/payments/accounts/');
    return response.data;
  },
  submit: async (form: FormData): Promise<PaymentSubmission> => {
    const response = await api.post('/payments/submissions/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  },
  /** Screenshots need the auth header, so fetch as a blob and hand back an object URL. */
  screenshotBlobUrl: async (url: string): Promise<string> => {
    const response = await api.get(url, { responseType: 'blob', baseURL: '' });
    return URL.createObjectURL(response.data);
  },
};

// Users API
export const userApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users/admin/users/');
    return response.data.results;
  },
  updateUserRole: async (id: string, role: string): Promise<User> => {
    const response = await api.patch(`/users/admin/users/${id}/`, { role });
    return response.data;
  },
  updateCurrentUser: async (
    id: string,
    payload: Partial<{
      email: string;
      phonenumber: string;
      username: string;
      first_name: string;
      last_name: string;
      date_of_birth: string;
      gender: string;
      metadata: Record<string, any>;
      profile: { bio?: string; website?: string };
    }>
  ): Promise<any> => {
    const { role, profile, ...rest } = payload as any;
    const body = { ...rest };
    if (profile) (body as any).profile = profile;
    const response = await api.patch(`/users/users/${id}/`, body);
    return response.data;
  },
  updateProfile: async (
    profileId: string,
    payload: { bio?: string | null; website?: string | null }
  ): Promise<any> => {
    const response = await api.patch(`/users/profiles/${profileId}/`, payload);
    return response.data;
  },
  updateProfileMultipart: async (
    profileId: string,
    formData: FormData
  ): Promise<any> => {
    const response = await api.patch(`/users/profiles/${profileId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  createAddress: async (payload: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code?: string;
    country: string;
    is_default?: boolean;
  }): Promise<any> => {
    const response = await api.post('/users/addresses/', payload);
    return response.data;
  },
  updateAddress: async (
    id: string,
    payload: Partial<{
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postal_code?: string;
      country: string;
      is_default?: boolean;
    }>
  ): Promise<any> => {
    const response = await api.patch(`/users/addresses/${id}/`, payload);
    return response.data;
  },
  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/users/addresses/${id}/`);
  },
};

// Notifications API (in-app notifications for the current user)
export const notificationsApi = {
  list: async (params?: ListParams): Promise<PaginatedResponse<AppNotification>> => {
    const response = await api.get('/notifications/', { params });
    return response.data;
  },
  unreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count/');
    return response.data.unread;
  },
  markRead: async (id: string): Promise<AppNotification> => {
    const response = await api.patch(`/notifications/${id}/read/`);
    return response.data;
  },
  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read/');
  },
};

// Generic CRUD helper for admin resources exposed as DRF viewsets
const crud = <T, Id extends string | number = string | number>(base: string) => ({
  list: async (params?: ListParams): Promise<PaginatedResponse<T>> => {
    const response = await api.get(`${base}/`, { params });
    return response.data;
  },
  create: async (data: Partial<T>): Promise<T> => {
    const response = await api.post(`${base}/`, data);
    return response.data;
  },
  update: async (id: Id, data: Partial<T>): Promise<T> => {
    const response = await api.patch(`${base}/${id}/`, data);
    return response.data;
  },
  remove: async (id: Id): Promise<void> => {
    await api.delete(`${base}/${id}/`);
  },
});

// Admin portal API (platform admins / managers)
export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get('/orders/admin/stats/');
    return response.data;
  },

  // Vendors
  getVendors: async (params?: ListParams): Promise<PaginatedResponse<AdminVendor>> => {
    const response = await api.get('/vendors/', { params });
    return response.data;
  },
  getVendor: async (id: string): Promise<AdminVendor> => {
    const response = await api.get(`/vendors/${id}/`);
    return response.data;
  },

  // Users
  getUsers: async (params?: ListParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/users/admin/users/', { params });
    return response.data;
  },
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/admin/users/${id}/`, data);
    return response.data;
  },
  deactivateUser: async (id: string): Promise<void> => {
    await api.post(`/users/admin/users/${id}/deactivate/`);
  },

  // Orders
  getOrders: async (params?: ListParams): Promise<PaginatedResponse<AdminOrder>> => {
    const response = await api.get('/orders/', { params });
    return response.data;
  },
  updateOrder: async (
    id: string,
    data: { status?: OrderStatus; tracking_number?: string; admin_note?: string }
  ): Promise<{ detail: string }> => {
    const response = await api.patch(`/orders/${id}/status/`, data);
    return response.data;
  },

  // Coupons, shipping & tax
  coupons: crud<Coupon, string>('/orders/admin/coupons'),
  countries: crud<Country, number>('/orders/admin/countries'),
  shippingZones: crud<ShippingZone, number>('/orders/admin/shipping-zones'),
  shippingMethods: crud<ShippingMethod, number>('/orders/admin/shipping-methods'),
  taxZones: crud<TaxZone, number>('/orders/admin/tax-zones'),
  taxRates: crud<TaxRate, number>('/orders/admin/tax-rates'),

  // Reviews
  getProductReviews: async (params?: ListParams): Promise<PaginatedResponse<ProductReview>> => {
    const response = await api.get('/products/reviews/', { params });
    return response.data;
  },
  moderateProductReview: async (id: string, is_approved: boolean): Promise<ProductReview> => {
    const response = await api.patch(`/products/reviews/${id}/moderate/`, { is_approved });
    return response.data;
  },
  deleteProductReview: async (id: string): Promise<void> => {
    await api.delete(`/products/reviews/${id}/`);
  },
  orderReviews: crud<OrderReview, string>('/orders/admin/reviews'),

  // Categories & tags
  categories: crud<Category, string>('/category'),
  tags: crud<Tag, string>('/category/tags'),

  // Manual payments
  paymentAccounts: crud<PaymentAccount, string>('/payments/admin/accounts'),
  paymentSubmissions: {
    list: async (params?: ListParams & { status?: string }): Promise<PaginatedResponse<AdminPaymentSubmission>> => {
      const response = await api.get('/payments/admin/submissions/', { params });
      return response.data;
    },
    confirm: async (id: string): Promise<AdminPaymentSubmission> => {
      const response = await api.post(`/payments/admin/submissions/${id}/confirm/`);
      return response.data;
    },
    reject: async (id: string, reason: string): Promise<AdminPaymentSubmission> => {
      const response = await api.post(`/payments/admin/submissions/${id}/reject/`, { reason });
      return response.data;
    },
  },
};

export default api; 