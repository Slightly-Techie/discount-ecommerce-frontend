import { useEffect } from "react";
import { useFavoritesStore } from "@/store/favoritesStore";
import { Product } from "@/types/product";
import { useIsAuthenticated } from "@/hooks/useAuth";

export const useFavorites = () => {
  const getFavorites = useFavoritesStore((s) => s.getFavorites);
  const favorites = getFavorites();
  return { data: favorites, isLoading: false } as { data: Product[]; isLoading: boolean };
};

export const useFavoriteHelpers = () => {
  const addFavorite = useFavoritesStore((s) => s.addFavorite);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const getCount = useFavoritesStore((s) => s.getCount);
  return { addFavorite, removeFavorite, isFavorite, getCount };
};

export const useFavoritesAuthBinding = () => {
  const { isAuthenticated, user } = useIsAuthenticated();
  const setActiveUserKey = useFavoritesStore((s) => s.setActiveUserKey);
  const mergeGuestIntoUser = useFavoritesStore((s) => s.mergeGuestIntoUser);

  useEffect(() => {
    const userId = (user as any)?.id;
    if (isAuthenticated && userId) {
      // merge guest favorites into the logged in user and set active key
      mergeGuestIntoUser(userId);
    } else {
      setActiveUserKey('guest');
    }
  }, [isAuthenticated, user, setActiveUserKey, mergeGuestIntoUser]);
}; 