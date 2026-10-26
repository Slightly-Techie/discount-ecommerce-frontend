/** Mirrors the API's product image rules so vendors get feedback before uploading. */
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function productImageError(file: { type: string; size: number }): string | null {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) return 'Choose a JPEG, PNG or WebP image.';
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) return 'Image must be 5 MB or smaller.';
  return null;
}

/** Longest edge, in pixels, for product photos after resizing in the browser. */
export const MAX_PHOTO_SIDE = 1600;
const SMALL_ENOUGH_BYTES = 1024 * 1024;

/** Size that fits within maxSide on the long edge, keeping the aspect ratio. Never upscales. */
export function fitWithin(width: number, height: number, maxSide = MAX_PHOTO_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Shrinks a phone-sized photo to a JPEG that fits within MAX_PHOTO_SIDE.
 * Returns the original file when it's already small, or when the browser can't decode it.
 */
export async function shrinkPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    if (width === bitmap.width && file.size <= SMALL_ENOUGH_BYTES) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    // JPEG has no transparency, so transparent PNG areas become white instead of black.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
