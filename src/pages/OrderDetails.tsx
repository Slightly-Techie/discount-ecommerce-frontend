import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, ImageOff, MapPin, XCircle } from "lucide-react";

import { Layout } from "@/components/Layout";
import { PaymentAccountsList } from "@/components/PaymentAccountsList";
import { PaymentProofForm } from "@/components/PaymentProofForm";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStepper } from "@/components/ui/order-stepper";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAuthenticated } from "@/hooks/useAuth";
import { useOrder } from "@/hooks/useOrders";
import { paymentsApi } from "@/lib/api";
import { productImage } from "@/lib/deal";
import { orderBadge, orderDate, orderNumber, orderSteps } from "@/lib/orders";
import { formatGHS } from "@/lib/price";
import type { OrderPayment } from "@/types/payments";
import type { Product } from "@/types/product";

interface OrderItem {
  id?: string;
  product?: Product | null;
  product_name?: string;
  quantity: number;
  price: string;
}

interface OrderDetail {
  id: string;
  status?: string;
  total: string;
  shipping?: string;
  tax?: string;
  discount?: string;
  tracking_number?: string | null;
  checked_out_at?: string;
  created_at?: string;
  vendor?: { name: string } | null;
  address?: { line1: string; line2?: string | null; city: string; state?: string | null } | null;
  items?: OrderItem[];
  checkout_group?: string | null;
  payment?: OrderPayment | null;
}

