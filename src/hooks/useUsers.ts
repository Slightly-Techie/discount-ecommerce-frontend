import { userApi } from "@/lib/api";
import { User } from "@/types";
import { useQuery, useMutation, UseQueryOptions } from "@tanstack/react-query";

// hooks/useUsers.ts
export const useUsers = () => {
  return useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: () => userApi.getUsers(), // Your backend should expose this for admins
    onError: () => {
      console.error("Failed to fetch users");
    },
    onSuccess: () => {
      console.log("Users fetched successfully");
    },
  } as UseQueryOptions<User[], Error> // 👈 This fixes the TS error
);
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

// export const useUpdateUserRole = () => {
//   return useMutation({
//     mutationFn: ({ id, role }: { id: string; role: string }) =>
//       userApi.updateUserRole(id, role),
//     ...
//   });
// };
