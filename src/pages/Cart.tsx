import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowLeft,
  CreditCard,
  Truck,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { useProducts } from "@/hooks/useProducts";
import { useUpdateCartItem } from "@/hooks/useCart";

interface CartItem {
  product: Product;
  quantity: number;
}

function CartContent() {
  const { toast } = useToast();
  
  // Cart store
  // Fetch products from backend
  const { data: productsResponse, error } = useProducts( );

  const products = productsResponse?.results || [];
  console.log('Cart page - products:', products);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const isLoading = useCartStore((state) => state.isLoading);
  const cartItems = useCartStore((state) => state.cart) || [];
  // const updateCartItem = useCartStore((state) => state.updateCartItem);
  const { mutate: updateCartItem } = useUpdateCartItem();
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateCartItemLocal = useCartStore((state) => state.updateCartItemLocal);
  const removeFromCartLocal = useCartStore((state) => state.removeFromCartLocal);
  const getCartItemCount = useCartStore((state) => state.getCartItemCount);

  // Debug logging
  console.log('Cart page - cartItems:', cartItems);
  console.log('Cart page - cartItems length:', cartItems?.length);
  console.log('Cart page - isLoading:', isLoading);
  console.log('Cart page - cartItems type:', typeof cartItems);
  console.log('Cart page - cartItems isArray:', Array.isArray(cartItems));
  
  if (cartItems && Array.isArray(cartItems)) {
    cartItems.forEach((item, index) => {
      console.log(`Cart item ${index}:`, item);
      console.log(`Cart item ${index} product:`, item?.product);
      console.log(`Cart item ${index} quantity:`, item?.quantity);
    });
  }
  
  // Check authentication status
  const accessToken = localStorage.getItem('accessToken');
  console.log('Cart page - isAuthenticated:', !!accessToken);

  // Fetch cart on component mount
  // useEffect(() => {
  //   console.log('Cart page - fetching cart...');
  //   fetchCart();
  // }, [fetchCart]);
  useEffect(() => {
    if (products?.length > 0) {
      fetchCart(products);
    }
  }, [products]);

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    console.log('Cart page - updating quantity for product:', productId, 'to:', newQuantity);
    if (newQuantity === 0) {
      await handleRemoveItem(productId);
      return;
    }
    
    try {
      // Check if user is authenticated
      const accessToken = localStorage.getItem('accessToken');
      console.log('Cart page - accessToken:', accessToken);
      
      if (accessToken) {
        // User is authenticated, use API
        await updateCartItem({
          product: productId,
          quantity: newQuantity,
        });}
      // } else {
      //   // User is not authenticated, use local storage
      //   updateCartItemLocal(productId, newQuantity);
      // }
      
      // const item = cartItems.find(item => item.product.id === productId);
      // console.log('Item:', item);
      // if (item) {
      //   toast({
      //     title: "Quantity updated",
      //     description: `${item.product.name} quantity has been updated to ${newQuantity}.`,
      //   });
      // }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      const item = cartItems.find(item => item.product.id === productId);
      
      // Check if user is authenticated
      const accessToken = localStorage.getItem('accessToken');
      
      if (accessToken) {
        // User is authenticated, use API
        await removeFromCart(productId);
      } else {
        // User is not authenticated, use local storage
        removeFromCartLocal(productId);
      }
      
      if (item) {
        toast({
          title: "Removed from cart",
          description: `${item.product.name} has been removed from your cart.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cartSummary = useMemo(() => {
    if (!cartItems || !Array.isArray(cartItems)) {
      return {
        subtotal: 0,
        originalTotal: 0,
        savings: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        itemCount: 0
      };
    }

    const subtotal = cartItems.reduce((total, item) => {
      if (!item || !item.product) return total;
      const price = Number(item.product.discount_price || item.product.price);
      return total + (price * (item.quantity || 0));
    }, 0);
    
    const originalTotal = cartItems.reduce((total, item) => {
      if (!item || !item.product) return total;
      const originalPrice = Number(item.product.price);
      return total + (originalPrice * (item.quantity || 0));
    }, 0);
    
    const savings = originalTotal - subtotal;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;
    
    return {
      subtotal,
      originalTotal,
      savings,
      shipping,
      tax,
      total,
      itemCount: getCartItemCount()
    };
  }, [cartItems, getCartItemCount]);

  const handleCheckout = () => {
    // Check if user is authenticated
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      toast({
        title: "Login Required",
        description: "Please log in to proceed with checkout.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Checkout initiated",
      description: "Redirecting to payment processing...",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          favoritesCount={0}
        />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading cart...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          favoritesCount={0}
        />
        
        <main className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link to="/products">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        favoritesCount={0}
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Shopping Cart</h1>
              <p className="text-muted-foreground">
                {cartSummary.itemCount} item{cartSummary.itemCount !== 1 ? 's' : ''} in your cart
              </p>
              {/* Debug info */}
              <p className="text-xs text-muted-foreground mt-1">
                Debug: Cart items: {cartItems?.length || 0} | Raw count: {getCartItemCount()}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('Manual cart refresh...');
                fetchCart();
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh Cart'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems && Array.isArray(cartItems) && cartItems.map((item) => {
                  if (!item || !item.product) return null;
                  
                  return (
                    <div key={item.product.id} className="flex gap-4 p-4 border rounded-lg">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.product.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{item.product.brand}</Badge>
                          <Badge variant="secondary">{item.product.category?.name}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              ${item.product.discount_price || item.product.price}
                            </span>
                            {item.product.discount_price && item.product.price > item.product.discount_price && (
                              <span className="text-sm text-muted-foreground line-through">
                                ${item.product.price}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.product.id, (item.quantity || 1) - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity || 1}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.product.id, (item.quantity || 1) + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveItem(item.product.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${cartSummary?.subtotal.toFixed(2)}</span>
                </div>

                {cartSummary?.savings > 0 && (
                  <div className="flex justify-between text-success">
                    <span>You save</span>
                    <span>-${cartSummary.savings.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {cartSummary.shipping === 0 ? (
                      <span className="text-success">FREE</span>
                    ) : (
                      `$${cartSummary.shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${cartSummary.tax.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${cartSummary.total.toFixed(2)}</span>
                </div>

                {cartSummary.shipping > 0 && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <Truck className="h-4 w-4 inline mr-2" />
                    Add ${(50 - cartSummary.subtotal).toFixed(2)} more for free shipping
                  </div>
                )}

                <Button 
                  onClick={handleCheckout} 
                  className="w-full" 
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Free returns within 30 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Cart() {
  return <CartContent />;
}