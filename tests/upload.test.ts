import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PRODUCT_IMAGE_BYTES, productImageError } from '../src/lib/upload.ts';

test('accepts JPEG, PNG and WebP up to 5 MB', () => {
  assert.equal(productImageError({ type: 'image/jpeg', size: 1024 }), null);
  assert.equal(productImageError({ type: 'image/png', size: MAX_PRODUCT_IMAGE_BYTES }), null);
  assert.equal(productImageError({ type: 'image/webp', size: 1 }), null);
});

test('rejects other types, including HEIC and GIF', () => {
  assert.match(productImageError({ type: 'image/heic', size: 1 })!, /JPEG, PNG or WebP/);
  assert.match(productImageError({ type: 'image/gif', size: 1 })!, /JPEG, PNG or WebP/);
  assert.match(productImageError({ type: '', size: 1 })!, /JPEG, PNG or WebP/);
});

test('rejects files over 5 MB', () => {
  assert.match(productImageError({ type: 'image/jpeg', size: MAX_PRODUCT_IMAGE_BYTES + 1 })!, /5 MB/);
});
