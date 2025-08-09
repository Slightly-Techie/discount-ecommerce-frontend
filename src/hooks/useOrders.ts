import { useQuery } from "@tanstack/react-query";
import { orderApi } from "@/lib/api";

export const ordersKey = ["orders"] as const;

export const useOrders = () => {
  return useQuery({
    queryKey: ordersKey,
    queryFn: () => orderApi.getOrders(),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
};

export const useOrder = (orderId: string | undefined) => {
  return useQuery({
    queryKey: [...ordersKey, orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const data = await orderApi.getOrder(orderId);
      return data ?? null;
    },
    enabled: !!orderId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    initialData: null,
  });
}; 