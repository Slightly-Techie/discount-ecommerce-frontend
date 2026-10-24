// Turn a DRF error response into one readable sentence for the admin forms.
// DRF sends {"detail": "..."} or per-field lists like {"tags": ["Invalid pk ..."]}.

const FIELD_LABELS: Record<string, string> = {
  non_field_errors: "",
  discount_price: "Discount price",
  discount_start: "Discount start date",
  discount_end: "Discount end date",
  image_url: "Image URL",
  related_products: "Related products",
  owner_email: "Owner email",
  owner_phonenumber: "Owner phone",
  owner_first_name: "Owner first name",
  owner_last_name: "Owner last name",
  business_email: "Business email",
  request: "Request",
  phonenumber: "Phone number",
  first_name: "First name",
  last_name: "Last name",
  date_of_birth: "Date of birth",
};

const label = (field: string) =>
  field in FIELD_LABELS ? FIELD_LABELS[field] : field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");

const NETWORK_MESSAGE = "We couldn’t reach GrottoMore. Check your connection and try again.";

// DRF's stock wording for unique fields, rewritten to tell the person what to do next.
const FRIENDLY: [RegExp, string][] = [
  [/user with this email already exists/i, "An account with this email already exists. Sign in, or reset your password."],
  [/user with this phonenumber already exists/i, "An account with this phone number already exists. Sign in, or use a different number."],
];

const friendly = (text: string) => {
  for (const [pattern, replacement] of FRIENDLY) if (pattern.test(text)) return replacement;
  return text;
};

/** True when the request never got a response (offline, DNS, timeout, CORS). */
export function isNetworkError(error: unknown): boolean {
  const e = error as { response?: unknown; request?: unknown; code?: string } | null;
  return !!e && !e.response && (!!e.request || e.code === "ERR_NETWORK" || e.code === "ECONNABORTED");
}

export interface ApiFormErrors {
  /** Messages keyed by API field name, e.g. { email: "An account with this email already exists…" } */
  fields: Record<string, string>;
  /** A message that belongs to no single field (detail, non_field_errors, network). */
  general: string | null;
}

/**
 * Split a DRF error into per-field messages a form can show under each input,
 * plus one general message. Fields the form doesn't know about should be shown
 * with `general` by the caller (see `formFieldErrors`).
 */
export function apiFormErrors(error: unknown, fallback = "Something went wrong. Try again."): ApiFormErrors {
  if (isNetworkError(error)) return { fields: {}, general: NETWORK_MESSAGE };
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== "object") {
    return { fields: {}, general: typeof data === "string" && data.length < 200 ? data : fallback };
  }
  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") return { fields: {}, general: friendly(record.detail) };
  if (typeof record.message === "string") return { fields: {}, general: friendly(record.message) };
  const fields: Record<string, string> = {};
  const general: string[] = [];
  for (const [field, value] of Object.entries(record)) {
    const text = Array.isArray(value) ? value.map(String).join(" ") : typeof value === "string" ? value : "";
    if (!text) continue;
    if (field === "non_field_errors") general.push(friendly(text));
    else fields[field] = friendly(text);
  }
  if (!Object.keys(fields).length && !general.length) return { fields, general: fallback };
  return { fields, general: general.length ? general.join(" ") : null };
}

/**
 * Map API field errors onto a form's own field names. Errors for fields the form
 * doesn't show are folded into `general` with their label, so nothing is lost.
 */
export function formFieldErrors(
  errors: ApiFormErrors,
  fieldMap: Record<string, string>
): { fields: Record<string, string>; general: string | null } {
  const fields: Record<string, string> = {};
  const extra: string[] = [];
  for (const [apiField, text] of Object.entries(errors.fields)) {
    const formField = fieldMap[apiField];
    if (formField) fields[formField] = text;
    else extra.push(`${label(apiField)}: ${text}`);
  }
  const general = [errors.general, ...extra].filter(Boolean).join(" ") || null;
  return { fields, general };
}

export function apiErrorMessage(error: unknown, fallback = "Something went wrong. Try again."): string {
  if (isNetworkError(error)) return NETWORK_MESSAGE;
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data.length < 200 ? data : fallback;
  if (typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.message === "string") return record.message;
  const parts = Object.entries(record).map(([field, value]) => {
    const raw = Array.isArray(value) ? value.map(String).join(" ") : typeof value === "string" ? value : "";
    const text = raw && friendly(raw);
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
