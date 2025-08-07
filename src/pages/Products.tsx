import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { ProductGrid } from "@/components/ProductGrid";
import { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { Footer } from "@/components/Footer";
import { useCartStore } from "@/store/cartStore";

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
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Cart store
  const cartItems = useCartStore((state) => state.cart);
  const addToCart = useCartStore((state) => state.addToCart);
  const addToCartLocal = useCartStore((state) => state.addToCartLocal);
  const getCartItemCount = useCartStore((state) => state.getCartItemCount);

  // Fetch products from backend
  const { data: productsResponse, isLoading, error } = useProducts({
    search: filters.search,
    category: filters.category,
    brand: filters.brand,
    minPrice: filters.priceRange ? parseInt(filters.priceRange.split('-')[0]) : undefined,
    maxPrice: filters.priceRange ? 
      (filters.priceRange.includes('+') ? undefined : parseInt(filters.priceRange.split('-')[1])) : undefined,
    sortBy: filters.sortBy,
  });

  const products = productsResponse?.results || [];
  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category))).sort(),
    [products]
  );
  
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

  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    
    const product = products.find(p => p.id === productId);
    const isFavorite = favorites.includes(productId);
    
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: `${product?.name} has been ${isFavorite ? 'removed from' : 'added to'} your favorites.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        favoritesCount={favorites.length}
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
            onFilterChange={setFilters}
            categories={categories?.map((c) => c.name)}
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

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load products. Please try again.</p>
          </div>
        )}

        {/* Results Header */}
        {!isLoading && !error && (
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {products.length} product{products.length !== 1 ? 's' : ''}
              {filters.search && ` for "${filters.search}"`}
            </p>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && !error && (
          <ProductGrid
            products={products}
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}