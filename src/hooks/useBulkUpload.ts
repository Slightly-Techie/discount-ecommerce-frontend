import { useMutation } from "@tanstack/react-query";
import { productApi } from "@/lib/api";
import { useToast } from "./use-toast";

export const useBulkUpload = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (products: any[]) => productApi.bulkUploadProducts(products),
    onSuccess: (data) => {
      toast({
        title: "Bulk upload successful",
        description: `Successfully uploaded ${data.created || 0} products`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk upload failed",
        description: error.response?.data?.message || "An error occurred during upload",
        variant: "destructive",
      });
    },
  });
}; 