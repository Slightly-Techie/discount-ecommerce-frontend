import { Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi } from "@/lib/api";
import type { Country, ShippingMethod, ShippingZone, TaxRate, TaxZone } from "@/types";
import { ColumnConfig, FieldConfig, ResourceManager } from "./ResourceManager";
import { formatMoney } from "./shared";

const KEYS = {
  countries: ["admin", "countries"] as const,
  shippingZones: ["admin", "shipping-zones"] as const,
  shippingMethods: ["admin", "shipping-methods"] as const,
  taxZones: ["admin", "tax-zones"] as const,
  taxRates: ["admin", "tax-rates"] as const,
};

const countryOption = {
  key: KEYS.countries,
  fetch: adminApi.countries.list,
  toOption: (c: Country) => ({ value: c.id, label: `${c.name} (${c.code})` }),
};

const yesNo = (v: boolean) => (v ? <Badge>yes</Badge> : <Badge variant="outline">no</Badge>);

// Field/column configs live at module level so forms aren't reset on re-render
const COUNTRY_FIELDS: FieldConfig[] = [
  { name: "code", label: "ISO code", type: "text", required: true, placeholder: "GH", help: "2-letter ISO 3166 code" },
  { name: "name", label: "Name", type: "text", required: true },
];
const COUNTRY_COLUMNS: ColumnConfig<Country>[] = [
  { header: "Code", render: (c) => <span className="font-mono">{c.code}</span> },
  { header: "Name", render: (c) => c.name },
];

const ZONE_FIELDS: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "country", label: "Country", type: "select", required: true, optionsQuery: countryOption },
  { name: "is_remote", label: "Remote area", type: "boolean", defaultValue: false },
];
const ZONE_COLUMNS: ColumnConfig<ShippingZone>[] = [
  { header: "Name", render: (z) => z.name },
  { header: "Country", render: (z) => z.country_name },
  { header: "Remote", render: (z) => yesNo(z.is_remote) },
];

const METHOD_FIELDS: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true, defaultValue: "Standard", help: "Checkout uses the \"Standard\" method" },
  {
    name: "zone",
    label: "Shipping zone",
    type: "select",
    required: true,
    optionsQuery: {
      key: KEYS.shippingZones,
      fetch: adminApi.shippingZones.list,
      toOption: (z: ShippingZone) => ({ value: z.id, label: `${z.name} – ${z.country_name}` }),
    },
  },
  { name: "base_rate", label: "Base rate", type: "number", step: "0.01", required: true },
  { name: "per_kg_rate", label: "Per kg rate", type: "number", step: "0.01", defaultValue: "0" },
  { name: "free_over", label: "Free shipping over", type: "number", step: "0.01", help: "Leave blank to disable" },
  { name: "active", label: "Active", type: "boolean", defaultValue: true },
];
const METHOD_COLUMNS: ColumnConfig<ShippingMethod>[] = [
  { header: "Name", render: (m) => m.name },
  { header: "Zone", render: (m) => m.zone_name },
  { header: "Base rate", render: (m) => formatMoney(m.base_rate) },
  { header: "Free over", render: (m) => (m.free_over ? formatMoney(m.free_over) : "—") },
  { header: "Active", render: (m) => yesNo(m.active) },
];

const TAX_ZONE_FIELDS: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "country", label: "Country", type: "select", required: true, optionsQuery: countryOption },
  { name: "active", label: "Active", type: "boolean", defaultValue: true },
];
const TAX_ZONE_COLUMNS: ColumnConfig<TaxZone>[] = [
  { header: "Name", render: (z) => z.name },
  { header: "Country", render: (z) => z.country_name },
  { header: "Active", render: (z) => yesNo(z.active) },
];

const TAX_RATE_FIELDS: FieldConfig[] = [
  {
    name: "zone",
    label: "Tax zone",
    type: "select",
    required: true,
    optionsQuery: {
      key: KEYS.taxZones,
      fetch: adminApi.taxZones.list,
      toOption: (z: TaxZone) => ({ value: z.id, label: `${z.name} – ${z.country_name}` }),
    },
  },
  { name: "rate", label: "Rate", type: "number", step: "0.0001", required: true, help: "Decimal fraction, e.g. 0.1500 = 15%" },
  { name: "start_date", label: "Start date", type: "date" },
  { name: "end_date", label: "End date", type: "date" },
  { name: "active", label: "Active", type: "boolean", defaultValue: true },
];
const TAX_RATE_COLUMNS: ColumnConfig<TaxRate>[] = [
  { header: "Zone", render: (r) => r.zone_name },
  { header: "Rate", render: (r) => `${(Number(r.rate) * 100).toFixed(2)}%` },
  { header: "From", render: (r) => r.start_date ?? "—" },
  { header: "To", render: (r) => r.end_date ?? "—" },
  { header: "Active", render: (r) => yesNo(r.active) },
];

export function ShippingTaxAdmin() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping &amp; Tax
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Checkout looks up the customer's country → shipping zone → active "Standard" method, and country → tax zone →
          latest active rate.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="countries" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="countries">Countries</TabsTrigger>
            <TabsTrigger value="zones">Shipping zones</TabsTrigger>
            <TabsTrigger value="methods">Shipping methods</TabsTrigger>
            <TabsTrigger value="tax-zones">Tax zones</TabsTrigger>
            <TabsTrigger value="tax-rates">Tax rates</TabsTrigger>
          </TabsList>
          <TabsContent value="countries">
            <ResourceManager<Country>
              embedded
              title="Countries"
              singular="Country"
              queryKey={KEYS.countries}
              api={adminApi.countries}
              columns={COUNTRY_COLUMNS}
              fields={COUNTRY_FIELDS}
              searchPlaceholder="Search countries…"
            />
          </TabsContent>
          <TabsContent value="zones">
            <ResourceManager<ShippingZone>
              embedded
              title="Shipping zones"
              singular="Shipping zone"
              queryKey={KEYS.shippingZones}
              api={adminApi.shippingZones}
              columns={ZONE_COLUMNS}
              fields={ZONE_FIELDS}
              invalidate={[[...KEYS.shippingMethods]]}
              searchPlaceholder="Search zones…"
            />
          </TabsContent>
          <TabsContent value="methods">
            <ResourceManager<ShippingMethod>
              embedded
              title="Shipping methods"
              singular="Shipping method"
              queryKey={KEYS.shippingMethods}
              api={adminApi.shippingMethods}
              columns={METHOD_COLUMNS}
              fields={METHOD_FIELDS}
              searchPlaceholder="Search methods…"
            />
          </TabsContent>
          <TabsContent value="tax-zones">
            <ResourceManager<TaxZone>
              embedded
              title="Tax zones"
              singular="Tax zone"
              queryKey={KEYS.taxZones}
              api={adminApi.taxZones}
              columns={TAX_ZONE_COLUMNS}
              fields={TAX_ZONE_FIELDS}
              invalidate={[[...KEYS.taxRates]]}
              searchPlaceholder="Search tax zones…"
            />
          </TabsContent>
          <TabsContent value="tax-rates">
            <ResourceManager<TaxRate>
              embedded
              searchable={false}
              title="Tax rates"
              singular="Tax rate"
              queryKey={KEYS.taxRates}
              api={adminApi.taxRates}
              columns={TAX_RATE_COLUMNS}
              fields={TAX_RATE_FIELDS}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
