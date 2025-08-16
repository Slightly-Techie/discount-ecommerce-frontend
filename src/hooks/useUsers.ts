import { userApi } from "@/lib/api";
import { User } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/hooks/useAuth";

// hooks/useUsers.ts
export const useUsers = () => {
  return useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: () => userApi.getUsers(),
    onError: () => {
      console.error("Failed to fetch users");
    },
    onSuccess: () => {
      console.log("Users fetched successfully");
    },
  });
};

export const useUpdateCurrentUser = () => {
  return useMutation<any, Error, { id: string; payload: any }>({
    mutationFn: ({ id, payload }) => userApi.updateCurrentUser(id, payload),
  });
};

export const useUpdateProfile = () => {
  return useMutation<any, Error, { profileId: string; payload: { bio?: string | null; website?: string | null } }>({
    mutationFn: ({ profileId, payload }) => userApi.updateProfile(profileId, payload),
  });
};

export const useUpdateProfileMultipart = () => {
  return useMutation<any, Error, { profileId: string; formData: FormData }>({
    mutationFn: ({ profileId, formData }) => userApi.updateProfileMultipart(profileId, formData),
  });
};

export const useCreateAddress = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { line1: string; line2?: string; city: string; state?: string; postal_code?: string; country: string; is_default?: boolean }>({
    mutationFn: (payload) => userApi.createAddress(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.user }),
  });
};

export const useUpdateAddress = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; payload: any }>({
    mutationFn: ({ id, payload }) => userApi.updateAddress(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.user }),
  });
};

export const useDeleteAddress = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => userApi.deleteAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.user }),
  });
};

export const useUpdateUserRole = () => {
  const qc = useQueryClient();
  return useMutation<User, Error, { id: string; role: string }>({
    mutationFn: ({ id, role }) => userApi.updateUserRole(id, role),
    onSuccess: () => {
      // Invalidate users query to refresh the list
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
