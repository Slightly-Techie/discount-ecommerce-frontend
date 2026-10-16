// Extensionless type-only import: Node's type stripping erases it, and tsc accepts it.
import type { PaymentAccount } from '../types/payments';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp'];

/** Same limits as the API (api/payments/validators.py); null when the file is fine. */
export function screenshotProblem(file: { name: string; size: number }): string | null {
  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  if (!ALLOWED.includes(ext)) return 'Upload a JPEG, PNG or WebP image.';
  if (file.size > MAX_BYTES) return 'Screenshot must be 5 MB or smaller.';
  return null;
}

export function accountLine(a: PaymentAccount): string {
  return `${a.provider} · ${a.account_number} · ${a.account_name}`;
}
