import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/lib/api';
import { CartItem, AddToCartData, UpdateCartItemData } from '@/types';
import { useToast } from './use-toast';

// Query keys
export const cartKeys = {
  all: ['cart'] as const,
  items: () => [...cartKeys.all, 'items'] as const,
  item: (productId: string) => [...cartKeys.items(), productId] as const,
};

// Get cart items
export const useCart = () => {
  return useQuery({
    queryKey: cartKeys.items(),
    queryFn: cartApi.getCart,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Add to cart mutation
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: AddToCartData) => cartApi.addToCart(data),
    onMutate: async ({ product_id, quantity }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: cartKeys.items() });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(cartKeys.items());

      // Optimistically update to the new value
      queryClient.setQueryData(cartKeys.items(), (old: CartItem[] = []) => {
        const existingItem = old.find(item => item.product.id === product_id);
        if (existingItem) {
          return old.map(item =>
            item.product.id === product_id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // This is a simplified version - in real app you'd need the product data
          return [...old, { product: { id: product_id } as any, quantity }];
        }
      });

      return { previousCart };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.items(), context.previousCart);
      }
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: cartKeys.items() });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      });
    },
  });
};

// Update cart item quantity
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateCartItemData) => cartApi.updateCartItem(data),
    onMutate: async ({ product_id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.items() });
      const previousCart = queryClient.getQueryData(cartKeys.items());

      queryClient.setQueryData(cartKeys.items(), (old: CartItem[] = []) =>
        old.map(item =>
          item.product.id === product_id ? { ...item, quantity } : item
        )
      );

      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.items(), context.previousCart);
      }
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.items() });
    },
  });
};

// Remove from cart mutation
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: cartApi.removeFromCart,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.items() });
      const previousCart = queryClient.getQueryData(cartKeys.items());

      queryClient.setQueryData(cartKeys.items(), (old: CartItem[] = []) =>
        old.filter(item => item.product.id !== productId)
      );

      return { previousCart };
    },
    onError: (err, productId, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.items(), context.previousCart);
      }
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.items() });
    },
    onSuccess: () => {
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
    },
  });
};

// Clear cart mutation
export const useClearCart = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.setQueryData(cartKeys.items(), []);
      toast({
        title: "Cart cleared",
        description: "Your cart has been cleared",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    },
  });
}; 