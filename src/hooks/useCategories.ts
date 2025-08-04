import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { categoryApi } from "@/lib/api";
import { useToast } from "./use-toast";
import { Category } from "@/types"; // Adjust if needed

export const useCategories = () => {
  const { toast } = useToast();

  return useQuery<Category[], Error>(
    {
      queryKey: ['categories'],
      queryFn: () => categoryApi.getCategories(),
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          variant: "destructive",
        });
      },
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Categories fetched successfully",
        });
      },
    } as UseQueryOptions<Category[], Error> // 👈 This fixes the TS error
  );
};
