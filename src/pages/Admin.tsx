import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { mockProducts } from "@/data/mockProducts";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Save, Package } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    image: "",
    category: "",
    brand: "",
    stock: "",
    tags: ""
  });

  const categories = Array.from(new Set(products.map(p => p.category)));
  const brands = ["Shoprite", "Melcom"];

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      image: "",
      category: "",
      brand: "",
      stock: "",
      tags: ""
    });
    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.brand) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const productData = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      originalPrice: parseFloat(formData.originalPrice) || parseFloat(formData.price),
      image: formData.image || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
      category: formData.category,
      brand: formData.brand,
      rating: editingProduct?.rating || 4.0,
      stock: parseInt(formData.stock) || 0,
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      featured: editingProduct?.featured || false,
      createdAt: editingProduct?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
      toast({
        title: "Product updated",
        description: `${productData.name} has been updated successfully`,
      });
    } else {
      setProducts(prev => [productData, ...prev]);
      toast({
        title: "Product added",
        description: `${productData.name} has been added successfully`,
      });
    }

    resetForm();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice.toString(),
      image: product.image,
      category: product.category,
      brand: product.brand,
      stock: product.stock.toString(),
      tags: product.tags.join(", ")
    });
    setIsAddingProduct(true);
  };

  const handleDelete = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast({
      title: "Product deleted",
      description: `${product?.name} has been deleted`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your products and inventory
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add/Edit Product Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="originalPrice">Original Price</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Electronics, Food & Beverages"
                    />
                  </div>

                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <Select value={formData.brand} onValueChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{product.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{product.brand}</Badge>
                          <Badge variant="secondary">{product.category}</Badge>
                          <span className="text-sm font-medium">${product.price}</span>
                          {product.originalPrice > product.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              ${product.originalPrice}
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
      </main>
    </div>
  );
}