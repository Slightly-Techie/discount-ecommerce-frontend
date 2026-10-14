import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, Loader2, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import type { AdminOrder, OrderStatus } from "@/types";
import { EmptyRow, Pager, SearchBox, apiErrorMessage, formatMoney, useAdminList } from "./shared";

// Mirrors Order.can_transition on the backend
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={`capitalize ${STATUS_STYLES[status] ?? ""}`}>
      {status}
    </Badge>
  );
}

export function OrdersAdmin() {
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const list = useAdminList<AdminOrder>(
    ["admin", "orders"],
    adminApi.getOrders,
    statusFilter === "all" ? {} : { status: statusFilter }
  );
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search by customer email or tracking #…" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              list.setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {Object.keys(TRANSITIONS).map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading ? (
                <EmptyRow colSpan={7}>
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Loading orders…
                </EmptyRow>
              ) : list.rows.length === 0 ? (
                <EmptyRow colSpan={7}>No orders found.</EmptyRow>
              ) : (
                list.rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">#{o.id.slice(0, 8)}</TableCell>
                    <TableCell>{o.user_email}</TableCell>
                    <TableCell>{o.vendor?.name ?? <span className="text-muted-foreground">Platform</span>}</TableCell>
                    <TableCell className="whitespace-nowrap">{format(new Date(o.checked_out_at), "PP")}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(o.total)}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" aria-label="Manage order" onClick={() => setSelected(o)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pager page={list.page} count={list.count} onPageChange={list.setPage} isFetching={list.isFetching} />
      </CardContent>

      <OrderDialog order={selected} onClose={() => setSelected(null)} />
    </Card>
  );
}

function OrderDialog({ order, onClose }: { order: AdminOrder | null; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [tracking, setTracking] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (order) {
      setStatus("");
      setTracking(order.tracking_number ?? "");
      setNote(order.admin_note ?? "");
    }
  }, [order]);

  const save = useMutation({
    mutationFn: async () => {
      // Save tracking/note first, then the status change (which also emails the customer)
      await adminApi.updateOrder(order!.id, { tracking_number: tracking, admin_note: note });
      if (status) await adminApi.updateOrder(order!.id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Order updated" });
      onClose();
    },
    onError: (error) => toast({ title: "Update failed", description: apiErrorMessage(error), variant: "destructive" }),
  });

  if (!order) return null;
  const next = TRANSITIONS[order.status] ?? [];

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order #{order.id.slice(0, 8)} <StatusBadge status={order.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Customer</p>
            <p>{order.user_email}</p>
            {order.address && (
              <p className="text-muted-foreground">
                {order.address.line1}
                {order.address.line2 && `, ${order.address.line2}`}, {order.address.city}, {order.address.state}{" "}
                {order.address.postal_code}, {order.address.country}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Summary</p>
            <p>Vendor: {order.vendor?.name ?? "Platform"}</p>
            <p>Placed: {format(new Date(order.checked_out_at), "PPP p")}</p>
            {order.coupon && <p>Coupon: {order.coupon.code}</p>}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.product_name}</TableCell>
                  <TableCell className="text-right">{i.quantity}</TableCell>
                  <TableCell className="text-right">{formatMoney(i.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-2 text-sm bg-muted/40 grid grid-cols-2 gap-x-4">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-right">{formatMoney(order.shipping)}</span>
            <span className="text-muted-foreground">Tax</span>
            <span className="text-right">{formatMoney(order.tax)}</span>
            <span className="text-muted-foreground">Discount</span>
            <span className="text-right">-{formatMoney(order.discount)}</span>
            <span className="font-semibold">Total</span>
            <span className="text-right font-semibold">{formatMoney(order.total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="order-status">Change status</Label>
            <select
              id="order-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus | "")}
              disabled={next.length === 0}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{next.length === 0 ? "Final status" : "Keep current status"}</option>
              {next.map((s) => (
                <option key={s} value={s}>
                  Mark as {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="order-tracking">Tracking number</Label>
            <Input id="order-tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="order-note">Admin note (internal)</Label>
            <Textarea id="order-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
