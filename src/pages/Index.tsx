import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
import { ProductGrid } from "@/components/ProductGrid";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, ShoppingBag, Star, TrendingDown } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/store/cartStore";
import { useFavorites, useFavoriteHelpers, useFavoritesAuthBinding } from "@/hooks/useFavorites";

const Index = () => {
  const { toast } = useToast();
  
  // Favorites
  useFavoritesAuthBinding();
  const { data: favoriteProductsData } = useFavorites();
  const { addFavorite, removeFavorite } = useFavoriteHelpers();
  const favoriteIds = new Set((favoriteProductsData || []).map((p) => p.id));
  
  // Cart store
  const addToCart = useCartStore((state) => state.addToCart);
  const addToCartLocal = useCartStore((state) => state.addToCartLocal);
  const getCartItemCount = useCartStore((state) => state.getCartItemCount);
  
  const { data: productsResponse } = useProducts();
  const products = productsResponse?.results || [];

  // Get featured products (first 4 with highest discounts)
  const featuredProducts = useMemo(() => {
    return products
      .filter(product => product.is_featured)
      .sort((a, b) => 
        (Number(b.discount_price) - Number(b.price)) - (Number(a.discount_price) - Number(a.price))
      )
      .slice(0, 4);
  }, [products]);

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
    <Layout favoritesCount={favoriteProductsData?.length}>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-16 md:py-24">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        <div className="container relative mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/20">
            <Zap className="h-3 w-3 mr-1" />
            New Deals Every Day
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Discover Amazing
            <span className="block bg-gradient-to-r from-white to white/80 bg-clip-text text-transparent">
              Discounts & Deals
            </span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Find the best discounted products from top retailers like Shoprite and Melcom. 
            Save big on electronics, food, home goods, and more!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Shop Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-primary hover:bg-white/10">
              View Hot Deals
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="animate-fade-in">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Products</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-3xl font-bold text-success mb-2">Up to 70%</div>
              <div className="text-muted-foreground">Discounts</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl font-bold text-accent mb-2">2</div>
              <div className="text-muted-foreground">Top Retailers</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-3xl font-bold text-warning mb-2">Daily</div>
              <div className="text-muted-foreground">New Deals</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-success/10 text-success border-success/20">
              <TrendingDown className="h-3 w-3 mr-1" />
              Biggest Discounts
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Featured Deals</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Don't miss out on these incredible savings from our partner retailers
            </p>
          </div>
          
          <ProductGrid
            products={featuredProducts}
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
            favorites={[...favoriteIds]}
          />
          
          <div className="text-center mt-8">
            <Link to="/products">
              <Button size="lg" variant="outline">
                View All Products
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Shop by Brand</h2>
            <p className="text-muted-foreground">
              Discover deals from your favorite retailers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="group bg-card rounded-lg p-8 text-center hover:shadow-card-hover transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">S</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Shoprite</h3>
              <p className="text-muted-foreground mb-4">Electronics, appliances, and more</p>
              <Badge variant="secondary">
                {products.filter(p => p.brand === 'Shoprite').length} products
              </Badge>
            </div>
            
            <div className="group bg-card rounded-lg p-8 text-center hover:shadow-card-hover transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">M</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Melcom</h3>
              <p className="text-muted-foreground mb-4">Home goods, food, and lifestyle</p>
              <Badge variant="secondary">
                {products.filter(p => p.brand === 'Melcom').length} products
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of shoppers who save money every day with our curated deals
          </p>
          <Link to="/products">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Start Shopping
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </Layout>
  );
};

export default Index;
