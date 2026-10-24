import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiErrorMessage, apiFormErrors, formFieldErrors, slugify } from '../src/lib/apiErrors.ts';

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

test('apiFormErrors splits DRF field errors from general ones', () => {
  const result = apiFormErrors(err({
    email: ['user with this email already exists.'],
    password: ['This password is too short. It must contain at least 8 characters.', 'This password is too common.'],
    non_field_errors: ['Something else.'],
  }));
  assert.equal(result.fields.email, 'An account with this email already exists. Sign in, or reset your password.');
  assert.equal(result.fields.password, 'This password is too short. It must contain at least 8 characters. This password is too common.');
  assert.equal(result.general, 'Something else.');
});

test('apiFormErrors reports network failures and empty bodies', () => {
  assert.match(apiFormErrors({ request: {}, code: 'ERR_NETWORK' }).general ?? '', /couldn’t reach GrottoMore/);
  assert.equal(apiFormErrors(err({}), 'Fallback').general, 'Fallback');
  assert.equal(apiFormErrors(err({ detail: 'Throttled.' })).general, 'Throttled.');
});

test('formFieldErrors maps to form keys and keeps unknown fields in general', () => {
  const mapped = formFieldErrors(
    { fields: { first_name: 'Required.', role: 'Not allowed.' }, general: null },
    { first_name: 'firstname' }
  );
  assert.deepEqual(mapped.fields, { firstname: 'Required.' });
  assert.equal(mapped.general, 'Role: Not allowed.');
});

test('apiErrorMessage uses friendly unique-field wording and a network message', () => {
  assert.equal(
    apiErrorMessage(err({ phonenumber: ['user with this phonenumber already exists.'] })),
    'Phone number: An account with this phone number already exists. Sign in, or use a different number.'
  );
  assert.match(apiErrorMessage({ request: {} }), /Check your connection/);
});
