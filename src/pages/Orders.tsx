import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Package } from "lucide-react";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrders } from "@/hooks/useOrders";
import { isActiveOrder, orderBadge, orderDate, orderNumber } from "@/lib/orders";
import { formatGHS } from "@/lib/price";

interface OrderRow {
  id: string;
  status?: string;
  total?: string;
  items?: { quantity?: number }[];
  checked_out_at?: string;
  created_at?: string;
}

function OrdersContent() {
  const { data, isLoading } = useOrders();
  const orders = useMemo(() => (data || []) as OrderRow[], [data]);
  const [tab, setTab] = useState<"active" | "past">("active");
  const shown = orders.filter((o) => (tab === "active" ? isActiveOrder(o.status) : !isActiveOrder(o.status)));

  return (
    <Layout mobileBar={{ kind: "title", title: "Orders", back: "/profile" }}>
      <div className="container max-w-3xl pb-12 pt-4 lg:pt-8">
        <h1 className="mb-4 hidden text-[30px] font-bold leading-[38px] lg:block">Your orders</h1>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "past")} className="mb-4">
          <TabsList aria-label="Orders">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading && orders.length === 0 ? (
          <ul aria-busy="true" className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-24 rounded-lg bg-skeleton" />
            ))}
          </ul>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={Package}
            title={tab === "active" ? "No active orders" : "No past orders yet"}
            description={
              tab === "active"
                ? "When you place an order, you can track it here."
                : "Delivered and cancelled orders show up here."
            }
            action={
              <Button asChild>
                <Link to="/products">Browse deals</Link>
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((o) => {
              const badge = orderBadge(o.status);
              const count = (o.items || []).reduce((n, i) => n + (i.quantity || 1), 0);
              return (
                <li key={o.id}>
                  <Link
                    to={`/orders/${o.id}`}
                    className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-bold">Order #{orderNumber(o.id)}</span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {orderDate(o.checked_out_at || o.created_at)}
                        {count > 0 && ` · ${count} ${count === 1 ? "item" : "items"}`}
                      </span>
                      <span className="text-base font-bold tabular-prices">{formatGHS(o.total)}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Layout>
  );
}

export default function Orders() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}
