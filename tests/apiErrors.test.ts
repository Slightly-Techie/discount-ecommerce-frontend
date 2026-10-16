import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiErrorMessage, slugify } from '../src/lib/apiErrors.ts';

const err = (data: unknown) => ({ response: { data } });

test('apiErrorMessage reads detail, then per-field DRF errors', () => {
  assert.equal(apiErrorMessage(err({ detail: 'Not allowed.' })), 'Not allowed.');
  assert.equal(
    apiErrorMessage(err({ tags: ['Incorrect type. Expected pk value, received str.'] })),
    'Tags: Incorrect type. Expected pk value, received str.'
  );
  assert.equal(apiErrorMessage(err({ discount_price: ['Must be lower.'], non_field_errors: ['Bad.'] })), 'Discount price: Must be lower. Bad.');
  assert.equal(apiErrorMessage(new Error('network'), 'Fallback'), 'Fallback');
});

test('slugify makes Django-safe slugs', () => {
  assert.equal(slugify('Casual wear'), 'casual-wear');
  assert.equal(slugify('  Hermès Sandals & Shoes '), 'hermes-sandals-shoes');
});
