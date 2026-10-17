import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ProductManager from "@/components/ProductManager";
import { Package } from "lucide-react";
import type { ProductFilters } from "@/types";

interface VendorProductsPanelProps {
  filters: ProductFilters;
}

export function VendorProductsPanel({ filters }: VendorProductsPanelProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Your products</CardTitle>
              <p className="text-xs text-muted-foreground">
                Add and manage items in your store.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ProductManager filters={filters} mode="vendor" />
      </CardContent>
    </Card>
  );
}
