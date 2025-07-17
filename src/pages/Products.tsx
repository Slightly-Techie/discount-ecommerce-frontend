import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { ProductGrid } from "@/components/ProductGrid";
import { mockProducts } from "@/data/mockProducts";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";

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
  const [cartItems, setCartItems] = useState<string[]>([]);

  // Extract unique categories and brands
  const categories = useMemo(() => 
    Array.from(new Set(mockProducts.map(p => p.category))).sort(),
    []
  );
  
  const brands = useMemo(() => 
    Array.from(new Set(mockProducts.map(p => p.brand))).sort(),
    []
  );

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = mockProducts;

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Apply brand filter
    if (filters.brand) {
      filtered = filtered.filter(product => product.brand === filters.brand);
    }

    // Apply price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(p => 
        p === '100+' ? Infinity : parseInt(p)
      );
      filtered = filtered.filter(product => 
        product.price >= min && (max === Infinity || product.price <= max)
      );
    }

    // Apply sorting
    const sortedProducts = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'discount':
          const discountA = ((a.originalPrice - a.price) / a.originalPrice) * 100;
          const discountB = ((b.originalPrice - b.price) / b.originalPrice) * 100;
          return discountB - discountA;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sortedProducts;
  }, [filters]);

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => [...prev, product.id]);
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    
    const product = mockProducts.find(p => p.id === productId);
    const isFavorite = favorites.includes(productId);
    
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: `${product?.name} has been ${isFavorite ? 'removed from' : 'added to'} your favorites.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemsCount={cartItems.length} 
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
            categories={categories}
            brands={brands}
          />
        </div>

        {/* Results Header */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            {filters.search && ` for "${filters.search}"`}
          </p>
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={filteredProducts}
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavorite}
          favorites={favorites}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}