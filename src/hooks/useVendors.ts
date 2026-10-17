import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api';
import { ADMIN_PAGE_SIZE } from '@/components/admin/shared';
import type {
  CreateVendorPayload,
  CreateVendorResponse,
  VendorRequestPayload,
  VendorRequestStatus,
  VendorUpdatePayload,
} from '@/types/api';
import { apiErrorMessage } from '@/lib/apiErrors';
import { useToast } from './use-toast';

export const vendorKeys = {
  all: ['vendors'] as const,
  list: () => [...vendorKeys.all, 'list'] as const,
  detail: (id: string) => [...vendorKeys.all, id] as const,
  me: () => [...vendorKeys.all, 'me'] as const,
  requests: () => [...vendorKeys.all, 'requests'] as const,
};

export const useSubmitVendorRequest = () =>
  useMutation({
    mutationFn: (data: VendorRequestPayload) => vendorsApi.submitRequest(data),
  });

export const useVendorMe = (enabled: boolean = true, pollUntilApproved: boolean = false) => {
  return useQuery({
    queryKey: vendorKeys.me(),
    queryFn: vendorsApi.getVendorMe,
    staleTime: 2 * 60 * 1000,
    retry: false,
    enabled,
    // While awaiting approval, re-check every 30s so the dashboard unlocks without a reload
    refetchInterval: pollUntilApproved
      ? (query) => (query.state.data && query.state.data.status !== 'approved' ? 30 * 1000 : false)
      : false,
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

// Admin approval actions. Each one refreshes vendor lists, admin stats and notifications.
type VendorAction = 'approve' | 'reject' | 'suspend';

const VENDOR_ACTION_LABELS: Record<VendorAction, string> = {
  approve: 'approved',
  reject: 'rejected',
  suspend: 'suspended',
};

export const useVendorAction = (action: VendorAction) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; name?: string; reason?: string }) => {
      if (action === 'approve') return vendorsApi.approveVendor(id);
      if (action === 'reject') return vendorsApi.rejectVendor(id, reason);
      return vendorsApi.suspendVendor(id);
    },
    onSuccess: (_data, { name }) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: `Vendor ${VENDOR_ACTION_LABELS[action]}`,
        description: name
          ? `${name} has been ${VENDOR_ACTION_LABELS[action]} and notified.`
          : undefined,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Action failed',
        description: error?.response?.data?.detail || 'Unable to update vendor status. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Admin: create a vendor (optionally from a seller request) and email the owner an invite link.
export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateVendorPayload | FormData) => vendorsApi.createVendor(data),
    onSuccess: (created: CreateVendorResponse) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      if (created.invite_sent) {
        toast({
          title: 'Vendor created',
          description: `Vendor created. Invite sent to ${created.owners?.[0]?.email ?? 'the owner'}.`,
        });
      } else {
        toast({
          title: 'Vendor created',
          description: 'Vendor created, but the invite email failed. Use Resend invite.',
          variant: 'destructive',
        });
      }
    },
  });
};

export const useResendInvite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string; name?: string }) => vendorsApi.resendInvite(id),
    onSuccess: ({ invite_sent }) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      toast(
        invite_sent
          ? { title: 'Invite sent' }
          : {
              title: 'Invite email failed',
              description: 'The invite email could not be sent. Try again shortly.',
              variant: 'destructive',
            }
      );
    },
    onError: (error) =>
      toast({
        title: 'Could not resend invite',
        description: apiErrorMessage(error),
        variant: 'destructive',
      }),
  });
};

export const useVendorRequests = (params: { status?: VendorRequestStatus; page?: number } = {}) =>
  useQuery({
    queryKey: [...vendorKeys.requests(), params],
    queryFn: () => vendorsApi.listRequests({ ...params, page_size: ADMIN_PAGE_SIZE }),
    placeholderData: (previous) => previous,
  });

export const useDismissVendorRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => vendorsApi.dismissRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.requests() });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Request dismissed' });
    },
    onError: (error) =>
      toast({
        title: 'Could not dismiss request',
        description: apiErrorMessage(error),
        variant: 'destructive',
      }),
  });
};
