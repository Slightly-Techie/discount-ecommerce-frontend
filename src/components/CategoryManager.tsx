import { Layers } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Category } from "@/types";
import { ColumnConfig, FieldConfig, ResourceManager } from "./admin/ResourceManager";

const CATEGORY_KEY = ["admin", "categories"] as const;

const CATEGORY_FIELDS: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text", required: true, help: "Lowercase letters, numbers and dashes" },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "parent",
    label: "Parent category",
    type: "select",
    optionsQuery: {
      key: CATEGORY_KEY,
      fetch: adminApi.categories.list,
      toOption: (c: Category) => ({ value: c.id, label: c.name }),
    },
  },
];

const CATEGORY_COLUMNS: ColumnConfig<Category>[] = [
  { header: "Name", render: (c) => <span className="font-medium">{c.name}</span> },
  { header: "Slug", render: (c) => <span className="font-mono text-xs">{c.slug}</span> },
  { header: "Description", render: (c) => c.description || "—" },
];

const CategoryManager = () => (
  <ResourceManager<Category>
    title="Categories"
    icon={<Layers className="h-5 w-5" />}
    singular="Category"
    queryKey={CATEGORY_KEY}
    api={adminApi.categories}
    columns={CATEGORY_COLUMNS}
    fields={CATEGORY_FIELDS}
    // Keep the storefront/product-form category lists in sync
    invalidate={[["categories"]]}
    searchPlaceholder="Search categories…"
  />
);

export default CategoryManager;
