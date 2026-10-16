import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Info, MapPin, Package, Wallet } from "lucide-react";

import { Layout } from "@/components/Layout";
import { PaymentAccountsList } from "@/components/PaymentAccountsList";
import { PaymentProofForm } from "@/components/PaymentProofForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsAuthenticated } from "@/hooks/useAuth";
import { useCreateAddress } from "@/hooks/useUsers";
import { orderApi, paymentsApi } from "@/lib/api";
import { COUPON_KEY } from "@/lib/checkout";
import { dealPricing } from "@/lib/deal";
import { orderNumber } from "@/lib/orders";
import { formatGHS } from "@/lib/price";
import { useCartStore } from "@/store/cartStore";
import { useOrdersStore } from "@/store/ordersStore";

const REGIONS = [
  "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East",
  "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North",
];

interface Address {
  id: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  country?: string | null;
  is_default?: boolean;
}

interface PlacedOrder {
  id: string;
  checkout_group?: string;
  total: string;
  shipping: string;
  tax: string;
  discount: string;
  shipping_warning?: string;
  vendor?: { name: string } | null;
}


// Payment is by transfer to GrottoMore's own bank or mobile money accounts; the
// shopper then submits proof, and an admin confirms it before the order is paid.
const Checkout = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useIsAuthenticated();
  const cart = useCartStore((s) => s.cart);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const addOrder = useOrdersStore((s) => s.addOrder);
  const createAddress = useCreateAddress();

  const [coupon, setCoupon] = useState(() => sessionStorage.getItem(COUPON_KEY) || "");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder[] | null>(null);
  const [addressForm, setAddressForm] = useState({ line1: "", city: "", state: "Greater Accra" });
  const [addressError, setAddressError] = useState<string | null>(null);
  const [proofSent, setProofSent] = useState(false);
  const accountsQuery = useQuery({ queryKey: ["payments", "accounts"], queryFn: paymentsApi.listAccounts });
  const accounts = accountsQuery.data ?? [];

  useEffect(() => {
    if (isAuthenticated) fetchCart().catch(() => undefined);
  }, [isAuthenticated, fetchCart]);

  const addresses = ((user as { addresses?: Address[] } | undefined)?.addresses || []) as Address[];
  const address = addresses.find((a) => a.is_default) || addresses[0];

  const items = useMemo(() => (Array.isArray(cart) ? cart.filter((i) => i?.product) : []), [cart]);
  const summary = useMemo(() => {
    let subtotal = 0;
    let saved = 0;
    let count = 0;
    for (const i of items) {
      const p = dealPricing(i.product);
      subtotal += p.price * (i.quantity || 0);
      saved += (p.save ?? 0) * (i.quantity || 0);
      count += i.quantity || 0;
    }
    return { subtotal, saved, count };
  }, [items]);

  if (!authLoading && !isAuthenticated) return <Navigate to="/login?next=/checkout&reason=checkout" replace />;

  const saveAddress = async (e: FormEvent) => {
    e.preventDefault();
    setAddressError(null);
    if (!addressForm.line1.trim() || !addressForm.city.trim()) {
      setAddressError("Add a house number, street or landmark, and your town or area, so the rider can find you.");
      return;
    }
    try {
      await createAddress.mutateAsync({ ...addressForm, country: "Ghana", is_default: true });
    } catch {
      setAddressError("We couldn’t save that address. Check your connection and try again.");
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const code = coupon.trim().toUpperCase();
      const result = await orderApi.checkout({ coupon_code: code || undefined });
      const orders: PlacedOrder[] = Array.isArray(result?.orders) ? result.orders : [result];
      orders.forEach((o) => addOrder(o as never));
      sessionStorage.removeItem(COUPON_KEY);
      setPlaced(orders);
      fetchCart().catch(() => undefined);
      window.scrollTo({ top: 0 });
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || "We couldn’t place your order. Check your connection and try again. Nothing was charged.");
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    const total = placed.reduce((n, o) => n + Number(o.total || 0), 0);
    const warning = placed.find((o) => o.shipping_warning)?.shipping_warning;
    return (
      <Layout mobileBar={{ kind: "title", title: "Order placed", back: "/" }}>
        <div className="container flex max-w-xl flex-col items-center gap-4 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-save-subtle text-save">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold">Order placed</h1>
          <p className="text-[15px] text-muted-foreground">
            {placed.length === 1 ? (
              <>Order <strong className="text-foreground">#{orderNumber(placed[0].id)}</strong>. Send the amount below to pay for it.</>
            ) : (
              <>Your items come from {placed.length} sellers, so we created {placed.length} orders. Send one payment for the total below.</>
            )}
          </p>
          <dl className="w-full rounded-lg border p-5 text-left text-[15px]">
            {placed.length > 1 &&
              placed.map((o) => (
                <div key={o.id} className="flex flex-col py-1 text-sm sm:flex-row sm:justify-between">
                  <dt className="text-muted-foreground">
                    Order #{orderNumber(o.id)}
                    {o.vendor?.name ? ` · ${o.vendor.name}` : ""}
                  </dt>
                  <dd className="tabular-prices">{formatGHS(o.total)}</dd>
                </div>
              ))}
            {[
              ["Delivery", placed.reduce((n, o) => n + Number(o.shipping || 0), 0)],
              ["Tax", placed.reduce((n, o) => n + Number(o.tax || 0), 0)],
              ["Coupon discount", -placed.reduce((n, o) => n + Number(o.discount || 0), 0)],
            ]
              .filter(([label, amount]) => label === "Delivery" || Number(amount) !== 0)
              .map(([label, amount]) => (
                <div key={label as string} className="flex justify-between py-1 text-sm text-muted-foreground">
                  <dt>{label}</dt>
                  <dd className="tabular-prices">
                    {Number(amount) < 0 ? `−${formatGHS(-Number(amount))}` : formatGHS(Number(amount))}
                  </dd>
                </div>
              ))}
            <div className="mt-1 flex justify-between border-t pt-2.5 text-lg font-bold">
              <dt>Send this amount</dt>
              <dd className="tabular-prices">{formatGHS(total)}</dd>
            </div>
            {address && (
              <div className="mt-3 flex flex-col gap-0.5 border-t pt-3 text-sm">
                <dt className="text-muted-foreground">Deliver to</dt>
                <dd>
                  {address.line1}, {address.city}
                </dd>
              </div>
            )}
          </dl>
          <div className="flex w-full flex-col gap-4 rounded-lg border p-5 text-left">
            <h2 className="text-lg font-bold">Send this amount</h2>
            {accountsQuery.isError ? (
              <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive-subtle p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                We couldn’t load the payment accounts. Check your connection and refresh.
              </p>
            ) : accountsQuery.isPending ? (
              <p role="status" className="text-sm text-muted-foreground">
                Loading payment accounts…
              </p>
            ) : (
              <PaymentAccountsList accounts={accounts} amount={total} />
            )}
            {proofSent ? (
              <p role="status" className="rounded-md bg-save-subtle p-3 text-sm text-save">
                Thanks — we’re checking your payment. We’ll notify you when it’s confirmed.
              </p>
            ) : (
              <>
                <h3 className="text-base font-bold">Paid already? Tell us.</h3>
                <PaymentProofForm
                  accounts={accounts}
                  target={placed[0].checkout_group ? { checkoutGroup: placed[0].checkout_group } : { orderIds: placed.map((o) => o.id) }}
                  defaultSenderName={[user?.first_name, user?.last_name].filter(Boolean).join(" ")}
                  onSubmitted={() => setProofSent(true)}
                />
              </>
            )}
          </div>
          {warning && (
            <p className="flex items-start gap-2 rounded-lg bg-deal-subtle p-3 text-left text-sm text-deal-strong">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {warning}
            </p>
          )}
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to={placed.length === 1 ? `/orders/${placed[0].id}` : "/orders"}>Track this order</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products">Keep shopping</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const step = "flex flex-col gap-3 rounded-lg border p-5";
  const stepTitle = "flex items-center gap-2 text-lg font-bold";

  return (
    <Layout mobileBar={{ kind: "title", title: "Checkout", back: "/cart" }} hideTabBar footer={false}>
      <div className="container max-w-3xl pb-36 pt-4 lg:pb-16 lg:pt-8">
        <h1 className="mb-6 hidden text-[30px] font-bold leading-[38px] lg:block">Checkout</h1>

        {items.length === 0 && !authLoading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <h2 className="text-lg font-bold">Your cart is empty</h2>
            <Button asChild>
              <Link to="/products">Browse deals</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <section aria-labelledby="delivery-heading" className={step}>
              <h2 id="delivery-heading" className={stepTitle}>
                <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                1. Delivery
              </h2>
              {address ? (
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[15px]">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {address.city}
                    {address.state ? `, ${address.state}` : ""}
                  </p>
                  <Link to="/profile" className="flex min-h-12 shrink-0 items-center text-sm font-semibold text-primary">
                    Change
                  </Link>
                </div>
              ) : (
                <form onSubmit={saveAddress} className="flex flex-col gap-4" noValidate>
                  <p className="text-sm text-muted-foreground">Needed to place the order and work out the delivery fee.</p>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="region">Region</Label>
                    <Select value={addressForm.state} onValueChange={(v) => setAddressForm({ ...addressForm, state: v })}>
                      <SelectTrigger id="region" className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="city">Town or area</Label>
                    <Input
                      id="city"
                      autoComplete="address-level2"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="line1">House, street and landmark</Label>
                    <Input
                      id="line1"
                      autoComplete="street-address"
                      value={addressForm.line1}
                      aria-invalid={!!addressError && !addressForm.line1.trim()}
                      aria-describedby={addressError ? "address-error" : undefined}
                      onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                    />
                  </div>
                  {addressError && (
                    <p id="address-error" className="flex items-start gap-1.5 text-[13px] text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {addressError}
                    </p>
                  )}
                  <Button type="submit" variant="outline" disabled={createAddress.isPending} className="self-start">
                    {createAddress.isPending ? "Saving…" : "Save address"}
                  </Button>
                </form>
              )}
            </section>

            <section aria-labelledby="payment-heading" className={step}>
              <h2 id="payment-heading" className={stepTitle}>
                <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
                2. How to pay
              </h2>
              {accountsQuery.isSuccess && accounts.length === 0 ? (
                <p role="alert" className="flex items-start gap-2 rounded-md bg-deal-subtle p-3 text-sm text-deal-strong">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Payments are being set up. Please check back soon.
                </p>
              ) : accountsQuery.isError ? (
                <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive-subtle p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  We couldn’t load the payment accounts. Check your connection and refresh.
                </p>
              ) : (
                <>
                  <PaymentAccountsList accounts={accounts} />
                  <p className="text-sm text-muted-foreground">You’ll see the exact amount to send after you place your order.</p>
                </>
              )}
            </section>

            <section aria-labelledby="summary-heading" className={step}>
              <h2 id="summary-heading" className={stepTitle}>
                <Package className="h-5 w-5 text-primary" aria-hidden="true" />
                3. Order summary
              </h2>
              <dl className="flex flex-col gap-2.5 text-[15px]">
                <div className="flex justify-between">
                  <dt>
                    {summary.count} {summary.count === 1 ? "item" : "items"}
                  </dt>
                  <dd className="tabular-prices">{formatGHS(summary.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Delivery and any tax</dt>
                  <dd className="text-right text-muted-foreground">Added when you place the order</dd>
                </div>
                {summary.saved > 0 && (
                  <div className="rounded-[6px] bg-save-subtle px-2.5 py-1.5 text-sm font-bold text-save tabular-prices">
                    You save {formatGHS(summary.saved)}
                  </div>
                )}
              </dl>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="checkout-coupon">Coupon code (optional)</Label>
                <Input
                  id="checkout-coupon"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="uppercase"
                />
              </div>
              <Link to="/cart" className="flex min-h-12 items-center self-start text-sm font-semibold text-primary">
                Edit items
              </Link>
            </section>

            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-lg bg-destructive-subtle px-4 py-3.5 text-destructive">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <strong className="text-[15px]">Order not placed</strong>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="fixed inset-x-0 bottom-0 z-sticky border-t bg-background px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-lg lg:static lg:border-0 lg:p-0 lg:shadow-none">
              <Button variant="deal" size="lg" className="w-full" onClick={placeOrder} disabled={placing || !address || accounts.length === 0}>
                {placing ? "Placing order…" : "Place order"}
              </Button>
              {!address && <p className="mt-1.5 text-center text-[13px] text-muted-foreground">Save a delivery address to continue</p>}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Checkout;
