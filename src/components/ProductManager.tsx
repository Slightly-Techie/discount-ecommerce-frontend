import { useState } from "react";
import { Plus, Save, Edit, Trash2, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Select from "react-select";
import { useToast } from "@/hooks/use-toast";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Product, ProductFilters } from "@/types";
import type { ProductStatus } from "@/types/product";
import { adminApi } from "@/lib/api";
import { slugify } from "@/lib/apiErrors";
import { formatGHS } from "@/lib/price";

/** Map typed tag names to tag IDs, creating tags that don't exist yet. */
async function resolveTagIds(input: string): Promise<string[]> {
  const names = Array.from(new Set(input.split(",").map((t) => t.trim()).filter(Boolean)));
  if (names.length === 0) return [];
  const existing = (await adminApi.tags.list({ page_size: 100 })).results || [];
  const ids: string[] = [];
  for (const name of names) {
    const match = existing.find((t) => t.name.toLowerCase() === name.toLowerCase() || t.slug === slugify(name));
    if (match) ids.push(String(match.id));
    else ids.push(String((await adminApi.tags.create({ name, slug: slugify(name) })).id));
  }
  return ids;
}

const idsFrom = (items: unknown[] | undefined) =>
  (items || []).map((i) => (typeof i === "object" && i !== null ? String((i as { id: string }).id) : String(i)));

interface ProductManagerProps {
  filters?: ProductFilters;
}

export default function ProductManager({ filters }: ProductManagerProps) {
  const { toast } = useToast();
  const { data: productsResponse } = useProducts(filters);
  const products = productsResponse?.results || [];
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const { data: categoryMutation } = useCategories();

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount_price: "",
    discount_start: "",
    discount_end: "",
    image_url: "",
    category: "",
    tags: "",
    status: "active" as ProductStatus,
    is_available: true,
    is_featured: false,
    stock: "",
    related_products: "",
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      discount_price: "",
      discount_start: "",
      discount_end: "",
      image_url: "",
      category: "",
      tags: "",
      status: "active",
      is_available: true,
      is_featured: false,
      stock: "",
      related_products: "",
    });
    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Category is optional in the API, so only name and price are required here.
    if (!formData.name.trim() || !formData.price) {
      toast({
        title: "Add a name and price",
        description: "Product name and price are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const productData = {
        ...formData,
        price: formData.price,
        discount_price: formData.discount_price || undefined,
        discount_start: formData.discount_start || undefined,
        discount_end: formData.discount_end || undefined,
        image_url: formData.image_url.trim() || undefined,
        category: formData.category || undefined,
        tags: await resolveTagIds(formData.tags),
        stock: parseInt(formData.stock) || 0,
        related_products: formData.related_products
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      };

      if (editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct.id, product: productData as never });
      } else {
        await createProductMutation.mutateAsync(productData as never);
      }
      // Only clear the form once the save succeeded; on failure the input is kept.
      resetForm();
    } catch {
      // The mutation hooks show the API's reason in a toast.
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      discount_price: product.discount_price || "",
      // datetime-local inputs need "YYYY-MM-DDTHH:mm"; the API sends UTC ISO strings.
      discount_start: product.discount_start ? product.discount_start.slice(0, 16) : "",
      discount_end: product.discount_end ? product.discount_end.slice(0, 16) : "",
      image_url: product.image_url || "",
      category: product.category?.id ? String(product.category.id) : "",
      tags: (product.tags as unknown[])
        .map((t) => (typeof t === "object" && t !== null ? (t as { name: string }).name : String(t)))
        .join(", "),
      status: product.status,
      is_available: product.is_available,
      is_featured: product.is_featured,
      stock: product.stock.toString(),
      related_products: idsFrom(product.related_products).join(", "),
    });
    setIsAddingProduct(true);
  };

  const handleDelete = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "out_of_stock", label: "Out of stock" },
    { value: "draft", label: "Draft (hidden)" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Form */}
      <div className="lg:col-span-1">
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" />
              {editingProduct ? "Edit Product" : "Add New Product"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter product description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discount_price">Discount Price</Label>
                      <Input
                        id="discount_price"
                        type="text"
                        value={formData.discount_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="discount_start">Discount Start Date</Label>
                      <Input
                        id="discount_start"
                        type="datetime-local"
                        value={formData.discount_start}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_start: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="discount_end">Discount End Date</Label>
                      <Input
                        id="discount_end"
                        type="datetime-local"
                        value={formData.discount_end}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_end: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      inputMode="url"
                    />
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      A direct link to the image file (ends in .jpg, .png or .webp), not a search result page.
                    </p>
                  </div>
                  <div>
                  <Label htmlFor="category">Category</Label>
<Select
  options={categoryMutation?.map(c => ({
    value: c.id,
    label: c.name,
  })) || []}
  value={
    categoryMutation
      ?.map(c => ({ value: c.id, label: c.name }))
      .find(option => option.value === formData.category) || null
  }
  onChange={(selected) =>
    setFormData(prev => ({
      ...prev,
      category: selected?.value || "",
    }))
  }
  placeholder={categoryMutation?.length ? "Select a category (optional)" : "No categories yet"}
  isClearable
  />
  {!categoryMutation?.length && (
    <p className="mt-1 text-[13px] text-muted-foreground">
      Optional. Add categories under Categories so shoppers can browse by them.
    </p>
  )}
</div>


<div>
  <Label htmlFor="status">Status</Label>
  <Select
    options={statusOptions}
    value={statusOptions.find(option => option.value === formData.status) || null}
    onChange={(selected) =>
      setFormData(prev => ({
        ...prev,
        status: (selected?.value || "active") as ProductStatus,
      }))
    }
    placeholder="Select status"
    isClearable
  />
</div>

                  <div>
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="e.g., wireless, bluetooth, portable"
                    />
                  </div>

                  <div>
                    <Label htmlFor="related_products">Related Products (comma-separated IDs)</Label>
                    <Input
                      id="related_products"
                      value={formData.related_products}
                      onChange={(e) => setFormData(prev => ({ ...prev, related_products: e.target.value }))}
                      placeholder="e.g., uuid1, uuid2, uuid3"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_available"
                      checked={formData.is_available}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="is_available">Available</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="is_featured">Featured</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving…" : `${editingProduct ? "Update" : "Add"} Product`}
                    </Button>
                    {(isAddingProduct || editingProduct) && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <div className="lg:col-span-2">
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-white hover:shadow-md transition"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{product.status}</Badge>
                      <Badge variant="secondary">{product.category?.name}</Badge>
                      <span className="text-sm font-medium">
                        {formatGHS(product.price)}
                      </span>
                      {product.discount_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatGHS(product.discount_price)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
