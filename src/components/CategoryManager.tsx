import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";

// Utility to convert text to slug
const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word characters
    .replace(/\s+/g, "-"); // Replace spaces with -

const CategoryManager = () => {
  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();
  const [localCategories, setLocalCategories] = useState(categories || []);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name) return;
    const slug = generateSlug(name);

    createCategory.mutate(
      {
        id: "",
        name,
        slug,
      },
      {
        onSuccess: (newCategory) => {
          // Update UI immediately
          setLocalCategories((prev) => [...prev, newCategory]);
        },
      }
    );

    setName("");
    setDescription("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
            />
            <Button onClick={handleCreate}>Add</Button>
          </div>

          {[...(localCategories.length ? localCategories : categories || [])].map(
            (c) => (
              <div
                key={c.id || c.name}
                className="flex justify-between border p-2 rounded"
              >
                <div>
                  <p className="font-semibold">{c.name}</p>
                  {('description' in c) && (c as any).description && (
                    <p className="text-sm text-muted-foreground">{(c as any).description}</p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryManager;
