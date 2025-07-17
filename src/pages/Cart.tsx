import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { mockProducts } from "@/data/mockProducts";
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

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Cart() {
  const { toast } = useToast();
  
  // Mock cart items - in real app this would come from state management
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: mockProducts[0], quantity: 2 },
    { product: mockProducts[1], quantity: 1 },
    { product: mockProducts[2], quantity: 3 },
  ]);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(productId);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    const item = cartItems.find(item => item.product.id === productId);
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
    
    if (item) {
      toast({
        title: "Removed from cart",
        description: `${item.product.name} has been removed from your cart.`,
      });
    }
  };

  const cartSummary = useMemo(() => {
    const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const originalTotal = cartItems.reduce((total, item) => total + (item.product.originalPrice * item.quantity), 0);
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
      itemCount: cartItems.reduce((total, item) => total + item.quantity, 0)
    };
  }, [cartItems]);

  const handleCheckout = () => {
    toast({
      title: "Checkout initiated",
      description: "Redirecting to payment processing...",
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemsCount={0} favoritesCount={0} />
        
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
      <Header cartItemsCount={cartSummary.itemCount} favoritesCount={0} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {cartSummary.itemCount} item{cartSummary.itemCount !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex gap-4 p-4 border rounded-lg">
                    <img
                      src={item.product.image}
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
                        <Badge variant="secondary">{item.product.category}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">${item.product.price}</span>
                          {item.product.originalPrice > item.product.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              ${item.product.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <span>${cartSummary.subtotal.toFixed(2)}</span>
                </div>
                
                {cartSummary.savings > 0 && (
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