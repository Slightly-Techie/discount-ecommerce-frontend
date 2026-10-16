// Order status display. API statuses: pending, paid, shipped, delivered, cancelled.

export type OrderBadge = 'placed' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

const FLOW = ['pending', 'paid', 'shipped', 'delivered'] as const;
const LABELS = ['Placed', 'Confirmed', 'Out for delivery', 'Delivered'] as const;

export function orderBadge(status: string | null | undefined): { variant: OrderBadge; label: string } {
  switch ((status || 'pending').toLowerCase()) {
    case 'paid':
      return { variant: 'confirmed', label: 'Confirmed' };
    case 'shipped':
      return { variant: 'shipping', label: 'Out for delivery' };
    case 'delivered':
      return { variant: 'delivered', label: 'Delivered' };
    case 'cancelled':
      return { variant: 'cancelled', label: 'Cancelled' };
    default:
      return { variant: 'placed', label: 'Placed' };
  }
}

export function isActiveOrder(status: string | null | undefined): boolean {
  const s = (status || 'pending').toLowerCase();
  return s !== 'delivered' && s !== 'cancelled';
}

/** Stepper states for a non-cancelled order; null for cancelled orders. */
export function orderSteps(status: string | null | undefined): { label: string; state: 'done' | 'current' | 'todo' }[] | null {
  const s = (status || 'pending').toLowerCase();
  if (s === 'cancelled') return null;
  const at = Math.max(0, FLOW.indexOf(s as (typeof FLOW)[number]));
  return LABELS.map((label, i) => ({
    label,
    state: s === 'delivered' || i < at ? 'done' : i === at ? 'current' : 'todo',
  }));
}

export const orderNumber = (id: string) => id.slice(0, 8).toUpperCase();

/** "Fri 16 Oct 2026" in Accra time. */
export function orderDate(value: string | null | undefined): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
    .format(Date.parse(value))
    .replace(',', '');
}
