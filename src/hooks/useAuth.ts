import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, cartApi } from '@/lib/api';
import { RegisterData, RefreshTokenData, VerifyTokenData, LoginData } from '@/types/api';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useOrdersStore } from '@/store/ordersStore';

// Query keys
export const authKeys = {
  user: ['auth', 'user'] as const,
};

// Get current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: authApi.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  });
};

async function mergeGuestCartIntoServer() {
  try {
    const guestCart = useCartStore.getState().cart || [];
    if (Array.isArray(guestCart) && guestCart.length > 0) {
      for (const item of guestCart) {
        const productId = item?.product?.id;
        const quantity = item?.quantity || 1;
        if (!productId) continue;
        try {
          await cartApi.addToCart({ product: productId, quantity });
        } catch {
          // Ignore individual add errors and continue merging others
        }
      }
    }
  } finally {
    // Refresh cart from server to reflect merged state
    try {
      await useCartStore.getState().fetchCart();
    } catch {}
  }
}

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: async (data, variables) => {
      // Store tokens
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);

      // Store user data in localStorage for orders store
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        queryClient.setQueryData(authKeys.user, data.user);
      }

      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: authKeys.user });

      // Clear any existing orders for previous user
      useOrdersStore.setState({ orders: [], currentOrder: null, currentUserId: null });

      // Clear any existing orders for previous user
      useOrdersStore.setState({ orders: [], currentOrder: null, currentUserId: null });
      
      // Merge guest cart into server, then refresh cart
      await mergeGuestCartIntoServer();

      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in",
      });

      // ✅ Use redirectTo from variables (not context)
      const redirectTo = variables.redirectTo || "/";
      navigate(redirectTo);
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: async (data) => {
      // Store tokens
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      
      // Store user data in localStorage for orders store
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        queryClient.setQueryData(authKeys.user, data.user);
      }
      
      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: authKeys.user });

      // Merge guest cart into server, then refresh cart
      await mergeGuestCartIntoServer();
      
      toast({
        title: "Account created!",
        description: "Your account has been created successfully",
      });

      // Redirect to home page
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const clearCartEverywhere = () => {
    try {
      // Clear zustand cart state
      useCartStore.setState({ cart: [] });
      // Also call any explicit clear function if present
      const { clearCartLocal } = useCartStore.getState();
      if (clearCartLocal) {
        clearCartLocal();
      }
      // Remove persisted cart storage
      localStorage.removeItem('cart-storage');
    } catch {
      // no-op
    }
  };

  const clearOrdersEverywhere = () => {
    try {
      // Clear zustand orders state
      useOrdersStore.setState({ orders: [], currentOrder: null, currentUserId: null });
      // Remove persisted orders storage
      localStorage.removeItem('orders-storage');
    } catch {
      // no-op
    }
  };

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Remove tokens and user data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Clear cart and orders
      clearCartEverywhere();
      clearOrdersEverywhere();
      
      // Clear user data from cache
      queryClient.setQueryData(authKeys.user, null);
      
      // Invalidate all queries
      queryClient.clear();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });

      // Redirect to home page
      navigate('/');
    },
    onError: () => {
      // Even if logout fails on server, clear local data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Clear cart and orders
      clearCartEverywhere();
      clearOrdersEverywhere();
      
      queryClient.setQueryData(authKeys.user, null);
      queryClient.clear();
      
      toast({
        title: "Logged out",
        description: "You have been logged out",
      });

      // Redirect to home page
      navigate('/');
    },
  });
};

// Refresh token mutation
export const useRefreshToken = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: RefreshTokenData) => authApi.refreshToken(data),
    onSuccess: (data) => {
      // Store new access token
      localStorage.setItem('accessToken', data.access);
      
      toast({
        title: "Session refreshed",
        description: "Your session has been refreshed",
      });
    },
    onError: () => {
      // Clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.setQueryData(authKeys.user, null);
      queryClient.clear();
      
      toast({
        title: "Session expired",
        description: "Please log in again",
        variant: "destructive",
      });
    },
  });
};

// Verify token mutation
export const useVerifyToken = () => {
  return useMutation({
    mutationFn: (data: VerifyTokenData) => authApi.verifyToken(data),
  });
};

// Check if user is authenticated
export const useIsAuthenticated = () => {
  const { data: user, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}; 