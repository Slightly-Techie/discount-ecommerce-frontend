import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { RegisterData, RefreshTokenData, VerifyTokenData, LoginData } from '@/types/api';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';

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

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: (data, variables) => {
      // Store tokens
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);

      // Update user data in cache if available
      if (data.user) {
        queryClient.setQueryData(authKeys.user, data.user);
      }

      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: authKeys.user });

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
    onSuccess: (data) => {
      // Store tokens
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      
      // Update user data in cache if available
      if (data.user) {
        queryClient.setQueryData(authKeys.user, data.user);
      }
      
      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: authKeys.user });
      
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

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Remove tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
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