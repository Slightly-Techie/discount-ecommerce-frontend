// Ghana cedi display. Prices arrive from the API as decimal strings ("1250.00").

const groupedTwoDecimals = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Parse an API price; returns null for missing or non-numeric values. */
export function toAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** "GH₵ 1,250.00". Never "$", never "GHS". Missing values render as an em dash. */
export function formatGHS(value: string | number | null | undefined): string {
  const n = toAmount(value);
  if (n === null) return '—';
  return `GH₵ ${groupedTwoDecimals.format(n)}`;
}