function OrderDetailsContent() {
  const { orderId } = useParams();
  const { data, isLoading, error, refetch } = useOrder(orderId) as unknown as {
    data?: OrderDetail;
    isLoading: boolean;
    error: unknown;
    refetch?: () => Promise<unknown> | void;
  };
  const { user } = useIsAuthenticated();
  const isPending = data?.status === "pending";
  const awaitingReview = isPending && data?.payment?.status === "submitted";
  const accountsQuery = useQuery({
    queryKey: ["payments", "accounts"],
    queryFn: paymentsApi.listAccounts,
    enabled: isPending,
  });
  const accounts = accountsQuery.data ?? [];

  // While under review, pick up the admin's decision without a manual reload.
  useEffect(() => {
    if (!awaitingReview || !refetch) return;
    const id = window.setInterval(() => void refetch(), 30000);
    return () => window.clearInterval(id);
  }, [awaitingReview, refetch]);
  const title = data ? `Order #${orderNumber(data.id)}` : "Order";

  if (isLoading && !data) {
    return (
      <Layout mobileBar={{ kind: "title", title, back: "/orders" }}>
        <div aria-busy="true" className="container flex max-w-3xl flex-col gap-4 py-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout mobileBar={{ kind: "title", title, back: "/orders" }}>
        <EmptyState
          icon={AlertCircle}
          title="We couldn’t load this order"
          description="It may still be processing. Check your connection and try again."
          action={
            <>
              <Button onClick={() => (refetch ? refetch() : window.location.reload())}>Try again</Button>
              <Button variant="outline" asChild>
                <Link to="/orders">All orders</Link>
              </Button>
            </>
          }
        />
      </Layout>
    );
  }

  const badge = orderBadge(data.status, data.payment);
  const steps = orderSteps(data.status);
  const items = data.items || [];
  const subtotal = items.reduce((n, i) => n + Number(i.price || 0) * (i.quantity || 1), 0);
  const rows: [string, number][] = [
    ["Items", subtotal],
    ["Delivery", Number(data.shipping || 0)],
    ["Tax", Number(data.tax || 0)],
    ["Coupon discount", -Number(data.discount || 0)],
  ];

  return (
    <Layout mobileBar={{ kind: "title", title, back: "/orders" }}>
      <div className="container flex max-w-3xl flex-col gap-4 pb-12 pt-4 lg:pt-8">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold lg:text-[30px] lg:leading-[38px]">Order #{orderNumber(data.id)}</h1>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Placed {orderDate(data.checked_out_at || data.created_at)}
            {data.vendor?.name ? ` · Sold by ${data.vendor.name}` : ""}
          </p>
        </div>

        <section aria-label="Progress" className="rounded-lg border p-5">
          {steps ? (
            <OrderStepper steps={steps} />
          ) : (
            <p className="flex items-center gap-2 text-[15px] font-semibold text-destructive">
              <XCircle className="h-5 w-5" aria-hidden="true" />
              This order was cancelled.
            </p>
          )}
          {data.tracking_number && (
            <p className="mt-2 text-sm text-muted-foreground">
              Tracking number: <span className="font-semibold text-foreground">{data.tracking_number}</span>
            </p>
          )}
        </section>

        {data.status === "pending" && (
          <section aria-labelledby="payment-heading" className="flex flex-col gap-4 rounded-lg border p-5">
            <h2 id="payment-heading" className="text-lg font-bold">
              Payment
            </h2>
            {data.payment?.status === "submitted" ? (
              <p className="text-[15px]">Payment under review. We’ll notify you when it’s confirmed.</p>
            ) : (
              <>
                {data.payment?.status === "rejected" && (
                  <p role="alert" className="text-[15px] font-medium text-destructive">
                    {data.payment.rejection_reason
                      ? `We couldn’t confirm your payment: ${data.payment.rejection_reason}`
                      : "We couldn’t confirm your payment."}
                  </p>
                )}
                {accountsQuery.isError && (
                  <p role="alert" className="text-sm text-destructive">
                    We couldn’t load the payment accounts. Check your connection and refresh.
                  </p>
                )}
                <PaymentAccountsList accounts={accounts} amount={data.total} />
                <PaymentProofForm
                  accounts={accounts}
                  target={data.checkout_group ? { checkoutGroup: data.checkout_group } : { orderIds: [data.id] }}
                  defaultSenderName={[user?.first_name, user?.last_name].filter(Boolean).join(" ")}
                  onSubmitted={() => void refetch?.()}
                />
              </>
            )}
          </section>
        )}

        <section aria-labelledby="items-heading" className="rounded-lg border">
          <h2 id="items-heading" className="border-b px-5 py-3 text-lg font-bold">
            Items
          </h2>
          <ul className="divide-y">
            {items.map((item, idx) => {
              const image = item.product ? productImage(item.product) : null;
              const name = item.product?.name || item.product_name || "Item";
              return (
                <li key={item.id || idx} className="flex items-center gap-3 px-5 py-3">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                    {image ? (
                      <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain p-1" />
                    ) : (
                      <ImageOff className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    {item.product?.id ? (
                      <Link to={`/products/${item.product.id}`} className="line-clamp-2 text-[15px] font-medium hover:text-primary">
                        {name}
                      </Link>
                    ) : (
                      <span className="line-clamp-2 text-[15px] font-medium">{name}</span>
                    )}
                    <span className="text-[13px] text-muted-foreground">
                      {item.quantity} × {formatGHS(item.price)}
                    </span>
                  </div>
                  <span className="text-[15px] font-bold tabular-prices">{formatGHS(Number(item.price) * item.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="flex flex-col gap-1.5 border-t px-5 py-4 text-[15px]">
            {rows
              .filter(([label, amount]) => label === "Items" || label === "Delivery" || amount !== 0)
              .map(([label, amount]) => (
                <div key={label} className="flex justify-between text-muted-foreground">
                  <dt>{label}</dt>
                  <dd className="tabular-prices">{amount < 0 ? `−${formatGHS(-amount)}` : formatGHS(amount)}</dd>
                </div>
              ))}
            <div className="mt-1 flex justify-between border-t pt-2.5 text-lg font-bold">
              <dt>Total</dt>
              <dd className="tabular-prices">{formatGHS(data.total)}</dd>
            </div>
          </dl>
        </section>

        {data.address && (
          <section aria-labelledby="address-heading" className="flex gap-3 rounded-lg border p-5">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="text-[15px]">
              <h2 id="address-heading" className="font-bold">
                Delivery address
              </h2>
              <p className="text-muted-foreground">
                {data.address.line1}
                {data.address.line2 ? `, ${data.address.line2}` : ""}, {data.address.city}
                {data.address.state ? `, ${data.address.state}` : ""}
              </p>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

export default function OrderDetails() {
  return (
    <ProtectedRoute>
      <OrderDetailsContent />
    </ProtectedRoute>
  );
}
