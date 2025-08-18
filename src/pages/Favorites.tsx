import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProductGrid } from "@/components/ProductGrid";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavorites, useFavoriteHelpers, useFavoritesAuthBinding } from "@/hooks/useFavorites";

function FavoritesContent() {
  const { toast } = useToast();
  useFavoritesAuthBinding();
  const { data: favorites = [], isLoading } = useFavorites();
  const { addFavorite, removeFavorite } = useFavoriteHelpers();
  const favoriteIds = new Set(favorites.map((p) => p.id));

  const handleAddToCart = (product: Product) => {
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleToggleFavorite = async (productId: string) => {
    const product = favorites.find((p) => p.id === productId);
    if (favoriteIds.has(productId)) {
      removeFavorite(productId);
      toast({ title: "Removed from favorites" });
    } else if (product) {
      addFavorite(product);
      toast({ title: "Added to favorites" });
    }
  };

  if (!isLoading && favorites.length === 0) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  return (
    <Layout>
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
                {favorites.length} product{favorites.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
        </div>

        <ProductGrid
          products={favorites}
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavorite}
          favorites={[...favoriteIds]}
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
    </Layout>
  );
}

export default function Favorites() {
  return (
    <ProtectedRoute>
      <FavoritesContent />
    </ProtectedRoute>
  );
}