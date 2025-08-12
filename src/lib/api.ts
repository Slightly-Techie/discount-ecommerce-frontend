import api from './axios';
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
  CartItemResponse
} from '@/types';

// Product API
export const productApi = {
  // Get all products with optional filters
  getProducts: async (params?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products/', { params });
    return response.data;
  },

  // Get featured products
  getFeaturedProducts: async (): Promise<Product[]> => {
    const response = await api.get('/products/featured');
    return response.data.data;
  },

  // Get single product
  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },

  // Create product (Admin only)
  createProduct: async (product: CreateProductData): Promise<Product> => {
    const response = await api.post('/products/', product);
    return response.data.data;
  },

  // Update product (Admin only)
  updateProduct: async (id: string, product: UpdateProductData): Promise<Product> => {
    const response = await api.put(`/products/${id}/`, product);
    return response.data.data;
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
      console.log('Clearing cart by removing individual items:', cartItems);
      
      // Delete each cart item individually
      for (const item of cartItems) {
        if (item.id) {
          await cartApi.removeFromCart(item.id);
        }
      }
      console.log('Cart cleared by removing individual items');
    } catch (error) {
      console.error('Error clearing cart by items:', error);
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
        console.log('Clear cart endpoint not supported, trying alternative approach...');
        
        // Option 1: Try POST instead of DELETE
        try {
          await api.post(`/cart/${cartId}/clear/`);
          return;
        } catch (postError) {
          console.log('POST clear also failed, trying to clear individual items...');
        }
        
        // Option 2: Get cart items and delete them individually
        try {
          await cartApi.clearCartByItems();
          return;
        } catch (individualError) {
          console.error('Failed to clear cart by removing individual items:', individualError);
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
    const response = await api.post('/users/register/', data);
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
    console.log('orderApi.getOrder - calling endpoint:', `/orders/${orderId}/`);
    const response = await api.get(`/orders/${orderId}/`);
    console.log('orderApi.getOrder - response:', response.data);
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

// Users API
export const userApi = {
  getUsers: async (): Promise<any> => {
    const response = await api.get('/users/admin/users/');
    return response.data.results;
  },
  updateUserRole: async (id: string, role: string): Promise<any> => {
    const response = await api.put(`/users/${id}/role`, { role });
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

export default api; 