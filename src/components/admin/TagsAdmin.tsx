import { Tags } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Tag } from "@/types";
import { ColumnConfig, FieldConfig, ResourceManager } from "./ResourceManager";

const TAG_FIELDS: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text", required: true, help: "Lowercase letters, numbers and dashes" },
  { name: "description", label: "Description", type: "textarea" },
];

const TAG_COLUMNS: ColumnConfig<Tag>[] = [
  { header: "Name", render: (t) => <span className="font-medium">{t.name}</span> },
  { header: "Slug", render: (t) => <span className="font-mono text-xs">{t.slug}</span> },
  { header: "Description", render: (t) => t.description || "—" },
];

export function TagsAdmin() {
  return (
    <ResourceManager<Tag>
      title="Tags"
      icon={<Tags className="h-5 w-5" />}
      singular="Tag"
      queryKey={["admin", "tags"]}
      api={adminApi.tags}
      columns={TAG_COLUMNS}
      fields={TAG_FIELDS}
      searchPlaceholder="Search tags…"
    />
  );
}
