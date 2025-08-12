import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/hooks/useOrders";
import { Link } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Package } from "lucide-react";

function OrdersContent() {
  const { data: orders = [], isLoading, error } = useOrders();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  console.log('Orders page - orders data:', orders);
  console.log('Orders page - orders length:', orders.length);
  console.log('Orders page - isLoading:', isLoading);
  console.log('Orders page - error:', error);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'pending') return orders.filter((o: any) => (o.status || '').toLowerCase() !== 'completed');
    return orders.filter((o: any) => (o.status || '').toLowerCase() === 'completed');
  }, [orders, filter]);

  console.log('Orders page - filtered orders:', filtered);
  console.log('Orders page - filtered length:', filtered.length);

  const EmptyState = (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
      <p className="text-muted-foreground mb-6">When you place an order, it will show up here.</p>
      <Link to="/products">
        <Button>Start Shopping</Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <div className="flex gap-2">
            <Button variant={filter==='all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
            <Button variant={filter==='pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
            <Button variant={filter==='completed' ? 'default' : 'outline'} onClick={() => setFilter('completed')}>Completed</Button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading orders...</p>
          </div>
        )}

        {/* Treat missing/none as empty state instead of error UI */}
        {!isLoading && error && EmptyState}

        {!isLoading && !error && (
          filtered.length === 0 ? (
            EmptyState
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((order: any) => (
                <Card key={order.id}>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Order #{order.id?.slice?.(0,8) || order.id}</CardTitle>
                    <Badge variant={ (order.status || '').toLowerCase() === 'completed' ? 'secondary' : 'outline'}>
                      {order.status || 'Pending'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Items: {order.items?.length || order.item_count || 0}</p>
                      <p className="text-sm text-muted-foreground">Total: ${Number(order.total || order.amount || 0).toFixed(2)}</p>
                    </div>
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default function Orders() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
} 