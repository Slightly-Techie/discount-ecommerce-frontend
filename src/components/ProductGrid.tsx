import { ProductCard } from "./ProductCard";
import { Product } from "@/types/product";

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  favorites?: string[];
}

export function ProductGrid({ 
  products, 
  onAddToCart, 
  onToggleFavorite, 
  favorites = [] 
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          No products found
        </h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <div 
          key={product.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <ProductCard
            product={product}
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.includes(product.id)}
          />
        </div>
      ))}
    </div>
  );
}