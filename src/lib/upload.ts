/** Mirrors the API's product image rules so vendors get feedback before uploading. */
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function productImageError(file: { type: string; size: number }): string | null {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) return 'Choose a JPEG, PNG or WebP image.';
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) return 'Image must be 5 MB or smaller.';
  return null;
}
