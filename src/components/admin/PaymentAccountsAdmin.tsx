import { Landmark } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { PaymentAccount } from "@/types/payments";
import { ColumnConfig, FieldConfig, ResourceManager } from "./ResourceManager";

const FIELDS: FieldConfig[] = [
  {
    name: "kind",
    label: "Type",
    type: "select",
    required: true,
    defaultValue: "momo",
    options: [
      { value: "momo", label: "Mobile money" },
      { value: "bank", label: "Bank account" },
    ],
  },
  {
    name: "provider",
    label: "Network or bank",
    type: "text",
    required: true,
    placeholder: "MTN MoMo, Telecel Cash, AirtelTigo Money, or the bank name",
  },
  { name: "account_name", label: "Account name", type: "text", required: true, help: "The name shoppers will see when sending" },
  { name: "account_number", label: "Account or MoMo number", type: "text", required: true },
  { name: "branch", label: "Branch (banks only)", type: "text" },
  { name: "instructions", label: "Instructions for shoppers", type: "textarea", placeholder: "e.g. Use your order number as the reference" },
  { name: "sort_order", label: "Display order", type: "number", defaultValue: 0, help: "Lower numbers show first" },
  { name: "is_active", label: "Show at checkout", type: "boolean", defaultValue: true },
];

const COLUMNS: ColumnConfig<PaymentAccount>[] = [
  { header: "Account", render: (a) => <span className="font-medium">{a.provider}</span> },
  { header: "Name", render: (a) => a.account_name },
  { header: "Number", render: (a) => <span className="font-mono text-xs">{a.account_number}</span> },
  { header: "Type", render: (a) => (a.kind === "bank" ? "Bank" : "MoMo") },
  { header: "At checkout", render: (a) => (a.is_active ? "Shown" : "Hidden") },
];

export function PaymentAccountsAdmin() {
  return (
    <ResourceManager<PaymentAccount>
      title="Payment accounts"
      icon={<Landmark className="h-5 w-5" />}
      singular="Payment account"
      queryKey={["admin", "payment-accounts"]}
      api={adminApi.paymentAccounts}
      columns={COLUMNS}
      fields={FIELDS}
      searchPlaceholder="Search accounts…"
    />
  );
}
