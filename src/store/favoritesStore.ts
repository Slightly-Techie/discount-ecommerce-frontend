import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types/product";

interface FavoriteItem {
  product: Product;
  addedAt: string;
}

interface FavoritesState {
  favoritesByUser: Record<string, FavoriteItem[]>;
  activeUserKey: string; // 'guest' or user id
  setActiveUserKey: (userKey: string) => void;
  getActiveUserKey: () => string;
  getFavorites: () => Product[];
  getFavoriteIds: () => string[];
  getCount: () => number;
  isFavorite: (productId: string) => boolean;
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
  mergeGuestIntoUser: (userId: string) => void;
}

const GUEST_KEY = 'guest';

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoritesByUser: {},
      activeUserKey: localStorage.getItem('activeFavoritesUserId') || GUEST_KEY,

      setActiveUserKey: (userKey: string) => {
        localStorage.setItem('activeFavoritesUserId', userKey || GUEST_KEY);
        set({ activeUserKey: userKey || GUEST_KEY });
      },

      getActiveUserKey: () => {
        const current = get().activeUserKey || localStorage.getItem('activeFavoritesUserId') || GUEST_KEY;
        return current;
      },

      getFavorites: () => {
        const key = get().getActiveUserKey();
        const items = get().favoritesByUser[key] || [];
        return items.map((i) => i.product);
      },

      getFavoriteIds: () => {
        return get().getFavorites().map((p) => p.id);
      },

      getCount: () => {
        return get().getFavoriteIds().length;
      },

      isFavorite: (productId: string) => {
        return get().getFavoriteIds().includes(productId);
      },

      addFavorite: (product: Product) => {
        const key = get().getActiveUserKey();
        set((state) => {
          const list = state.favoritesByUser[key] || [];
          if (list.some((i) => i.product.id === product.id)) {
            return state;
          }
          const updated = [...list, { product, addedAt: new Date().toISOString() }];
          return { favoritesByUser: { ...state.favoritesByUser, [key]: updated } };
        });
      },

      removeFavorite: (productId: string) => {
        const key = get().getActiveUserKey();
        set((state) => {
          const list = state.favoritesByUser[key] || [];
          const updated = list.filter((i) => i.product.id !== productId);
          return { favoritesByUser: { ...state.favoritesByUser, [key]: updated } };
        });
      },

      clearFavorites: () => {
        const key = get().getActiveUserKey();
        set((state) => ({
          favoritesByUser: { ...state.favoritesByUser, [key]: [] },
        }));
      },

      mergeGuestIntoUser: (userId: string) => {
        set((state) => {
          const guestList = state.favoritesByUser[GUEST_KEY] || [];
          const userList = state.favoritesByUser[userId] || [];
          const existingIds = new Set(userList.map((i) => i.product.id));
          const merged = [
            ...userList,
            ...guestList.filter((i) => !existingIds.has(i.product.id)),
          ];
          const updated = { ...state.favoritesByUser, [userId]: merged, [GUEST_KEY]: [] };
          localStorage.setItem('activeFavoritesUserId', userId);
          return { favoritesByUser: updated, activeUserKey: userId };
        });
      },
    }),
    {
      name: 'favorites-storage',
      partialize: (state) => ({
        favoritesByUser: state.favoritesByUser,
        activeUserKey: state.activeUserKey,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.favoritesByUser || typeof state.favoritesByUser !== 'object') {
            state.favoritesByUser = {} as any;
          }
          if (!state.activeUserKey) {
            state.activeUserKey = localStorage.getItem('activeFavoritesUserId') || GUEST_KEY;
          }
        }
      },
    }
  )
); 