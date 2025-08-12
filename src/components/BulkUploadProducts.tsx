import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { productApi, categoryApi } from "@/lib/api";
import { Upload, FileText, FileJson, Download, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProductsStore } from "@/store/productsStore";

interface ProductUploadData {
  name: string;
  description: string;
  price: string;
  discount_price?: string;
  discount_start?: string;
  discount_end?: string;
  image_url: string;
  category: string;
  tags?: string[]; // Optional
  status: 'active' | 'inactive';
  is_available: boolean;
  is_featured: boolean;
  stock: number;
  related_products?: string[]; // Optional
}

interface BulkUploadResult {
  success: boolean;
  message: string;
  created?: number;
  failed?: number;
  errors?: string[];
  createdItems?: any[];
  errorDetails?: any[];
}

export function BulkUploadProducts() {
  console.log('BulkUploadProducts component rendered');
  const { toast } = useToast();
  const forceRefreshProducts = useProductsStore((state) => state.forceRefreshProducts);
  const addBulkProducts = useProductsStore((state) => state.addBulkProducts);
  const [uploadMethod, setUploadMethod] = useState<'json' | 'csv'>('json');
  const [jsonData, setJsonData] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to resolve category names to IDs
  const resolveCategoryIds = async (products: ProductUploadData[]): Promise<{ resolved: ProductUploadData[], errors: string[] }> => {
    const errors: string[] = [];
    const resolved: ProductUploadData[] = [];
    
    try {
      // Fetch all categories
      const categories = await categoryApi.getCategories();
      const categoryMap = new Map<string, string>();
      
      // Create a map of category names to IDs
      categories.forEach((category: any) => {
        categoryMap.set(category.name.toLowerCase(), category.id);
        categoryMap.set(category.slug.toLowerCase(), category.id);
      });
      
      // Process each product
      products.forEach((product, index) => {
        const categoryName = product.category;
        const categoryId = categoryMap.get(categoryName.toLowerCase());
        
        if (categoryId) {
          // Replace category name with ID and ensure optional fields are set
          resolved.push({
            ...product,
            category: categoryId,
            tags: product.tags || [],
            related_products: product.related_products || []
          });
        } else {
          errors.push(`Product ${index + 1} (${product.name}): Category "${categoryName}" not found`);
        }
      });
      
    } catch (error) {
      errors.push('Failed to fetch categories from server');
    }
    
    return { resolved, errors };
  };

  // Sample JSON template
  const sampleJson = `[
  {
    "name": "Sample Product",
    "description": "This is a sample product description",
    "price": "99.99",
    "discount_price": "79.99",
    "discount_start": "2024-01-01T00:00:00Z",
    "discount_end": "2024-12-31T23:59:59Z",
    "image_url": "https://example.com/image.jpg",
    "category": "Electronics",
    "tags": [],
    "status": "active",
    "is_available": true,
    "is_featured": false,
    "stock": 100,
    "related_products": []
  }
]`;

  // Sample CSV template
  const sampleCsv = `name,description,price,discount_price,discount_start,discount_end,image_url,category,tags,status,is_available,is_featured,stock,related_products
"Sample Product","This is a sample product description","99.99","79.99","2024-01-01T00:00:00Z","2024-12-31T23:59:59Z","https://example.com/image.jpg","Electronics","","active","true","false","100",""`;

  const downloadTemplate = (type: 'json' | 'csv') => {
    const content = type === 'json' ? sampleJson : sampleCsv;
    const blob = new Blob([content], { type: type === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-template.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string): ProductUploadData[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const products: ProductUploadData[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const product: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        let value: any = values[index];
        
        // Handle boolean values
        if (header === 'is_available' || header === 'is_featured') {
          value = value === 'true';
        }
        
        // Handle array values
        if (header === 'tags') {
          value = value ? value.split(',').map((tag: string) => tag.trim()) : [];
        }
        
        // Handle optional arrays
        if (header === 'related_products') {
          value = value ? value.split(',').map((id: string) => id.trim()) : [];
        }
        
        product[header] = value;
      });
      
      products.push(product as ProductUploadData);
    }
    
    return products;
  };

  const validateProducts = (products: ProductUploadData[]): { valid: ProductUploadData[], errors: string[] } => {
    const valid: ProductUploadData[] = [];
    const errors: string[] = [];
    
    products.forEach((product, index) => {
      const productErrors: string[] = [];
      
      if (!product.name) productErrors.push('Name is required');
      if (!product.description) productErrors.push('Description is required');
      if (!product.price) productErrors.push('Price is required');
      if (!product.category) productErrors.push('Category is required');
      if (!product.image_url) productErrors.push('Image URL is required');
      
      if (productErrors.length > 0) {
        errors.push(`Product ${index + 1}: ${productErrors.join(', ')}`);
      } else {
        // Ensure optional fields are properly set
        const validatedProduct = {
          ...product,
          tags: product.tags || [],
          related_products: product.related_products || []
        };
        valid.push(validatedProduct);
      }
    });
    
    return { valid, errors };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (uploadMethod === 'csv') {
      setCsvFile(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setJsonData(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const processFile = async (file: File): Promise<ProductUploadData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const products = parseCSV(content);
          resolve(products);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      const categories = response.data;
      const categoryMap: { [key: string]: string } = {};
      categories.forEach((category: any) => {
        categoryMap[category.name] = category.id;
      });
      return categoryMap;
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({ title: "Error", description: "Failed to fetch categories for bulk upload.", variant: "destructive" });
      return {};
    }
  };

  const handleUpload = async () => {
    if (uploadMethod === 'json' && !jsonData.trim()) {
      toast({ title: "Error", description: "Please enter JSON data or upload a file", variant: "destructive" });
      return;
    }
    
    if (uploadMethod === 'csv' && !csvFile) {
      toast({ title: "Error", description: "Please select a CSV file", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);
    
    try {
      let products: ProductUploadData[] = [];
      
      if (uploadMethod === 'json') {
        try {
          products = JSON.parse(jsonData);
        } catch (error) {
          toast({ title: "Invalid JSON", description: "Please check your JSON format", variant: "destructive" });
          setIsUploading(false);
          return;
        }
      } else {
        if (csvFile) {
          products = await processFile(csvFile);
        }
      }
      
      if (!Array.isArray(products)) {
        toast({ title: "Error", description: "Data must be an array of products", variant: "destructive" });
        setIsUploading(false);
        return;
      }
      
      // Validate products
      const { valid, errors } = validateProducts(products);
      
      if (valid.length === 0) {
        toast({ title: "Validation Error", description: "No valid products found", variant: "destructive" });
        setUploadResult({ success: false, message: "Validation failed", errors });
        setIsUploading(false);
        return;
      }
      
      setUploadProgress(25);
      
      // Resolve category names to IDs
      const { resolved: productsWithIds, errors: categoryErrors } = await resolveCategoryIds(valid);
      
      if (categoryErrors.length > 0) {
        toast({ title: "Category Resolution Error", description: `${categoryErrors.length} products have invalid categories`, variant: "destructive" });
        setUploadResult({ 
          success: false, 
          message: "Category resolution failed", 
          errors: categoryErrors 
        });
        setIsUploading(false);
        return;
      }
      
      if (productsWithIds.length === 0) {
        toast({ title: "No Valid Products", description: "No products with valid categories found", variant: "destructive" });
        setUploadResult({ success: false, message: "No valid products after category resolution" });
        setIsUploading(false);
        return;
      }
      
      setUploadProgress(50);
      
      // Upload to API with resolved category IDs
      const response = await productApi.bulkUploadProducts(productsWithIds);
      
      setUploadProgress(100);
      
      // Handle the new response format
      const createdCount = response.created?.length || 0;
      const errorCount = response.errors?.length || 0;
      const totalSubmitted = valid.length;
      
      const result: BulkUploadResult = {
        success: createdCount > 0,
        message: `Upload completed: ${createdCount} created, ${errorCount} already exist`,
        created: createdCount,
        failed: errorCount,
        createdItems: response.created || [],
        errorDetails: response.errors || [],
        errors: errors.length > 0 ? errors : undefined
      };
      
      setUploadResult(result);
      toast({ title: "Success", description: result.message });
      
      // Force refresh the products store to show newly uploaded products
      if (createdCount > 0) {
        try {
          console.log('Force refreshing products store...');
          await forceRefreshProducts();
          console.log('Products store refreshed successfully');
          toast({ title: "Products Updated", description: "Product list has been refreshed with new items." });
        } catch (error) {
          console.error('Error refreshing products store:', error);
          
          // Fallback: Try to add created products directly to store
          if (response.created && response.created.length > 0) {
            console.log('Adding created products directly to store:', response.created);
            addBulkProducts(response.created);
            toast({ title: "Products Added", description: "New products have been added to the store." });
          } else {
            toast({ title: "Warning", description: "Products uploaded but refresh failed. Please refresh the page manually.", variant: "destructive" });
          }
        }
      }
      
      // Reset form
      setJsonData('');
      setCsvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      setUploadResult({ success: false, message: errorMessage });
      toast({ title: "Upload Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Method Selection */}
          <div className="space-y-4">
            <Label>Upload Method</Label>
            <div className="flex gap-4">
              <Button
                variant={uploadMethod === 'json' ? 'default' : 'outline'}
                onClick={() => setUploadMethod('json')}
                className="flex items-center gap-2"
              >
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
              <Button
                variant={uploadMethod === 'csv' ? 'default' : 'outline'}
                onClick={() => setUploadMethod('csv')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {/* Template Download */}
          <div className="space-y-2">
            <Label>Download Template</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('json')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                JSON Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('csv')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                CSV Template
              </Button>
            </div>
          </div>

          {/* Upload Area */}
          {uploadMethod === 'json' ? (
            <div className="space-y-4">
              <Label>JSON Data</Label>
              <Textarea
                placeholder="Paste your JSON data here or upload a file..."
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload JSON File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Label>CSV File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Upload className="h-4 w-4" />
                  Select CSV File
                </Button>
                {csvFile && (
                  <div className="mt-2">
                    <Badge variant="secondary">{csvFile.name}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Label>Upload Progress</Label>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {uploadProgress < 25 && "Validating products..."}
                {uploadProgress >= 25 && uploadProgress < 50 && "Resolving category names..."}
                {uploadProgress >= 50 && uploadProgress < 75 && "Uploading to server..."}
                {uploadProgress === 100 && "Complete!"}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={isUploading || (!jsonData.trim() && !csvFile)}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Products
              </>
            )}
          </Button>

          {/* Upload Result */}
          {uploadResult && (
            <Card className={uploadResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  {uploadResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <h3 className="font-semibold">{uploadResult.message}</h3>
                </div>
                
                {uploadResult.created && (
                  <p className="text-sm text-green-700">
                    Successfully created: {uploadResult.created} products
                  </p>
                )}
                
                {uploadResult.failed && uploadResult.failed > 0 && (
                  <p className="text-sm text-red-700">
                    Failed: {uploadResult.failed} products
                  </p>
                )}
                
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                    <ul className="text-sm text-red-600 space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 