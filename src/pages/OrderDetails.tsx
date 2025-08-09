import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/hooks/useOrders";
import { ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function OrderDetailsContent() {
  const { orderId } = useParams();
  const { data: order, isLoading, error } = useOrder(orderId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Link to="/orders">
          <Button variant="ghost" className="mb-4"><ArrowLeft className="h-4 w-4 mr-2"/>Back to Orders</Button>
        </Link>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading order...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load order.</p>
          </div>
        )}

        {!isLoading && !error && order && (
          <Card>
            <CardHeader>
              <CardTitle>Order #{order.id?.slice?.(0,8) || order.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">Status: {order.status || 'Pending'}</div>
              <div className="space-y-3">
                {(order.items || order.line_items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="font-medium">{item.product?.name || item.name}</div>
                      <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-medium">${Number(item.total || item.price || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-end gap-6 text-sm">
                <div>Total: <span className="font-semibold">${Number(order.total || order.amount || 0).toFixed(2)}</span></div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function OrderDetails() {
  return (
    <ProtectedRoute>
      <OrderDetailsContent />
    </ProtectedRoute>
  );
} 