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
import { Product } from "@/types";

export default function ProductManager() {
  const { toast } = useToast();
  const { data: productsResponse } = useProducts();
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
    status: "active" as "active" | "inactive",
    is_available: true,
    is_featured: false,
    stock: "",
    related_products: "",
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      ...formData,
      price: formData.price,
      discount_price: formData.discount_price || undefined,
      discount_start: formData.discount_start || undefined,
      discount_end: formData.discount_end || undefined,
      image_url:
        formData.image_url ||
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
      tags: formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      stock: parseInt(formData.stock) || 0,
      related_products: formData.related_products
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    };

    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        product: productData,
      });
    } else {
      createProductMutation.mutate(productData);
    }

    resetForm();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      discount_price: product.discount_price || "",
      discount_start: product.discount_start || "",
      discount_end: product.discount_end || "",
      image_url: product.image_url,
      category: product.category.name,
      tags: product.tags.join(", "),
      status: product.status as "active" | "inactive",
      is_available: product.is_available,
      is_featured: product.is_featured,
      stock: product.stock.toString(),
      related_products: product.related_products?.join(", ") || "",
    });
    setIsAddingProduct(true);
  };

  const handleDelete = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
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
                    />
                  </div>
                  <div>
                  <Label htmlFor="category">Category *</Label>
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
  placeholder="Select a category"
  isClearable
  />
</div>


<div>
  <Label htmlFor="status">Status</Label>
  <Select
    options={statusOptions}
    value={statusOptions.find(option => option.value === formData.status) || null}
    onChange={(selected) =>
      setFormData(prev => ({
        ...prev,
        status: selected?.value as "active" | "inactive",
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
                    <Button type="submit" className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {editingProduct ? "Update" : "Add"} Product
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
                        ${product.price}
                      </span>
                      {product.discount_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.discount_price}
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
