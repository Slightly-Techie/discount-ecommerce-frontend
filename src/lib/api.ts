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
    const response = await api.put(`/products/${id}`, product);
    return response.data.data;
  },

  // Delete product (Admin only)
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// Cart API
export const cartApi = {
  // Get user's cart
  getCart: async (): Promise<CartItemResponse[]> => {
    // console.log('Making GET request to /cart/cartitems/');
    const response = await api.get('/cart/cartitems/');
    // console.log('Raw API response:', response);
    // console.log('Response data:', response.data);
    console.log('Response data.results:', response.data.results);
    return response.data.results;
  },

  // Add item to cart
  addToCart: async (data: AddToCartData): Promise<CartItem> => {
    console.log('Making POST request to /cart/cartitems/ with data:', data);
    const response = await api.post('/cart/cartitems/', data);
    console.log('Add to cart raw response:', response);
    console.log('Add to cart response data:', response.data);
    console.log('Add to cart response data.data:', response.data.data);
    return response.data.data;
  },

  // Update cart item quantity
  updateCartItem: async (data: UpdateCartItemData): Promise<CartItem> => {
    console.log('Making PATCH request to /cart/cartitems/', data.cartItemId, 'with data:', {
      product: data.product,
      quantity: data.quantity
    });
    const response = await api.patch(`/cart/cartitems/${data.cartItemId}/`, {
      product: data.product,
      quantity: data.quantity
    });
    console.log('Update cart item response:', response);
    return response.data.data;
  },

  // Remove item from cart
  removeFromCart: async (cartItemId: string): Promise<void> => {
    await api.delete(`/cart/cartitems/${cartItemId}`);
  },

  // Clear cart
  clearCart: async (): Promise<void> => {
    await api.delete('/cart');
  },
};

// Favorites API
export const favoritesApi = {
  // Get user's favorites
  getFavorites: async (): Promise<Product[]> => {
    const response = await api.get('/favorites');
    return response.data.data;
  },

  // Add product to favorites
  addToFavorites: async (data: AddToFavoritesData): Promise<void> => {
    await api.post('/favorites', data);
  },

  // Remove product from favorites
  removeFromFavorites: async (productId: string): Promise<void> => {
    await api.delete(`/favorites/${productId}`);
  },
};

// Auth API
export const authApi = {
  // Login
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/token/', data);
    return response.data;
  },

  // Register
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/users/register/', data);
    return response.data;
  },

  // Refresh token
  refreshToken: async (data: RefreshTokenData): Promise<TokenResponse> => {
    const response = await api.post('/auth/token/refresh/', data);
    return response.data;
  },

  // Verify token
  verifyToken: async (data: VerifyTokenData): Promise<boolean> => {
    try {
      await api.post('/auth/token/verify/', data);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Logout (client-side only for now)
  logout: async (): Promise<void> => {
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  // Get current user (you'll need to implement this endpoint)
  getCurrentUser: async (): Promise<any> => {
    const response = await api.get('/users/me');
    return response.data;
  },
};

// Order API
export const orderApi = {
  // Create order
  createOrder: async (orderData: CreateOrderData): Promise<any> => {
    const response = await api.post('/orders', orderData);
    return response.data.data;
  },

  // Get user's orders
  getOrders: async (): Promise<any[]> => {
    const response = await api.get('/orders');
    return response.data.data;
  },

  // Get single order
  getOrder: async (orderId: string): Promise<any> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.data;
  },
};

// Category API
export const categoryApi = {
  // Get all categories
  getCategories: async (): Promise<any> => {
    const response = await api.get('/category/');
    return response.data.results;
  },
  // Create categories
  createCategories: async (categoryData: Category): Promise<any> => {
    const response = await api.post('/category/', categoryData);
    return response.data;
  }
};  

// Users API
export const userApi = {
  // Get all users
  getUsers: async (): Promise<any> => {
    const response = await api.get('/users/admin/users/');
    return response.data.results;
  },

  // Update user role
  updateUserRole: async (id: string, role: string): Promise<any> => {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  },

  // Update current user's profile (excluding role)
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
    if (profile) {
      // send nested profile as provided; backend may ignore if not supported
      (body as any).profile = profile;
    }
    const response = await api.patch(`/users/users/${id}/`, body);
    return response.data;
  },

  // Update nested profile directly (fallback when nested update is ignored)
  updateProfile: async (
    profileId: string,
    payload: { bio?: string | null; website?: string | null }
  ): Promise<any> => {
    const response = await api.patch(`/users/profiles/${profileId}/`, payload);
    return response.data;
  },

  // Update nested profile with multipart/form-data (for profile_image file)
  updateProfileMultipart: async (
    profileId: string,
    formData: FormData
  ): Promise<any> => {
    const response = await api.patch(`/users/profiles/${profileId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default api; 