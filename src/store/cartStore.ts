// src/store/cartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types/product";
import { cartApi, productApi } from "@/lib/api";
import { AddToCartData, UpdateCartItemData, CartItemResponse } from "@/types";

export interface CartStoreItem {
  product: Product;
  quantity: number;
  price?: string;
  id?: string;
}

interface CartState {
  cart: CartStoreItem[];
  cartId?: string; // Track the cart ID for API calls
  isLoading: boolean;
  isUpdating: boolean; // New state for individual item updates
  fetchCart: () => Promise<void>;
  addToCart: (data: AddToCartData) => Promise<void>;
  updateCartItem: (cartItemId: string, productId: string, quantity: number) => Promise<void>;
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
      isUpdating: false,

      fetchCart: async () => {
        set({ isLoading: true });
      
        try {
          const accessToken = localStorage.getItem('accessToken');
      
          if (accessToken) {
            const cartResponse = await cartApi.getCart();
            console.log('Cart API response:', cartResponse);
      
            if (cartResponse && Array.isArray(cartResponse)) {
              // Now the cart response already contains the full product objects
              const cartItems = cartResponse.map((cartItem: CartItemResponse) => ({
                product: cartItem.product, // Direct access to the product object
                quantity: cartItem.quantity,
                price: cartItem.price,
                id: cartItem.id
              } as CartStoreItem));
      
              // Extract cart ID from the first item (all items should have the same cart ID)
              const cartId = cartResponse.length > 0 ? cartResponse[0].cart : undefined;
              
              set({ cart: cartItems, cartId });
            } else {
              console.log('API returned empty or invalid response, setting empty cart');
              set({ cart: [], cartId: undefined });
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
            set({ cart: [], cartId: undefined });
          }
        } finally {
          set({ isLoading: false });
        }
      },
      

      addToCart: async (data) => {
        set({ isUpdating: true });
        try {
          const accessToken = localStorage.getItem('accessToken');
          
          if (accessToken) {
            // Call API first to avoid duplicate local increments
            await cartApi.addToCart(data);
            // Refresh cart from server to ensure accuracy
            await get().fetchCart();
          } else {
            // User is not authenticated, use local storage
            console.log('User not authenticated, using local cart storage');
          }
        } catch (error) {
          console.error("Error adding to cart:", error);
          throw error;
        } finally {
          set({ isUpdating: false });
        }
      },

      updateCartItem: async (cartItemId: string, productId: string, quantity: number) => {
        set({ isUpdating: true }); // Set updating state
        
        try {
          const accessToken = localStorage.getItem('accessToken');
          
          if (accessToken) {
            // Optimistic update - update UI immediately
            set((state) => {
              const updatedCart = state.cart.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
              );
              return { cart: updatedCart };
            });
            
            // User is authenticated, use API
            const updatedItem = await cartApi.updateCartItem({
              cartItemId,
              product: productId,
              quantity
            });
            console.log('Updated item from API:', updatedItem);
            
            // Refresh cart to ensure server state is synced
            await get().fetchCart();
          } else {
            // User is not authenticated, use local storage
            console.log('User not authenticated, using local cart storage');
            get().updateCartItemLocal(productId, quantity);
          }
        } catch (error) {
          console.error('Error updating cart item:', error);
          // Revert optimistic update on error
          await get().fetchCart();
          throw error;
        } finally {
          set({ isUpdating: false }); // Clear updating state
        }
      },

      removeFromCart: async (productId) => {
        console.log('removeFromCart called with productId:', productId);
        set({ isUpdating: true }); // Set updating state
        
        try {
          const accessToken = localStorage.getItem('accessToken');
          console.log('Access token exists:', !!accessToken);
          
          if (accessToken) {
            // Optimistic update - remove from UI immediately
            set((state) => {
              const newCart = state.cart.filter((item) => item.product.id !== productId);
              console.log('Optimistic update - cart items after removal:', newCart.length);
              return { cart: newCart };
            });
            
            // User is authenticated, use API
            // Find the cart item to get its ID
            const cartItem = get().cart.find(item => item.product.id === productId);
            console.log('Found cart item for removal:', cartItem);
            
            if (!cartItem || !cartItem.id) {
              throw new Error('Cart item not found or missing ID');
            }
            
            console.log('Calling API to remove cart item:', cartItem.id);
            await cartApi.removeFromCart(cartItem.id);
            console.log('API call successful');
            
            // Refresh cart data to ensure local state is in sync with server
            console.log('Refreshing cart after successful removal...');
            await get().fetchCart();
          } else {
            // Always update local state for non-authenticated users
            set((state) => {
              const newCart = state.cart.filter((item) => item.product.id !== productId);
              console.log('Local update - cart items after removal:', newCart.length);
              return { cart: newCart };
            });
          }
        } catch (error) {
          console.error('Error removing cart item:', error);
          // Revert optimistic update on error
          await get().fetchCart();
          throw error;
        } finally {
          set({ isUpdating: false }); // Clear updating state
        }
      },

      removeFromCartById: async (cartItemId: string) => {
        console.log('removeFromCartById called with cartItemId:', cartItemId);
        set({ isUpdating: true }); // Set updating state
        
        try {
          const accessToken = localStorage.getItem('accessToken');
          console.log('Access token exists:', !!accessToken);
          
          if (accessToken) {
            // Optimistic update - remove from UI immediately
            set((state) => {
              const newCart = state.cart.filter((item) => item.id !== cartItemId);
              console.log('Optimistic update by ID - cart items after removal:', newCart.length);
              return { cart: newCart };
            });
            
            // User is authenticated, use API
            console.log('Calling API to remove cart item by ID:', cartItemId);
            await cartApi.removeFromCart(cartItemId);
            console.log('API call successful');
            
            // Refresh cart data to ensure local state is in sync with server
            console.log('Refreshing cart after successful removal by ID...');
            await get().fetchCart();
          } else {
            // For non-authenticated users, find by cart item ID and remove
            set((state) => {
              const newCart = state.cart.filter((item) => item.id !== cartItemId);
              console.log('Local update by ID - cart items after removal:', newCart.length);
              return { cart: newCart };
            });
          }
        } catch (error) {
          console.error('Error removing cart item by ID:', error);
          // Revert optimistic update on error
          await get().fetchCart();
          throw error;
        } finally {
          set({ isUpdating: false }); // Clear updating state
        }
      },

      clearCart: async () => {
        try {
          const accessToken = localStorage.getItem('accessToken');
          
          // Clear local state immediately for better UX
          set({ cart: [], cartId: undefined });
          
          if (accessToken) {
            // User is authenticated, try to clear on server
            const cartId = get().cartId;
            if (cartId) {
              try {
                await cartApi.clearCart(cartId);
                console.log('Cart cleared successfully on server');
              } catch (error) {
                console.error('Error clearing cart on server:', error);
                // Try fallback method - clear by removing individual items
                try {
                  await cartApi.clearCartByItems();
                  console.log('Cart cleared using fallback method');
                } catch (fallbackError) {
                  console.error('Fallback cart clearing also failed:', fallbackError);
                  // Don't throw error - local state is already cleared
                  // The cart will be re-synced on next fetch
                }
              }
            }
          }
        } catch (error) {
          console.error('Error in clearCart:', error);
          // Don't throw error - local state is already cleared
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
            item => item.product.id === product?.id
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
        set((state) => {
          const updatedCart = state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          );
          console.log('Cart store - Updated local cart state:', updatedCart);
          return { cart: updatedCart };
        });
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