import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
import { ProductGrid } from "@/components/ProductGrid";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  ShoppingBag,
  Star,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { useProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/store/cartStore";
import {
  useFavorites,
  useFavoriteHelpers,
  useFavoritesAuthBinding,
} from "@/hooks/useFavorites";

const TestHome = () => {
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
      .filter((product) => product.is_featured)
      .sort(
        (a, b) =>
          Number(b.discount_price) -
          Number(b.price) -
          (Number(a.discount_price) - Number(a.price))
      )
      .slice(0, 4);
  }, [products]);

  const handleAddToCart = async (product: Product) => {
    try {
      // Check if user is authenticated
      const accessToken = localStorage.getItem("accessToken");

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
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (favoriteIds.has(productId)) {
      removeFavorite(productId);
      toast({ title: "Removed from favorites" });
    } else {
      addFavorite(product);
      toast({ title: "Added to favorites" });
    }
  };

  // Partner brands data
  const partnerBrands = [
    {
      name: "Shoprite",
      logo: "🛒",
      color: "bg-blue-500",
      description: "Electronics & Appliances",
    },
    {
      name: "Melcom",
      logo: "🏪",
      color: "bg-green-500",
      description: "Home & Lifestyle",
    },
    {
      name: "Game",
      logo: "🎮",
      color: "bg-purple-500",
      description: "Gaming & Tech",
    },
    {
      name: "Makro",
      logo: "🏢",
      color: "bg-orange-500",
      description: "Wholesale & Retail",
    },
    {
      name: "Pick n Pay",
      logo: "🛍️",
      color: "bg-red-500",
      description: "Groceries & More",
    },
    {
      name: "Checkers",
      logo: "✅",
      color: "bg-yellow-500",
      description: "Quality Products",
    },
  ];

  const handleBrandClick = (brandName: string) => {
    toast({
      title: `${brandName} Selected`,
      description: `Browsing products from ${brandName}`,
    });
  };

  return (
    <Layout favoritesCount={favoriteProductsData?.length}>
      {/* Impossible Cube Pattern Backdrop */}
      <div className="fixed inset-0 z-0 opacity-80">
        <svg
          className="w-full h-full opacity-40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="impossible-cube"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              {/* Top face - white */}
              <polygon points="0,0 40,0 60,20 20,20" fill="#ffffff" />
              <polygon points="20,20 60,20 80,40 40,40" fill="#ffffff" />

              {/* Side faces - light grey */}
              <polygon points="0,0 20,20 20,60 0,40" fill="#d1d5db" />
              <polygon points="60,20 80,40 80,80 60,60" fill="#d1d5db" />

              {/* Bottom faces - dark grey */}
              <polygon points="20,60 60,60 80,80 40,80" fill="#6b7280" />
              <polygon points="0,40 20,60 40,80 20,60" fill="#6b7280" />

              {/* Shadow elements - black */}
              <polygon points="15,15 25,15 25,25 15,25" fill="#374151" />
              <polygon points="55,55 65,55 65,65 55,65" fill="#374151" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#impossible-cube)" />
        </svg>
      </div>

      {/* Hero Section with Hexagon */}
      <section className="relative min-h-screen flex items-center justify-center py-16 md:py-24 z-10">
        <div className="container mx-auto px-4 text-center">
          {/* Main Content */}
          <div className="flex flex-col items-center justify-center mb-12">
            <Badge className="mb-4 bg-white/90 text-gray-900 border-gray-200 backdrop-blur-lg shadow-lg">
              <Zap className="h-3 w-3 mr-1" />
              Discover Amazing Deals
            </Badge>
            <div className="flex flex-col items-center mb-6">
              <img
                src="/icons/Main Logo.svg"
                alt="GrottoMore Logo"
                className="h-24 w-24 md:h-32 md:w-32 mb-4 drop-shadow-2xl bg-white/90 p-2 rounded-full"
              />
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 drop-shadow-lg bg-white/80 px-6 py-3 rounded-lg inline-block">
                GrottoMore
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Discount Platform
                </span>
              </h1>
            </div>
            <p className="text-xl text-gray-800 mb-8 max-w-2xl mx-auto drop-shadow-lg bg-white/70 px-6 py-3 rounded-lg inline-block">
              Find the best discounted products from top retailers. Save big on
              electronics, home goods, and more!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products">
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-white/90 backdrop-blur-sm"
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Start Shopping
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 backdrop-blur-sm"
              >
                View Deals
              </Button>
            </div>
          </div>

          {/* Hexagon with Partner Brands */}
          <div className="relative">
            <div className="hexagon-container">
              <div className="hexagon">
                <div className="hexagon-inner">
                  <div className="grid grid-cols-3 gap-2 p-4">
                    {partnerBrands.map((brand, index) => (
                      <button
                        key={brand.name}
                        onClick={() => handleBrandClick(brand.name)}
                        className={`
                          ${brand.color} hover:scale-110 transition-all duration-300
                          rounded-lg p-3 text-white font-semibold text-sm
                          flex flex-col items-center justify-center
                          backdrop-blur-sm shadow-lg hover:shadow-xl
                          transform hover:rotate-3
                        `}
                        style={{
                          animationDelay: `${index * 100}ms`,
                        }}
                      >
                        <span className="text-2xl mb-1">{brand.logo}</span>
                        <span className="text-xs">{brand.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className=" relative py-16 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 drop-shadow-lg bg-white/80 px-4 py-2 rounded-lg inline-block">
              Featured Deals
            </h2>
            <p className="text-gray-800 max-w-2xl mx-auto drop-shadow-lg bg-white/70 px-4 py-2 rounded-lg mt-4 inline-block">
              Don't miss out on these incredible savings from our partner
              retailers
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
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-white/90 border-white shadow-lg"
              >
                View All Products
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Partner Brands Section */}
      <section className="relative py-16 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 drop-shadow-lg bg-white/80 px-4 py-2 rounded-lg inline-block">
              Our Partner Brands
            </h2>
            <p className="text-gray-800 drop-shadow-lg bg-white/70 px-4 py-2 rounded-lg mt-4 inline-block">
              Shop from trusted retailers and save more
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {partnerBrands.map((brand) => (
              <div
                key={brand.name}
                className="group cursor-pointer"
                onClick={() => handleBrandClick(brand.name)}
              >
                <div
                  className={`
                  ${brand.color} rounded-lg p-6 text-center text-white
                  transform transition-all duration-300 hover:scale-105 hover:rotate-2
                  shadow-lg hover:shadow-xl
                `}
                >
                  <div className="text-4xl mb-2">{brand.logo}</div>
                  <h3 className="font-semibold text-sm">{brand.name}</h3>
                  <p className="text-xs opacity-90 mt-1">{brand.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </Layout>
  );
};

export default TestHome;
