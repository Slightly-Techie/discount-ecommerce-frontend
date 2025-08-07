// src/store/cartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types/product";
import { cartApi, productApi } from "@/lib/api";
import { AddToCartData, UpdateCartItemData, CartItemResponse } from "@/types";

export interface CartItem {
  product: Product;
  quantity: number;
  price?: string;
  id?: string;
}

interface CartState {
  cart: CartItem[];
  isLoading: boolean;
  fetchCart: (products?: Product[]) => Promise<void>;
  addToCart: (data: AddToCartData) => Promise<void>;
  updateCartItem: (data: UpdateCartItemData) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItemCount: () => number;
  addToCartLocal: (product: Product, quantity?: number) => void;
  updateCartItemLocal: (productId: string, quantity: number) => void;
  removeFromCartLocal: (productId: string) => void;
  clearCartLocal: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      isLoading: false,

      fetchCart: async (products?: Product[]) => {
        set({ isLoading: true });
      
        try {
          const accessToken = localStorage.getItem('accessToken');
      
          if (accessToken) {
            const cartResponse = await cartApi.getCart();
            console.log('Cart API response:', cartResponse);
      
            if (cartResponse && Array.isArray(cartResponse)) {
              const cartItemsWithProducts = cartResponse.map((cartItem: CartItemResponse) => {
                const matchedProduct = products?.find(p => p.id === cartItem.product);
      
                return {
                  product: matchedProduct || {
                    id: cartItem.product,
                    name: 'Product not found',
                    description: 'This product is no longer available',
                    price: cartItem.price,
                    discount_price: cartItem.price,
                    image_url: 'https://via.placeholder.com/150?text=Not+Found',
                    category: { id: '', name: '', slug: '', description: '' },
                    tags: [],
                    status: 'inactive' as const,
                    is_available: false,
                    is_featured: false,
                    stock: 0,
                    brand: 'Unknown',
                    rating: 0
                  },
                  quantity: cartItem.quantity,
                  price: cartItem.price,
                  id: cartItem.id
                } as CartItem;
              });
      
              set({ cart: cartItemsWithProducts });
            } else {
              console.log('API returned empty or invalid response, setting empty cart');
              set({ cart: [] });
            }
          } else {
            console.log('User not authenticated, using local cart');
            const currentCart = get().cart;
            if (!currentCart || !Array.isArray(currentCart)) {
              set({ cart: [] });
            }
          }
        } catch (error) {
          console.error('Error fetching cart:', error);
          const currentCart = get().cart;
          if (!currentCart || !Array.isArray(currentCart)) {
            set({ cart: [] });
          }
        } finally {
          set({ isLoading: false });
        }
      },
      

      addToCart: async (data) => {
        try {
          const accessToken = localStorage.getItem('accessToken');
          
          if (accessToken) {
            // User is authenticated, use API
            // console.log('Adding to cart via API:', data);
            const newCartItem = await cartApi.addToCart(data);
            // console.log("New cart item from API:", newCartItem);
            
            set((state) => {
              // console.log('Current cart state before update:', state.cart);
              const existingItemIndex = state.cart.findIndex(
                item => item?.product?.id === data.product
              );
              console.log('Existing item index:', existingItemIndex);
              
              if (existingItemIndex >= 0) {
                // Update existing item quantity
                const updatedCart = [...state.cart];
                updatedCart[existingItemIndex] = {
                  ...updatedCart[existingItemIndex],
                  quantity: updatedCart[existingItemIndex].quantity + data.quantity
                };
                console.log('Updated existing item in cart:', updatedCart);
                return { cart: updatedCart };
              } else {
                // For new items, we need to fetch the product details
                // For now, we'll refresh the entire cart to get the updated data
                console.log('New item added, will refresh cart to get product details');
                return { cart: state.cart };
              }
            });
            
            // After adding to cart, refresh the cart to get the updated data with product details
            console.log('Refreshing cart after adding item...');
            setTimeout(() => {
              get().fetchCart();
            }, 100);
          } else {
            // User is not authenticated, use local storage
            console.log('User not authenticated, using local cart storage');
            // Note: For authenticated users, we should use the API, not local storage
            // This branch should not be reached for authenticated users
          }
        } catch (error) {
          console.error("Error adding to cart:", error);
          throw error;
        }
      },

      updateCartItem: async (data) => {
        try {
          const accessToken = localStorage.getItem('accessToken');
          
          if (accessToken) {
            // User is authenticated, use API
            const updatedItem = await cartApi.updateCartItem(data);
            set((state) => ({
              cart: state.cart.map((item) =>
                item.product.id === data.product ? updatedItem : item
              ),
            }));
          } else {
            // User is not authenticated, use local storage
            console.log('User not authenticated, using local cart storage');
          }
        } catch (error) {
          console.error('Error updating cart item:', error);
          throw error;
        }
      },

      removeFromCart: async (productId) => {
        try {
          const accessToken = localStorage.getItem('accessToken');
          
          if (accessToken) {
            // User is authenticated, use API
            await cartApi.removeFromCart(productId);
          }
          
          // Always update local state
          set((state) => ({
            cart: state.cart.filter((item) => item.product.id !== productId),
          }));
        } catch (error) {
          console.error('Error removing cart item:', error);
          throw error;
        }
      },

      clearCart: async () => {
        try {
          const accessToken = localStorage.getItem('accessToken');
          
          if (accessToken) {
            // User is authenticated, use API
            await cartApi.clearCart();
          }
          
          // Always update local state
          set({ cart: [] });
        } catch (error) {
          console.error('Error clearing cart:', error);
          throw error;
        }
      },

      getCartItemCount: () => {
        const cart = get().cart;
        if (!cart || !Array.isArray(cart)) {
          return 0;
        }
        console.log('Calculating cart count for items:', cart);
        const total = cart.reduce((total, item) => {
          const quantity = item?.quantity || 0;
          console.log(`Item ${item?.product?.name}: quantity = ${quantity}`);
          return total + quantity;
        }, 0);
        console.log('Total cart count:', total);
        return total;
      },

      // Local storage methods for non-authenticated users
      addToCartLocal: (product: Product, quantity = 1) => {
        set((state) => {
          const existingItemIndex = state.cart.findIndex(
            item => item.product.id === product.id
          );
          
          if (existingItemIndex >= 0) {
            // Update existing item quantity
            const updatedCart = [...state.cart];
            updatedCart[existingItemIndex] = {
              ...updatedCart[existingItemIndex],
              quantity: updatedCart[existingItemIndex].quantity + quantity
            };
            return { cart: updatedCart };
          } else {
            // Add new item
            return { cart: [...state.cart, { product, quantity }] };
          }
        });
      },

      updateCartItemLocal: (productId: string, quantity: number) => {
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      removeFromCartLocal: (productId: string) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        }));
      },

      clearCartLocal: () => {
        set({ cart: [] });
      },
    }),
    {
      name: 'cart-storage', // unique name for localStorage key
      partialize: (state) => ({ cart: state.cart || [] }), // only persist cart data
      onRehydrateStorage: () => (state) => {
        // Ensure cart is always an array when rehydrating
        if (state && (!state.cart || !Array.isArray(state.cart))) {
          state.cart = [];
        }
      },
    }
  )
);