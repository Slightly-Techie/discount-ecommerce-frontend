import { useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { categoryApi } from "@/lib/api";
import { toast, useToast } from "./use-toast";
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


// hooks/useCategories.ts
export const useCreateCategory = () => {
  return useMutation({
    mutationFn: (newCategory: Category) =>
      categoryApi.createCategories(newCategory),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    } 
  });
};
// export const useUpdateCategory = () => {
//   return useMutation({
//     mutationFn: (updatedCategory: Category) =>
//       categoryApi.updateCategory(updatedCategory),
//     ...
//   });
// };