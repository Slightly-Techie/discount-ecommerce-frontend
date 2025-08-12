import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { useCartStore } from "@/store/cartStore";
import { useProductsStore } from "@/store/productsStore";
import { useFavorites, useFavoriteHelpers, useFavoritesAuthBinding } from "@/hooks/useFavorites";

interface FilterOptions {
  search: string;
  category: string;
  brand: string;
  priceRange: string;
  sortBy: string;
}

export default function Products() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    category: "",
    brand: "",
    priceRange: "",
    sortBy: "name"
  });
  
  // Favorites
  useFavoritesAuthBinding();
  const { data: favoriteProductsData } = useFavorites();
  const { addFavorite, removeFavorite } = useFavoriteHelpers();
  const favoriteIds = new Set((favoriteProductsData || []).map((p) => p.id));
  
  // Cart store
  const cartItems = useCartStore((state) => state.cart);
  const addToCart = useCartStore((state) => state.addToCart);
  const addToCartLocal = useCartStore((state) => state.addToCartLocal);
  const getCartItemCount = useCartStore((state) => state.getCartItemCount);

  // Products store with pagination
  const { 
    products, 
    isLoading, 
    fetchProducts,
    currentPage,
    totalPages,
    totalCount,
    setPage
  } = useProductsStore();

  // Fetch products when filters or page changes
  useEffect(() => {
    const apiFilters = {
      search: filters.search || undefined,
      category: filters.category || undefined,
      brand: filters.brand || undefined,
      price_range: filters.priceRange || undefined,
      ordering: filters.sortBy || undefined,
    };
    
    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(apiFilters).filter(([_, value]) => value !== undefined)
    );
    
    fetchProducts(cleanFilters, currentPage);
  }, [fetchProducts, filters, currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setPage(1);
  };

  // Ensure unique category names (strings) to avoid duplicate keys
  const categories = useMemo(() => {
    const names = products.map(p => p.category?.name).filter(Boolean) as string[];
    return Array.from(new Set(names)).sort();
  }, [products]);
  
  const brands = useMemo(() => 
    Array.from(new Set(products.map(p => p.brand))).sort(),
    [products]
  );

  const handleAddToCart = async (product: Product) => {
    try {
      // Check if user is authenticated
      const accessToken = localStorage.getItem('accessToken');
      
      if (accessToken) {
        // User is authenticated, use API
        await addToCart({
          product: product.id,
          quantity: 1,
        });
      } else {
        // User is not authenticated, use local storage
        addToCartLocal(product, 1); 
      }
      
      toast({
        title: "Added to cart!",
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (favoriteIds.has(productId)) {
      removeFavorite(productId);
      toast({ title: 'Removed from favorites' });
    } else {
      addFavorite(product);
      toast({ title: 'Added to favorites' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        favoritesCount={favoriteIds.size}
      />
      
      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Amazing Deals</h1>
          <p className="text-muted-foreground">
            Find the best discounted products from top retailers like Shoprite and Melcom
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <SearchAndFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={categories}
            brands={brands}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading products...</p>
          </div>
        )}

        {/* Results Header */}
        {!isLoading && (
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {products.length} of {totalCount} product{totalCount !== 1 ? 's' : ''}
              {filters.search && ` for "${filters.search}"`}
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </p>
            {/* Debug info */}
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
              Debug: totalPages={totalPages}, currentPage={currentPage}, totalCount={totalCount}, products.length={products.length}
            </div>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && (
          <ProductGrid
            products={products}
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
            favorites={[...favoriteIds]}
          />
        )}

        {/* Pagination - Always show for debugging */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}