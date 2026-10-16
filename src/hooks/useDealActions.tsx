import { useNavigate } from "react-router-dom";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import type { Product } from "@/types/product";

// Cart and save actions shared by every deal card and the product page.
// Signed-out shoppers use the local cart and device favourites, which merge on sign-in.
export function useDealActions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const addToCart = useCartStore((s) => s.addToCart);
  const addToCartLocal = useCartStore((s) => s.addToCartLocal);
  const addFavorite = useFavoritesStore((s) => s.addFavorite);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  // Subscribe to the active list itself so cards re-render when it changes.
  const savedItems = useFavoritesStore((s) => s.favoritesByUser[s.activeUserKey]);
  const isSaved = (productId: string) => (savedItems || []).some((i) => i.product.id === productId);

  const add = async (product: Product, quantity = 1): Promise<boolean> => {
    try {
      if (localStorage.getItem("accessToken")) {
        await addToCart({ product: product.id, quantity });
      } else {
        addToCartLocal(product, quantity);
      }
      toast({
        title: "Added to cart",
        action: (
          <ToastAction altText="View cart" onClick={() => navigate("/cart")}>
            View cart
          </ToastAction>
        ),
      });
      return true;
    } catch {
      toast({
        title: "Couldn't add to cart",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleSave = (product: Product) => {
    if (isSaved(product.id)) {
      removeFavorite(product.id);
      toast({
        title: "Removed from saved",
        action: (
          <ToastAction altText="Undo" onClick={() => addFavorite(product)}>
            Undo
          </ToastAction>
        ),
      });
    } else {
      addFavorite(product);
      toast({
        title: "Saved",
        action: (
          <ToastAction altText="Undo" onClick={() => removeFavorite(product.id)}>
            Undo
          </ToastAction>
        ),
      });
    }
  };

  return { add, toggleSave, isSaved };
}
