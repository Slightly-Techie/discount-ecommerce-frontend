// Turn a DRF error response into one readable sentence for the admin forms.
// DRF sends {"detail": "..."} or per-field lists like {"tags": ["Invalid pk ..."]}.

const FIELD_LABELS: Record<string, string> = {
  non_field_errors: "",
  discount_price: "Discount price",
  discount_start: "Discount start date",
  discount_end: "Discount end date",
  image_url: "Image URL",
  related_products: "Related products",
};

const label = (field: string) =>
  field in FIELD_LABELS ? FIELD_LABELS[field] : field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");

export function apiErrorMessage(error: unknown, fallback = "Something went wrong. Try again."): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data.length < 200 ? data : fallback;
  if (typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.message === "string") return record.message;
  const parts = Object.entries(record).map(([field, value]) => {
    const text = Array.isArray(value) ? value.map(String).join(" ") : typeof value === "string" ? value : "";
    const name = label(field);
    return text ? (name ? `${name}: ${text}` : text) : "";
  });
  const message = parts.filter(Boolean).join(" ");
  return message || fallback;
}

/** "Casual wear" → "casual-wear" (Django SlugField-compatible). */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
