import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/cartStore";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: boolean;
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  onToggleFavorite, 
  isFavorite = false 
}: ProductCardProps) {
  const discountPercentage = Math.round(
    ((Number(product?.price )- Number(product?.discount_price)) / Number(product.price)) * 100
  );

  const isUpdating = useCartStore((state) => state.isUpdating);

  const handleAddToCart = () => {
    if (isUpdating) return;
    onAddToCart?.(product);
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] animate-fade-in">
      <div className="relative overflow-hidden">
        <img
          src={product?.image_url}
          alt={product.name}
          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Discount Badge */}
        {product?.price > product.discount_price && (
          <Badge 
            variant="destructive" 
            className="absolute top-2 left-2 bg-gradient-success text-success-foreground font-semibold animate-pulse-glow"
          >
            -{discountPercentage}%
          </Badge>
        )}
        
        {/* Brand Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 bg-white/90 text-foreground"
        >
          {product?.brand}
        </Badge>
        
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-2 right-2 h-8 w-8 bg-white/90 hover:bg-white"
          onClick={() => onToggleFavorite?.(product.id)}
        >
          <Heart 
            className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {product.description}
          </p>
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.rating})
          </span>
        </div>
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            ${product?.discount_price}
          </span>
          {product.price > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.price}
            </span>
          )}
        </div>
        
        {/* Stock Status */}
        <div className="mt-2">
          {product.stock > 0 ? (
            <Badge variant="outline" className="text-xs text-success border-success">
              {product.stock} in stock
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              Out of stock
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          variant={product.stock > 0 ? "accent" : "outline"}
          disabled={product.stock === 0 || isUpdating}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardFooter>
    </Card>
  );
}