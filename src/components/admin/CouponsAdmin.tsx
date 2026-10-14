import { format } from "date-fns";
import { Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import type { Coupon } from "@/types";
import { ColumnConfig, FieldConfig, ResourceManager } from "./ResourceManager";
import { formatMoney } from "./shared";

// Module-level so the form isn't reset on every render
const COUPON_FIELDS: FieldConfig[] = [
  { name: "code", label: "Code", type: "text", required: true, placeholder: "SAVE10" },
  {
    name: "discount_type",
    label: "Discount type",
    type: "select",
    required: true,
    defaultValue: "percent",
    options: [
      { value: "percent", label: "Percent (%)" },
      { value: "fixed", label: "Fixed amount" },
    ],
  },
  { name: "discount_value", label: "Discount value", type: "number", step: "0.01", required: true },
  { name: "max_discount", label: "Max discount", type: "number", step: "0.01", help: "Cap for percent coupons (optional)" },
  { name: "min_order_amount", label: "Minimum order amount", type: "number", step: "0.01", defaultValue: "0" },
  { name: "valid_from", label: "Valid from", type: "datetime", required: true },
  { name: "valid_to", label: "Valid to", type: "datetime", required: true },
  { name: "usage_limit", label: "Total usage limit", type: "number", help: "Leave blank for unlimited" },
  { name: "usage_limit_per_user", label: "Usage limit per user", type: "number", help: "Leave blank for unlimited" },
  { name: "active", label: "Active", type: "boolean", defaultValue: true },
];

const COUPON_COLUMNS: ColumnConfig<Coupon>[] = [
  { header: "Code", render: (c) => <span className="font-mono font-semibold">{c.code}</span> },
  {
    header: "Discount",
    render: (c) =>
      c.discount_type === "percent" ? `${Number(c.discount_value)}%` : formatMoney(c.discount_value),
  },
  {
    header: "Valid",
    render: (c) => `${format(new Date(c.valid_from), "PP")} – ${format(new Date(c.valid_to), "PP")}`,
    className: "whitespace-nowrap",
  },
  { header: "Used", render: (c) => `${c.times_used}${c.usage_limit ? ` / ${c.usage_limit}` : ""}` },
  {
    header: "Status",
    render: (c) => {
      const expired = new Date(c.valid_to) < new Date();
      if (!c.active) return <Badge variant="outline">inactive</Badge>;
      if (expired) return <Badge variant="secondary">expired</Badge>;
      return <Badge>active</Badge>;
    },
  },
];

export function CouponsAdmin() {
  return (
    <ResourceManager<Coupon>
      title="Coupons"
      icon={<Ticket className="h-5 w-5" />}
      singular="Coupon"
      queryKey={["admin", "coupons"]}
      api={adminApi.coupons}
      columns={COUPON_COLUMNS}
      fields={COUPON_FIELDS}
      searchPlaceholder="Search by code…"
    />
  );
}
