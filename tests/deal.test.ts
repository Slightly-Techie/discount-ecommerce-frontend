import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatGHS, toAmount } from '../src/lib/price.ts';
import { dealPricing, endDetail, endLabel, isDiscountLive, productImage, retailerName, shortDate, stockState } from '../src/lib/deal.ts';

// Wednesday 2026-10-14 12:00 in Accra (UTC+0 all year)
const now = new Date('2026-10-14T12:00:00Z');

test('formatGHS: cedi sign, space, grouping, two decimals', () => {
  assert.equal(formatGHS('1250'), 'GH₵ 1,250.00');
  assert.equal(formatGHS(2899), 'GH₵ 2,899.00');
  assert.equal(formatGHS('9.5'), 'GH₵ 9.50');
  assert.equal(formatGHS(undefined), '—');
  assert.equal(formatGHS('abc'), '—');
});

test('toAmount parses API decimal strings', () => {
  assert.equal(toAmount('45.00'), 45);
  assert.equal(toAmount(''), null);
});

test('prices compare as numbers, not strings ("9" < "10")', () => {
  assert.equal(isDiscountLive({ price: '10', discount_price: '9' }, now), true);
  assert.equal(isDiscountLive({ price: '9', discount_price: '10' }, now), false);
});

test('no discount, equal discount or missing discount → plain price', () => {
  assert.deepEqual(dealPricing({ price: '50' }, now), { price: 50, was: null, save: null, percent: null });
  assert.deepEqual(dealPricing({ price: '50', discount_price: '50' }, now).was, null);
});

test('live discount → was, save and rounded percent', () => {
  assert.deepEqual(dealPricing({ price: '245', discount_price: '189' }, now), { price: 189, was: 245, save: 56, percent: 23 });
});

test('discount outside its window is not shown', () => {
  const future = { price: '100', discount_price: '80', discount_start: '2026-10-20T00:00:00Z' };
  const expired = { price: '100', discount_price: '80', discount_end: '2026-10-13T23:59:00Z' };
  assert.equal(dealPricing(future, now).was, null);
  assert.equal(dealPricing(expired, now).was, null);
});

test('endLabel: today, within 7 days by weekday, otherwise none', () => {
  const base = { price: '100', discount_price: '80' };
  assert.equal(endLabel({ ...base, discount_end: '2026-10-14T21:00:00Z' }, now), 'Ends today');
  assert.equal(endLabel({ ...base, discount_end: '2026-10-18T20:00:00Z' }, now), 'Ends Sun');
  assert.equal(endLabel({ ...base, discount_end: '2026-10-30T20:00:00Z' }, now), null);
  assert.equal(endLabel({ ...base }, now), null);
  assert.equal(endLabel({ price: '100', discount_end: '2026-10-15T00:00:00Z' }, now), null);
});

test('stockState: 0 out, 1–5 low, more none', () => {
  assert.equal(stockState(0), 'out');
  assert.equal(stockState(1), 'low');
  assert.equal(stockState(5), 'low');
  assert.equal(stockState(6), null);
  assert.equal(stockState(undefined), null);
});

test('productImage prefers uploaded image, then image_url, then gallery', () => {
  assert.equal(productImage({ image: '/a.jpg', image_url: 'https://x/b.jpg' }), '/a.jpg');
  assert.equal(productImage({ image: null, image_url: 'https://x/b.jpg' }), 'https://x/b.jpg');
  assert.equal(productImage({ images: [{ image: '/g.jpg' }] }), '/g.jpg');
  assert.equal(productImage({}), null);
});

test('retailerName uses source_platform, then vendor name, else GrottoMore', () => {
  assert.equal(retailerName({ source: 'external', source_platform: 'Shoprite' }), 'Shoprite');
  assert.equal(retailerName({ source: 'internal', source_platform: '', vendor: { name: 'Girlies' } }), 'Girlies');
  assert.equal(retailerName({ source: 'internal', vendor: null }), 'GrottoMore');
  assert.equal(retailerName({}), 'GrottoMore');
});

test('shortDate and endDetail use Accra calendar days', () => {
  assert.equal(shortDate('2026-10-18T20:00:00Z'), 'Sun 18 Oct');
  const base = { price: '100', discount_price: '80' };
  assert.equal(endDetail({ ...base, discount_end: '2026-10-18T20:00:00Z' }, now), 'Sun 18 Oct · in 4 days');
  assert.equal(endDetail({ ...base, discount_end: '2026-10-15T08:00:00Z' }, now), 'Thu 15 Oct · tomorrow');
  assert.equal(endDetail({ ...base, discount_end: '2026-10-14T22:00:00Z' }, now), 'Wed 14 Oct · today');
  assert.equal(endDetail({ ...base }, now), null);
});
