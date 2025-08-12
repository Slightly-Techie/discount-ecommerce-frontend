import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { categoryApi } from "@/lib/api";
import { Upload, FileText, FileJson, Download, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CategoryUploadData {
  name: string;
  slug: string;
  description: string;
  parent?: string;
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

export function BulkUploadCategories() {
  console.log('BulkUploadCategories component rendered');
  const { toast } = useToast();
  const [uploadMethod, setUploadMethod] = useState<'json' | 'csv'>('json');
  const [jsonData, setJsonData] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample JSON template
  const sampleJson = `[
  {
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic devices and gadgets",
    "parent": ""
  },
  {
    "name": "Food & Beverages",
    "slug": "food-beverages",
    "description": "Food and drink products",
    "parent": ""
  },
  {
    "name": "Home & Kitchen",
    "slug": "home-kitchen",
    "description": "Home and kitchen appliances",
    "parent": ""
  },
  {
    "name": "Sports & Fitness",
    "slug": "sports-fitness",
    "description": "Sports equipment and fitness gear",
    "parent": ""
  }
]`;

  // Sample CSV template
  const sampleCsv = `name,slug,description,parent
"Electronics","electronics","Electronic devices and gadgets",""
"Food & Beverages","food-beverages","Food and drink products",""
"Home & Kitchen","home-kitchen","Home and kitchen appliances",""
"Sports & Fitness","sports-fitness","Sports equipment and fitness gear",""`;

  const downloadTemplate = (type: 'json' | 'csv') => {
    const content = type === 'json' ? sampleJson : sampleCsv;
    const blob = new Blob([content], { type: type === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories-template.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string): CategoryUploadData[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const categories: CategoryUploadData[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const category: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        let value: any = values[index];
        category[header] = value;
      });
      
      categories.push(category as CategoryUploadData);
    }
    
    return categories;
  };

  const validateCategories = (categories: CategoryUploadData[]): { valid: CategoryUploadData[], errors: string[] } => {
    const valid: CategoryUploadData[] = [];
    const errors: string[] = [];
    
    categories.forEach((category, index) => {
      const categoryErrors: string[] = [];
      
      if (!category.name) categoryErrors.push('Name is required');
      if (!category.slug) categoryErrors.push('Slug is required');
      if (!category.description) categoryErrors.push('Description is required');
      
      if (categoryErrors.length > 0) {
        errors.push(`Category ${index + 1}: ${categoryErrors.join(', ')}`);
      } else {
        valid.push(category);
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

  const processFile = async (file: File): Promise<CategoryUploadData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const categories = parseCSV(content);
          resolve(categories);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
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
      let categories: CategoryUploadData[] = [];
      
      if (uploadMethod === 'json') {
        try {
          categories = JSON.parse(jsonData);
        } catch (error) {
          toast({ title: "Invalid JSON", description: "Please check your JSON format", variant: "destructive" });
          setIsUploading(false);
          return;
        }
      } else {
        if (csvFile) {
          categories = await processFile(csvFile);
        }
      }
      
      if (!Array.isArray(categories)) {
        toast({ title: "Error", description: "Data must be an array of categories", variant: "destructive" });
        setIsUploading(false);
        return;
      }
      
      // Validate categories
      const { valid, errors } = validateCategories(categories);
      
      if (valid.length === 0) {
        toast({ title: "Validation Error", description: "No valid categories found", variant: "destructive" });
        setUploadResult({ success: false, message: "Validation failed", errors });
        setIsUploading(false);
        return;
      }
      
      setUploadProgress(50);
      
      // Upload to API
      const response = await categoryApi.bulkUploadCategories(valid);
      
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
            Bulk Upload Categories
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
                {uploadProgress}% complete
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
                Upload Categories
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
                
                {/* Created Categories */}
                {uploadResult.createdItems && uploadResult.createdItems.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-green-700 mb-2">✅ Created Categories:</p>
                    <ul className="text-sm text-green-600 space-y-1">
                      {uploadResult.createdItems.map((category, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span>• {category.name}</span>
                          <Badge variant="outline" className="text-xs">ID: {category.id}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Already Existing Categories */}
                {uploadResult.errorDetails && uploadResult.errorDetails.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-orange-700 mb-2">⚠️ Already Exist:</p>
                    <ul className="text-sm text-orange-600 space-y-1">
                      {uploadResult.errorDetails.map((error, index) => {
                        const originalIndex = error.index;
                        const categoryName = valid[originalIndex]?.name || `Item ${originalIndex + 1}`;
                        return (
                          <li key={index} className="flex items-center gap-2">
                            <span>• {categoryName}</span>
                            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700">
                              Already exists
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                
                {/* Validation Errors */}
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-700 mb-2">❌ Validation Errors:</p>
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