import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ImageOff, ShoppingCart, Store, Truck } from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useToast } from "@/hooks/use-toast";
import { formatGHS } from "@/lib/price";
import { dealPricing, productImage, retailerName } from "@/lib/deal";
import { COUPON_KEY } from "@/lib/checkout";
import { useCartStore } from "@/store/cartStore";

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fetchCart = useCartStore((s) => s.fetchCart);
  const isLoading = useCartStore((s) => s.isLoading);
  const isUpdating = useCartStore((s) => s.isUpdating);
  const cart = useCartStore((s) => s.cart);
  const updateCartItem = useCartStore((s) => s.updateCartItem);
  const updateCartItemLocal = useCartStore((s) => s.updateCartItemLocal);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const removeFromCartLocal = useCartStore((s) => s.removeFromCartLocal);
  const removeFromCartById = useCartStore((s) => (s as unknown as { removeFromCartById: (id: string) => Promise<void> }).removeFromCartById);
  const [coupon, setCoupon] = useState(() => sessionStorage.getItem(COUPON_KEY) || "");
  const [error, setError] = useState<string | null>(null);
  const signedIn = !!localStorage.getItem("accessToken");

  // Keep toasts clear of the mobile checkout bar.
  useEffect(() => {
    document.documentElement.style.setProperty("--toast-bottom", "152px");
    return () => {
      document.documentElement.style.removeProperty("--toast-bottom");
    };
  }, []);

  useEffect(() => {
    if (signedIn) fetchCart().catch(() => setError("We couldn’t refresh your cart."));
  }, [fetchCart, signedIn]);

  const items = useMemo(
    () =>
      (Array.isArray(cart) ? [...cart] : [])
        .filter((i) => i?.product)
        .sort((a, b) => String(a.id || a.product.id).localeCompare(String(b.id || b.product.id))),
    [cart]
  );

  const summary = useMemo(() => {
    let subtotal = 0;
    let saved = 0;
    let count = 0;
    for (const item of items) {
      const p = dealPricing(item.product);
      const q = item.quantity || 0;
      subtotal += p.price * q;
      saved += (p.save ?? 0) * q;
      count += q;
    }
    return { subtotal, saved, count };
  }, [items]);

  const setQuantity = async (productId: string, cartItemId: string | undefined, quantity: number) => {
    setError(null);
    try {
      if (signedIn && cartItemId) await updateCartItem(cartItemId, productId, quantity);
      else updateCartItemLocal(productId, quantity);
    } catch {
      setError("Couldn’t update your cart. Check your connection and try again. Your items are still saved.");
    }
  };

  const remove = async (productId: string, cartItemId: string | undefined, name: string) => {
    setError(null);
    try {
      if (signedIn) {
        if (cartItemId) await removeFromCartById(cartItemId);
        else await removeFromCart(productId);
      } else {
        removeFromCartLocal(productId);
      }
      toast({ title: `Removed ${name}` });
    } catch {
      setError("Couldn’t update your cart. Check your connection and try again. Your items are still saved.");
    }
  };

  const goToCheckout = () => {
    const code = coupon.trim().toUpperCase();
    if (code) sessionStorage.setItem(COUPON_KEY, code);
    else sessionStorage.removeItem(COUPON_KEY);
    navigate(signedIn ? "/checkout" : "/login?next=/checkout&reason=checkout");
  };

  if (items.length === 0) {
    return (
      <Layout mobileBar={{ kind: "title", title: "Cart" }}>
        {isLoading && signedIn ? (
          <div aria-busy="true" className="container flex flex-col gap-4 py-8">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-[72px] w-[72px] rounded-md bg-skeleton" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-3.5 w-4/5 rounded-[6px] bg-skeleton" />
                  <div className="h-3.5 w-1/2 rounded-[6px] bg-skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Deals you add show up here. You don’t need an account to fill your cart."
            action={
              <div className="flex flex-col items-center gap-1">
                <Button asChild>
                  <Link to="/products">Browse today’s deals</Link>
                </Button>
                <Link to="/favorites" className="flex min-h-12 items-center text-sm font-semibold text-primary">
                  See your saved deals
                </Link>
              </div>
            }
          />
        )}
      </Layout>
    );
  }

  const summaryRows = (
    <dl className="flex flex-col gap-2.5 text-[15px]">
      <div className="flex justify-between">
        <dt>
          Subtotal ({summary.count} {summary.count === 1 ? "item" : "items"})
        </dt>
        <dd className="tabular-prices">{formatGHS(summary.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt>Delivery</dt>
        <dd className="text-right text-muted-foreground">Calculated at checkout</dd>
      </div>
      <div className="flex justify-between border-t pt-2.5 text-lg font-bold">
        <dt>Total so far</dt>
        <dd className="tabular-prices">{formatGHS(summary.subtotal)}</dd>
      </div>
      {summary.saved > 0 && (
        <div className="rounded-[6px] bg-save-subtle px-2.5 py-1.5 text-sm font-bold text-save tabular-prices">
          You save {formatGHS(summary.saved)} on this order
        </div>
      )}
    </dl>
  );

  return (
    <Layout mobileBar={{ kind: "title", title: `Cart (${summary.count})` }}>
      <div className="container pb-40 pt-4 lg:pb-16 lg:pt-8">
        <h1 className="mb-4 hidden text-[30px] font-bold leading-[38px] lg:block">Your cart</h1>

        {error && (
          <div role="alert" className="mb-4 flex items-start gap-3 rounded-lg bg-destructive-subtle px-4 py-3.5 text-destructive">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <strong className="text-[15px]">Couldn’t update your cart</strong>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <section aria-label="Items">
            <ul className="divide-y rounded-lg border">
              {items.map((item) => {
                const p = item.product;
                const pricing = dealPricing(p);
                const q = item.quantity || 1;
                const image = productImage(p);
                return (
                  <li key={item.id || p.id} className="flex gap-3 p-4">
                    <Link to={`/products/${p.id}`} className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-md bg-secondary lg:h-24 lg:w-24">
                      {image ? (
                        <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain p-1.5" />
                      ) : (
                        <ImageOff className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Link to={`/products/${p.id}`} className="line-clamp-2 text-[15px] font-medium leading-5 hover:text-primary">
                        {p.name}
                      </Link>
                      <span className="flex items-center gap-1 text-[13px] text-muted-foreground">
                        <Store className="h-3.5 w-3.5" aria-hidden="true" />
                        {retailerName(p)} · {formatGHS(pricing.price)} each
                      </span>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-base font-bold tabular-prices">{formatGHS(pricing.price * q)}</span>
                        {pricing.was !== null && (
                          <s className="text-[13px] text-subtle tabular-prices">{formatGHS(pricing.was * q)}</s>
                        )}
                        {pricing.save !== null && (
                          <span className="text-[13px] font-semibold text-save tabular-prices">Save {formatGHS(pricing.save * q)}</span>
                        )}
                      </div>
                      <QuantityStepper
                        className="mt-1 self-start"
                        value={q}
                        max={p.stock || undefined}
                        disabled={isUpdating}
                        onChange={(n) => setQuantity(p.id, item.id, n)}
                        onRemove={() => remove(p.id, item.id, p.name)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside aria-labelledby="summary-heading" className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="coupon" className="text-sm font-semibold">
                Coupon code
              </Label>
              <Input
                id="coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                autoCapitalize="characters"
                autoComplete="off"
                className="uppercase"
              />
              <span className="text-[13px] text-muted-foreground">Checked and applied when you place your order.</span>
            </div>
            <div className="flex flex-col gap-4 rounded-lg border p-5">
              <h2 id="summary-heading" className="text-lg font-bold">
                Order summary
              </h2>
              {summaryRows}
              <Button variant="deal" size="lg" className="hidden w-full lg:flex" onClick={goToCheckout}>
                Checkout
              </Button>
              <p className="flex items-start gap-2 text-[13px] text-muted-foreground">
                <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Delivery fee and any tax depend on your address and are shown before you place the order.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky checkout bar above the tab bar */}
      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-sticky flex items-center gap-3 border-t bg-background px-4 py-3 shadow-lg lg:hidden">
        <div className="flex flex-col">
          <span className="text-[13px] text-muted-foreground">Total so far</span>
          <span className="text-lg font-bold tabular-prices">{formatGHS(summary.subtotal)}</span>
        </div>
        <Button variant="deal" className="flex-1" onClick={goToCheckout}>
          Checkout
        </Button>
      </div>
    </Layout>
  );
};

export default Cart;
