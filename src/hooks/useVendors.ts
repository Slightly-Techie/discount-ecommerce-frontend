import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api';
import type { VendorSignupData, VendorUpdatePayload } from '@/types/api';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';

export const vendorKeys = {
  all: ['vendors'] as const,
  list: () => [...vendorKeys.all, 'list'] as const,
  detail: (id: string) => [...vendorKeys.all, id] as const,
  me: () => [...vendorKeys.all, 'me'] as const,
};

export const useVendorSignup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VendorSignupData) => vendorsApi.signup(data),
    onSuccess: () => {
      toast({
        title: 'Vendor registration submitted',
        description:
          'Your vendor account is pending approval. You will be able to log in once an administrator approves your account.',
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      navigate('/login');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.email?.[0] ||
        error?.response?.data?.vendor_name?.[0] ||
        'Vendor registration failed. Please try again.';
      toast({
        title: 'Registration failed',
        description: typeof message === 'string' ? message : JSON.stringify(message),
        variant: 'destructive',
      });
    },
  });
};

export const useVendorMe = (enabled: boolean = true) => {
  return useQuery({
    queryKey: vendorKeys.me(),
    queryFn: vendorsApi.getVendorMe,
    staleTime: 2 * 60 * 1000,
    retry: false,
    enabled,
  });
};

export const useUpdateVendorMe = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: VendorUpdatePayload) => vendorsApi.updateVendorMe(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(vendorKeys.me(), updated);
      toast({
        title: 'Profile updated',
        description: 'Your store profile has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description:
          error?.response?.data?.detail ||
          error?.message ||
          'Could not update your store profile. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

export const useVendorsList = (params?: { page?: number }) => {
  return useQuery({
    queryKey: [...vendorKeys.list(), params],
    queryFn: () => vendorsApi.getVendors(),
  });
};

export const useVendor = (id: string | undefined) => {
  return useQuery({
    queryKey: vendorKeys.detail(id ?? ''),
    queryFn: () => vendorsApi.getVendor(id!),
    enabled: !!id,
  });
};
