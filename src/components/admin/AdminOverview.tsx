import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Package,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import { useVendorAction } from "@/hooks/useVendors";
import { formatMoney } from "./shared";

export const adminStatsKey = ["admin", "stats"] as const;

interface AdminOverviewProps {
  onNavigate: (tab: string) => void;
  onOpenVendor: (vendorId: string) => void;
}

export function AdminOverview({ onNavigate, onOpenVendor }: AdminOverviewProps) {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: adminStatsKey,
    queryFn: adminApi.getStats,
    refetchInterval: 60 * 1000,
  });
  const { data: pending } = useQuery({
    queryKey: ["vendors", "list", "admin", "pending-queue"],
    queryFn: () => adminApi.getVendors({ status: "pending", page_size: 5, ordering: "created_at" }),
    refetchInterval: 30 * 1000,
  });
  const approve = useVendorAction("approve");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading dashboard…
      </div>
    );
  }
  if (error || !stats) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3">
          <p className="text-destructive">Could not load dashboard stats.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const cards = [
    { label: "Revenue (paid+)", value: formatMoney(stats.revenue), icon: BarChart3, tab: "orders" },
    { label: "Orders", value: stats.orders.total, sub: `${stats.orders.pending} pending`, icon: ShoppingCart, tab: "orders" },
    { label: "Users", value: stats.users.total, sub: `${stats.users.active} active`, icon: Users, tab: "users" },
    { label: "Products", value: stats.products.total, sub: `${stats.products.active} active`, icon: Package, tab: "products" },
    { label: "Vendors", value: stats.vendors.total, sub: `${stats.vendors.approved} approved`, icon: Store, tab: "vendors" },
    {
      label: "Reviews to moderate",
      value: stats.pending_product_reviews,
      icon: MessageSquare,
      tab: "reviews",
    },
  ];

  const pendingVendors = pending?.results ?? [];

  return (
    <div className="space-y-6">
      {stats.vendors.pending > 0 && (
        <Card className="border-amber-300 bg-amber-50/80">
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-900">
                <span className="font-semibold">{stats.vendors.pending}</span>{" "}
                {stats.vendors.pending === 1 ? "vendor is" : "vendors are"} awaiting approval.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onNavigate("vendors")}>
              Review vendors
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, tab }) => (
          <button key={label} onClick={() => onNavigate(tab)} className="text-left">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                  {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                </div>
                <Icon className="h-8 w-8 text-primary" />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Awaiting approval</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("vendors")}>
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingVendors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" /> No pending vendor applications.
              </p>
            ) : (
              pendingVendors.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                  <button className="text-left min-w-0" onClick={() => onOpenVendor(v.id)}>
                    <p className="font-medium truncate">{v.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {v.owners?.[0]?.email} · {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                    </p>
                  </button>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => onOpenVendor(v.id)}>
                      Review
                    </Button>
                    <Button
                      size="sm"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate({ id: v.id, name: v.name })}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent orders</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("orders")}>
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recent_orders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No orders yet.</p>
            ) : (
              stats.recent_orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      #{o.id.slice(0, 8)} · {o.user_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(o.checked_out_at), "PP p")}
                      {o.vendor && ` · ${o.vendor.name}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{formatMoney(o.total)}</p>
                    <Badge variant="outline" className="capitalize">
                      {o.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
