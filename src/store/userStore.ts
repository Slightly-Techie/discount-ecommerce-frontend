// src/store/userStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userApi } from "@/lib/api";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  phonenumber: string;
  date_of_birth?: string;
  gender?: string;
  role: string;
  profile?: {
    id: string;
    bio?: string;
    website?: string;
    profile_image?: string;
  };
  addresses?: any[];
  created_at: string;
  updated_at: string;
}

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  isUpdating: boolean;
  
  // Actions
  fetchUser: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  updateProfile: (profileId: string, updates: any) => Promise<void>;
  clearUser: () => void;
  
  // Selectors
  getUser: () => UserProfile | null;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isUpdating: false,

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const accessToken = localStorage.getItem('accessToken');
          if (!accessToken) {
            console.log('No access token, skipping user fetch');
            return;
          }

          console.log('Fetching user from API...');
          // This would need to be implemented in the API
          // const user = await userApi.getCurrentUser();
          // set({ user });
        } catch (error) {
          console.error('Error fetching user:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateUser: async (updates: Partial<UserProfile>) => {
        set({ isUpdating: true });
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('No user to update');
          }

          // Update local state immediately for optimistic updates
          set(state => ({
            user: state.user ? { ...state.user, ...updates } : null
          }));

          // API call would go here
          // await userApi.updateCurrentUser(currentUser.id, updates);
        } catch (error) {
          console.error('Error updating user:', error);
          // Revert optimistic update on error
          await get().fetchUser();
        } finally {
          set({ isUpdating: false });
        }
      },

      updateProfile: async (profileId: string, updates: any) => {
        set({ isUpdating: true });
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('No user to update');
          }

          // Update local state immediately for optimistic updates
          set(state => ({
            user: state.user ? {
              ...state.user,
              profile: state.user.profile ? {
                ...state.user.profile,
                ...updates
              } : updates
            } : null
          }));

          // API call would go here
          // await userApi.updateProfile(profileId, updates);
        } catch (error) {
          console.error('Error updating profile:', error);
          // Revert optimistic update on error
          await get().fetchUser();
        } finally {
          set({ isUpdating: false });
        }
      },

      clearUser: () => {
        set({ user: null });
      },

      // Selectors
      getUser: () => {
        return get().user;
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Clear user on rehydration to avoid stale data
          state.user = null;
        }
      },
    }
  )
); 