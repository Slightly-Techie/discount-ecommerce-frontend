import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ProductGrid } from "@/components/ProductGrid";
import { mockProducts } from "@/data/mockProducts";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export default function Favorites() {
  const { toast } = useToast();
  
  // Mock favorites - in real app this would come from state management
  const [favorites, setFavorites] = useState<string[]>([
    mockProducts[0].id,
    mockProducts[2].id,
    mockProducts[4].id,
  ]);
  const [cartItems, setCartItems] = useState<string[]>([]);

  const favoriteProducts = useMemo(() => {
    return mockProducts.filter(product => favorites.includes(product.id));
  }, [favorites]);

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

  if (favoriteProducts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemsCount={cartItems.length} favoritesCount={favorites.length} />
        
        <main className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">No favorites yet</h1>
            <p className="text-muted-foreground mb-6">
              Start browsing and save your favorite products here.
            </p>
            <Link to="/products">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={cartItems.length} favoritesCount={favorites.length} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Favorites</h1>
              <p className="text-muted-foreground">
                {favoriteProducts.length} product{favoriteProducts.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
        </div>

        <ProductGrid
          products={favoriteProducts}
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavorite}
          favorites={favorites}
        />

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Looking for more great deals?
          </p>
          <Link to="/products">
            <Button variant="outline" size="lg">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}