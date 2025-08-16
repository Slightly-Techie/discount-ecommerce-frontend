// src/store/productsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { productApi } from "@/lib/api";
import { Product } from "@/types/product";

interface ProductsState {
  products: Product[];
  featuredProducts: Product[];
  isLoading: boolean;
  isUpdating: boolean;
  
  // Pagination state
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  nextUrl: string | null;
  previousUrl: string | null;
  
  // Actions
  fetchProducts: (filters?: any, page?: number) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  addProduct: (product: Product) => void;
  addBulkProducts: (products: Product[]) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  clearProducts: () => void;
  forceRefreshProducts: () => Promise<void>;
  
  // Pagination actions
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToNextPage: () => Promise<void>;
  goToPreviousPage: () => Promise<void>;
  
  // Selectors
  getProductById: (productId: string) => Product | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: [],
      featuredProducts: [],
      isLoading: false,
      isUpdating: false,

      // Pagination state
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      pageSize: 10, // Default page size
      nextUrl: null,
      previousUrl: null,

      fetchProducts: async (filters?: any, page?: number) => {
        set({ isLoading: true });
        try {
          console.log('Fetching products from API...');
          const params = { ...filters, page_size: get().pageSize, page: page || get().currentPage };
          console.log('API params:', params);
          const response = await productApi.getProducts(params);
          console.log('Products API response:', response);
          console.log('Response structure:', {
            results: response.results?.length,
            count: response.count,
            next: response.next,
            previous: response.previous,
            pagination: response.pagination
          });
          
          // Handle pagination response structure with next/previous URLs
          let totalCount = response.count || 0;
          let totalPages = 1;
          let currentPageNum = page || get().currentPage;
          
          // Calculate total pages based on count and page size
          if (totalCount > 0 && get().pageSize > 0) {
            totalPages = Math.ceil(totalCount / get().pageSize);
          }
          
          console.log('Pagination calculated:', { totalCount, totalPages, currentPageNum });
          
          set({ 
            products: response.results || [], 
            totalCount,
            totalPages,
            currentPage: currentPageNum,
            nextUrl: response.next,
            previousUrl: response.previous
          });
          console.log('Store updated with:', { totalCount, totalPages, currentPage: currentPageNum });
        } catch (error) {
          console.error('Error fetching products:', error);
          // Don't clear existing products on error, keep cached data
        } finally {
          set({ isLoading: false });
        }
      },

      fetchFeaturedProducts: async () => {
        set({ isUpdating: true });
        try {
          console.log('Fetching featured products from API...');
          const products = await productApi.getFeaturedProducts();
          console.log('Featured products fetched:', products);
          
          set({ featuredProducts: products || [] });
        } catch (error) {
          console.error('Error fetching featured products:', error);
        } finally {
          set({ isUpdating: false });
        }
      },

      addProduct: (product: Product) => {
        set(state => {
          const existingProduct = state.products.find(p => p.id === product.id);
          if (existingProduct) {
            // Update existing product
            const updatedProducts = state.products.map(p => 
              p.id === product.id ? product : p
            );
            return { products: updatedProducts };
          } else {
            // Add new product
            return { products: [product, ...state.products] };
          }
        });
      },

      addBulkProducts: (products: Product[]) => {
        set(state => {
          const newProducts = [...state.products];
          products.forEach(product => {
            const existingIndex = newProducts.findIndex(p => p.id === product.id);
            if (existingIndex >= 0) {
              // Update existing product
              newProducts[existingIndex] = product;
            } else {
              // Add new product
              newProducts.unshift(product);
            }
          });
          return { products: newProducts };
        });
      },

      updateProduct: (productId: string, updates: Partial<Product>) => {
        set(state => {
          const updatedProducts = state.products.map(product => 
            product.id === productId ? { ...product, ...updates } : product
          );
          return { products: updatedProducts };
        });
      },

      clearProducts: () => {
        set({ 
          products: [], 
          featuredProducts: [], 
          currentPage: 1, 
          totalPages: 1, 
          totalCount: 0,
          nextUrl: null,
          previousUrl: null
        });
      },

