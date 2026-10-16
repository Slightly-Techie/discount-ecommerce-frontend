// Honest deal rules from the design handoff: savings only for a live discount,
// urgency only from a real discount_end, scarcity only from real stock.

export interface DealFields {
  price: string | number;
  discount_price?: string | number | null;
  discount_start?: string | null;
  discount_end?: string | null;
  stock?: number | null;
}

export interface DealPricing {
  /** What the shopper pays now. */
  price: number;
  /** Original price, only when a discount is live. */
  was: number | null;
  /** Amount saved, only when a discount is live. */
  save: number | null;
  /** Whole-number percentage saved, only when a discount is live. */
  percent: number | null;
}

const ACCRA = 'Africa/Accra';
const DAY_MS = 24 * 60 * 60 * 1000;

function num(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function time(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

/** A discount is live when it is lower than the price and now is inside start…end (open-ended if unset). */
export function isDiscountLive(p: DealFields, now: Date = new Date()): boolean {
  const price = num(p.price);
  const discount = num(p.discount_price);
  if (price === null || discount === null || discount >= price || discount < 0) return false;
  const start = time(p.discount_start);
  const end = time(p.discount_end);
  const t = now.getTime();
  if (start !== null && t < start) return false;
  if (end !== null && t > end) return false;
  return true;
}

export function dealPricing(p: DealFields, now: Date = new Date()): DealPricing {
  const price = num(p.price) ?? 0;
  if (!isDiscountLive(p, now)) return { price, was: null, save: null, percent: null };
  const discount = num(p.discount_price) as number;
  const save = Math.round((price - discount) * 100) / 100;
  return { price: discount, was: price, save, percent: Math.round((save / price) * 100) };
}

function accraDayKey(t: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ACCRA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(t);
}

/**
 * "Ends today" when the live discount ends today (Accra time), "Ends Sun" when it ends
 * within the next 7 days, otherwise null. No countdowns.
 */
export function endLabel(p: DealFields, now: Date = new Date()): string | null {
  if (!isDiscountLive(p, now)) return null;
  const end = time(p.discount_end);
  if (end === null) return null;
  const t = now.getTime();
  if (accraDayKey(end) === accraDayKey(t)) return 'Ends today';
  if (end - t > 7 * DAY_MS) return null;
  const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: ACCRA, weekday: 'short' }).format(end);
  return `Ends ${weekday}`;
}

export type StockState = 'out' | 'low' | null;

/** 0 → out of stock, 1–5 → low stock, otherwise no label. */
export function stockState(stock: number | null | undefined): StockState {
  if (stock === null || stock === undefined) return null;
  if (stock <= 0) return 'out';
  if (stock <= 5) return 'low';
  return null;
}
