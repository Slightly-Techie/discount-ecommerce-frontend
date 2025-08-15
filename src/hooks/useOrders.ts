import { useEffect } from "react";
import { useOrdersStore } from "@/store/ordersStore";
import { useUserStore } from "@/store/userStore";

export const useOrders = () => {
  const { 
    orders, 
    isLoading, 
    fetchOrders 
  } = useOrdersStore();

  useEffect(() => {
    console.log('useOrders hook - orders.length:', orders.length);
    console.log('useOrders hook - current orders:', orders);
    
    // Always fetch orders to ensure we have the latest data
    // This ensures new orders are visible immediately
    fetchOrders();
  }, [fetchOrders]);

  return {
    data: orders,
    isLoading,
    error: null, // Store handles errors internally
    refetch: fetchOrders
  };
};

export const useOrder = (orderId: string | undefined) => {
  const { 
    currentOrder,
    isLoading: isUpdating,
    fetchOrder,
    getOrderById
  } = useOrdersStore();

  useEffect(() => {
    if (orderId) {
      // First check if we have it in cache
      const cachedOrder = getOrderById(orderId);
      if (!cachedOrder) {
        // Only fetch if not in cache
        fetchOrder(orderId);
      }
    }
  }, [orderId, fetchOrder, getOrderById]);

  const order = orderId ? getOrderById(orderId) : null;
  const isLoading = !order && isUpdating;

  return {
    data: order,
    isLoading,
    error: null, // Store handles errors internally
    refetch: () => orderId ? fetchOrder(orderId) : Promise.resolve(null)
  };
}; 