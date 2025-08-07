// src/store/cartStore.ts
import { create } from "zustand";
import { Product } from "@/types/product";
import { cartApi } from "@/lib/api";
import { AddToCartData, UpdateCartItemData } from "@/types";

export interface CartItem {
  product: Product;
  quantity: number;
}


interface CartState {
  cart: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (data: AddToCartData) => Promise<void>;
  updateCartItem: (data: UpdateCartItemData) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await cartApi.getCart();
      set({ cart });
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      set({ isLoading: false });
    }
  },

addToCart: async (data) => {
  try {
    const newItem = await cartApi.addToCart(data);
    console.log("New cart item:", newItem);
    console.log("Current cart before add:", get().cart);
    
    // Check if current cart is actually an array
    if (!Array.isArray(get().cart)) {
      throw new Error("Cart is not an array");
    }

    set({ cart: [...get().cart, newItem] });
  } catch (error) {
    console.error("Error adding to cart:", error);
  }
},


  updateCartItem: async (data) => {
    try {
      const updatedItem = await cartApi.updateCartItem(data);
      set({
        cart: get().cart.map((item) =>
          item.product.id === updatedItem.product.id ? updatedItem : item
        ),
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  },

  removeFromCart: async (productId) => {
    try {
      await cartApi.removeFromCart(productId);
      set({
        cart: get().cart.filter((item) => item.product.id !== productId),
      });
    } catch (error) {
      console.error('Error removing cart item:', error);
    }
  },

  clearCart: async () => {
    try {
      await cartApi.clearCart();
      set({ cart: [] });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },
}));