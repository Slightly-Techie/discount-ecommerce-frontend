import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, passwordError, phoneError } from '../src/lib/registration.ts';

test('normalizePhone strips spaces, dashes and brackets', () => {
  assert.equal(normalizePhone(' 024 123-4567 '), '0241234567');
  assert.equal(normalizePhone('+233 (24) 123 4567'), '+233241234567');
});

test('phoneError matches the API rule: 10–15 digits, optional +', () => {
  assert.equal(phoneError('024 123 4567'), null);
  assert.equal(phoneError('+233241234567'), null);
  assert.match(phoneError('24123') ?? '', /10 to 15 digits/);
  assert.match(phoneError('024-ABC-4567') ?? '', /10 to 15 digits/);
  assert.equal(phoneError('   '), 'Phone number is required');
});

test('passwordError mirrors Django length and numeric rules', () => {
  assert.equal(passwordError(''), 'Password is required');
  assert.equal(passwordError('abc123'), 'Use at least 8 characters');
  assert.equal(passwordError('12345678'), 'Use letters as well as numbers');
  assert.equal(passwordError('kente-market-9'), null);
});
