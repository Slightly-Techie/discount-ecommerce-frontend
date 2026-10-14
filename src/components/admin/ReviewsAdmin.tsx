import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Loader2, MessageSquare, Star, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import type { OrderReview, ProductReview } from "@/types";
import { ConfirmDelete, EmptyRow, Pager, SearchBox, apiErrorMessage, useAdminList } from "./shared";

const Stars = ({ rating }: { rating: number }) => (
  <span className="flex items-center gap-0.5 whitespace-nowrap">
    {Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
    ))}
  </span>
);

function ProductReviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const extra = filter === "all" ? {} : { is_approved: filter === "approved" ? "true" : "false" };
  const list = useAdminList<ProductReview>(["admin", "product-reviews"], adminApi.getProductReviews, extra);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin"] });
  const onError = (error: unknown) =>
    toast({ title: "Action failed", description: apiErrorMessage(error), variant: "destructive" });

  const moderate = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => adminApi.moderateProductReview(id, approved),
    onSuccess: (_d, { approved }) => {
      refresh();
      toast({ title: approved ? "Review approved" : "Review hidden" });
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteProductReview(id),
    onSuccess: () => {
      refresh();
      toast({ title: "Review deleted" });
    },
    onError,
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search review text, email or product…" />
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as any);
            list.setPage(1);
          }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="pending">Awaiting approval</option>
          <option value="approved">Approved</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              <EmptyRow colSpan={6}>
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading…
              </EmptyRow>
            ) : list.rows.length === 0 ? (
              <EmptyRow colSpan={6}>No reviews found.</EmptyRow>
            ) : (
              list.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.product_name}</TableCell>
                  <TableCell>{r.user_email}</TableCell>
                  <TableCell>
                    <Stars rating={r.rating} />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="line-clamp-2 text-sm">{r.review || "—"}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "PP")}</p>
                  </TableCell>
                  <TableCell>
                    {r.is_approved ? <Badge>approved</Badge> : <Badge variant="secondary">pending</Badge>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {r.is_approved ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={moderate.isPending}
                        onClick={() => moderate.mutate({ id: r.id, approved: false })}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Hide
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={moderate.isPending}
                        onClick={() => moderate.mutate({ id: r.id, approved: true })}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    )}
                    <ConfirmDelete title="Delete this review?" onConfirm={() => remove.mutate(r.id)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Pager page={list.page} count={list.count} onPageChange={list.setPage} isFetching={list.isFetching} />
    </>
  );
}

function OrderReviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const list = useAdminList<OrderReview>(["admin", "order-reviews"], adminApi.orderReviews.list);
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.orderReviews.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order-reviews"] });
      toast({ title: "Review deleted" });
    },
    onError: (error) => toast({ title: "Delete failed", description: apiErrorMessage(error), variant: "destructive" }),
  });

  return (
    <>
      <div className="mb-4">
        <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search review text or email…" />
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              <EmptyRow colSpan={5}>
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading…
              </EmptyRow>
            ) : list.rows.length === 0 ? (
              <EmptyRow colSpan={5}>No order reviews yet.</EmptyRow>
            ) : (
              list.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">#{String(r.order).slice(0, 8)}</TableCell>
                  <TableCell>{r.user_email}</TableCell>
                  <TableCell>
                    <Stars rating={r.rating} />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="line-clamp-2 text-sm">{r.review || "—"}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "PP")}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <ConfirmDelete title="Delete this review?" onConfirm={() => remove.mutate(r.id)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Pager page={list.page} count={list.count} onPageChange={list.setPage} isFetching={list.isFetching} />
    </>
  );
}

export function ReviewsAdmin() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Product reviews</TabsTrigger>
            <TabsTrigger value="orders">Order reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="products">
            <ProductReviews />
          </TabsContent>
          <TabsContent value="orders">
            <OrderReviews />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