      forceRefreshProducts: async () => {
        set({ products: [], isLoading: true });
        try {
          console.log('Force refreshing products from API...');
          const response = await productApi.getProducts({ page_size: get().pageSize, page: 1 });
          console.log('Force refresh response:', response);
          
          // Handle different pagination response structures
          let totalCount = 0;
          let totalPages = 1;
          
          if (response.pagination) {
            // New pagination structure
            totalCount = response.pagination.total || 0;
            totalPages = response.pagination.totalPages || 1;
          } else if (response.count !== undefined) {
            // Legacy pagination structure
            totalCount = response.count || 0;
            totalPages = response.total_pages || 1;
          }
          
          set({ 
            products: response.results || [], 
            totalCount,
            totalPages,
            currentPage: 1,
            nextUrl: response.next,
            previousUrl: response.previous,
            isLoading: false 
          });
        } catch (error) {
          console.error('Error force refreshing products:', error);
          set({ isLoading: false });
          throw error; // Re-throw to let the component handle it
        }
      },

      // Pagination actions
      setPage: (page: number) => {
        set({ currentPage: page });
      },
      nextPage: () => {
        set(state => ({ currentPage: Math.min(state.currentPage + 1, state.totalPages) }));
      },
      prevPage: () => {
        set(state => ({ currentPage: Math.max(state.currentPage - 1, 1) }));
      },
      goToNextPage: async () => {
        const state = get();
        if (state.nextUrl) {
          set({ isLoading: true });
          try {
            console.log('Fetching next page using URL:', state.nextUrl);
            const response = await productApi.getProductsFromUrl(state.nextUrl);
            console.log('Next page response:', response);
            
            let totalCount = response.count || 0;
            let totalPages = 1;
            
            // Calculate total pages based on count and page size
            if (totalCount > 0 && state.pageSize > 0) {
              totalPages = Math.ceil(totalCount / state.pageSize);
            }
            
            set({ 
              products: response.results || [], 
              totalCount,
              totalPages,
              currentPage: state.currentPage + 1,
              nextUrl: response.next,
              previousUrl: response.previous,
              isLoading: false
            });
          } catch (error) {
            console.error('Error fetching next page:', error);
            set({ isLoading: false });
          }
        }
      },
      goToPreviousPage: async () => {
        const state = get();
        if (state.previousUrl) {
          set({ isLoading: true });
          try {
            console.log('Fetching previous page using URL:', state.previousUrl);
            const response = await productApi.getProductsFromUrl(state.previousUrl);
            console.log('Previous page response:', response);
            
            let totalCount = response.count || 0;
            let totalPages = 1;
            
            // Calculate total pages based on count and page size
            if (totalCount > 0 && state.pageSize > 0) {
              totalPages = Math.ceil(totalCount / state.pageSize);
            }
            
            set({ 
              products: response.results || [], 
              totalCount,
              totalPages,
              currentPage: state.currentPage - 1,
              nextUrl: response.next,
              previousUrl: response.previous,
              isLoading: false
            });
          } catch (error) {
            console.error('Error fetching previous page:', error);
            set({ isLoading: false });
          }
        }
      },

      // Selectors
      getProductById: (productId: string) => {
        return get().products.find(product => product.id === productId);
      },

      getProductsByCategory: (categoryId: string) => {
        return get().products.filter(product => product.category?.id === categoryId);
      },
    }),
    {
      name: 'products-storage',
      partialize: (state) => ({ 
        products: state.products,
        featuredProducts: state.featuredProducts,
        currentPage: state.currentPage,
        totalPages: state.totalPages,
        totalCount: state.totalCount,
        pageSize: state.pageSize,
        nextUrl: state.nextUrl,
        previousUrl: state.previousUrl
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure products is always an array
          if (!state.products || !Array.isArray(state.products)) {
            state.products = [];
          }
          if (!state.featuredProducts || !Array.isArray(state.featuredProducts)) {
            state.featuredProducts = [];
          }
          if (typeof state.currentPage !== 'number') {
            state.currentPage = 1;
          }
          if (typeof state.totalPages !== 'number') {
            state.totalPages = 1;
          }
          if (typeof state.totalCount !== 'number') {
            state.totalCount = 0;
          }
          if (typeof state.pageSize !== 'number') {
            state.pageSize = 10;
          }
          if (typeof state.nextUrl !== 'string' && state.nextUrl !== null) {
            state.nextUrl = null;
          }
          if (typeof state.previousUrl !== 'string' && state.previousUrl !== null) {
            state.previousUrl = null;
          }
        }
      },
    }
  )
); 