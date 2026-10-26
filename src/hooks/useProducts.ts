import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import { Product, ProductFilters, UpdateProductData } from '@/types';
import { useToast } from './use-toast';
import { apiErrorMessage } from '@/lib/apiErrors';

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: any) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
};

// Get all products with filters
export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: productKeys.list(filters || {}),
    queryFn: () => productApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get featured products
export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: productKeys.featured(),
    queryFn: productApi.getFeaturedProducts,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Get single product
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productApi.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: (newProduct) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      
      // The response carries vendor as a bare id, so refetch the detail instead of caching it.
      queryClient.invalidateQueries({ queryKey: productKeys.detail(newProduct.id) });
      
      toast({
        title: "Product created",
        description: `${newProduct.name} has been created successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: apiErrorMessage(error, "Failed to create product"),
        variant: "destructive",
      });
    },
  });
};

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, product }: { id: string; product: UpdateProductData }) =>
      productApi.updateProduct(id, product),
    onSuccess: (updatedProduct) => {
      // The response carries vendor as a bare id, so refetch the detail instead of caching it.
      queryClient.invalidateQueries({ queryKey: productKeys.detail(updatedProduct.id) });
      
      // Invalidate products list to reflect changes
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      
      toast({
        title: "Product updated",
        description: `${updatedProduct.name} has been updated successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: apiErrorMessage(error, "Failed to update product"),
        variant: "destructive",
      });
    },
  });
};

// Upload a product photo; errors are left to the caller, which knows whether the product itself saved.
export const useUploadProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => productApi.uploadProductImage(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

// Delete product mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: (_, productId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: productKeys.detail(productId) });
      
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });
}; 