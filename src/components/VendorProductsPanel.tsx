import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BulkUploadProducts } from "@/components/BulkUploadProducts";
import ProductManager from "@/components/ProductManager";
import { Package, Upload } from "lucide-react";
import type { ProductFilters } from "@/types";

interface VendorProductsPanelProps {
  filters: ProductFilters;
}

export function VendorProductsPanel({ filters }: VendorProductsPanelProps) {
  const [tab, setTab] = useState<"list" | "bulk">("list");

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Your products</CardTitle>
              <p className="text-xs text-muted-foreground">
                Add, bulk-upload, and manage items in your store.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <ProductManager filters={filters} />
          </TabsContent>

          <TabsContent value="bulk" className="mt-4 space-y-4">
            <BulkUploadProducts />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

