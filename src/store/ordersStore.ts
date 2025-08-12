// src/store/ordersStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { orderApi, authApi } from "@/lib/api";

export interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    image_url: string;
    price: string;
    discount_price?: string;
  };
  quantity: number;
  price: string;
  total: string;
}

export interface Order {
  id: string;
  user: string;
  status: 'pending' | 'completed' | 'cancelled' | 'processing';
  total: string;
  discount?: string;
  tax?: string;
  shipping?: string;
  items: OrderItem[];
  address?: any;
  coupon?: any;
  checked_out_at: string;
  created_at: string;
  updated_at: string;
}

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  currentUserId: string | null;
  isLoading: boolean;
  isUpdating: boolean;
  
  // Actions
  fetchOrders: (currentUserId?: string) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<Order | null>;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  clearOrders: () => void;
  setCurrentUser: (userId: string | null) => void;
  
  // Selectors
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByStatus: (status: Order['status']) => Order[];
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      currentUserId: null,
      isLoading: false,
      isUpdating: false,

      fetchOrders: async (currentUserId?: string) => {
        set({ isLoading: true });
        try {
          const accessToken = localStorage.getItem('accessToken');
          if (!accessToken) {
            console.log('No access token, skipping orders fetch');
            return;
          }

          // Get current user from API if not provided
          let userId = currentUserId;
          if (!userId) {
            try {
              console.log('Fetching current user from API...');
              const currentUser = await authApi.getCurrentUser();
              console.log('Current user from API:', currentUser);
              userId = currentUser.id;
            } catch (userError) {
              console.error('Error fetching current user:', userError);
              return;
            }
          }

          console.log('Current user ID for filtering:', userId);
          console.log('Fetching all orders from API...');
          const allOrders = await orderApi.getOrders();
          console.log('All orders fetched:', allOrders);
          console.log('Number of orders fetched:', allOrders.length);
          
          // Filter orders to only show current user's orders
          const userOrders = allOrders.filter((order: Order) => {
            console.log(`Comparing order.user (${order.user}) with currentUserId (${userId})`);
            console.log('Order details:', { id: order.id, user: order.user, status: order.status });
            return order.user === userId;
          });
          console.log('Filtered orders for current user:', userOrders);
          console.log('Number of user orders:', userOrders.length);
          
          set({ orders: userOrders || [], currentUserId: userId });
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchOrder: async (orderId: string): Promise<Order | null> => {
        // First check if we have it in cache
        const cachedOrder = get().getOrderById(orderId);
        if (cachedOrder) {
          console.log('Order found in cache:', cachedOrder);
          set({ currentOrder: cachedOrder });
          return cachedOrder;
        }

        set({ isUpdating: true });
        try {
          const accessToken = localStorage.getItem('accessToken');
          if (!accessToken) {
            console.log('No access token, cannot fetch order');
            return null;
          }

          console.log('Fetching order from API:', orderId);
          const order = await orderApi.getOrder(orderId);
          console.log('Order fetched from API:', order);
          
          if (order) {
            // Add to orders array if not already there
            const existingOrder = get().orders.find(o => o.id === order.id);
            if (!existingOrder) {
              set(state => ({ 
                orders: [...state.orders, order],
                currentOrder: order 
              }));
            } else {
              set({ currentOrder: order });
            }
            return order;
          }
          return null;
        } catch (error) {
          console.error('Error fetching order:', error);
          return null;
        } finally {
          set({ isUpdating: false });
        }
      },

      addOrder: (order: Order) => {
        console.log('Adding order to store:', order);
        console.log('Current user ID in store:', get().currentUserId);
        
        set(state => {
          // If we don't have a currentUserId set, try to get it from the order
          let currentUserId = state.currentUserId;
          if (!currentUserId && order.user) {
            currentUserId = order.user;
            console.log('Setting currentUserId from order:', currentUserId);
          }

          // Only add order if it belongs to current user (or if we don't have a currentUserId yet)
          if (currentUserId && order.user !== currentUserId) {
            console.log('Order does not belong to current user, skipping add');
            console.log('Order user:', order.user, 'Current user:', currentUserId);
            return state;
          }

          const existingOrder = state.orders.find(o => o.id === order.id);
          if (existingOrder) {
            console.log('Updating existing order:', order.id);
            // Update existing order
            const updatedOrders = state.orders.map(o => 
              o.id === order.id ? order : o
            );
            return { 
              orders: updatedOrders,
              currentOrder: order,
              currentUserId: currentUserId || state.currentUserId
            };
          } else {
            console.log('Adding new order:', order.id);
            // Add new order
            return { 
              orders: [order, ...state.orders],
              currentOrder: order,
              currentUserId: currentUserId || state.currentUserId
            };
          }
        });
      },

      updateOrder: (orderId: string, updates: Partial<Order>) => {
        set(state => {
          const updatedOrders = state.orders.map(order => 
            order.id === orderId ? { ...order, ...updates } : order
          );
          
          const updatedCurrentOrder = state.currentOrder?.id === orderId 
            ? { ...state.currentOrder, ...updates }
            : state.currentOrder;

          return { 
            orders: updatedOrders,
            currentOrder: updatedCurrentOrder 
          };
        });
      },

      clearOrders: () => {
        set({ orders: [], currentOrder: null });
      },

      setCurrentUser: (userId: string | null) => {
        const currentUserId = get().currentUserId;
        if (currentUserId !== userId) {
          // Clear orders when user changes
          set({ orders: [], currentOrder: null, currentUserId: userId });
        }
      },

      // Selectors
      getOrderById: (orderId: string) => {
        return get().orders.find(order => order.id === orderId);
      },

      getOrdersByStatus: (status: Order['status']) => {
        return get().orders.filter(order => order.status === status);
      },
    }),
    {
      name: 'orders-storage',
      partialize: (state) => ({ 
        orders: state.orders,
        currentOrder: state.currentOrder,
        currentUserId: state.currentUserId
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure orders is always an array
          if (!state.orders || !Array.isArray(state.orders)) {
            state.orders = [];
          }
          // Clear currentOrder on rehydration to avoid stale data
          state.currentOrder = null;
          // Clear currentUserId on rehydration
          state.currentUserId = null;
        }
      },
    }
  )
); 