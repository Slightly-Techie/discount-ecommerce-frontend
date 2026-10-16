import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isActiveOrder, orderBadge, orderDate, orderNumber, orderSteps } from '../src/lib/orders.ts';

test('orderBadge maps API statuses to design labels', () => {
  assert.deepEqual(orderBadge('pending'), { variant: 'placed', label: 'Placed' });
  assert.deepEqual(orderBadge('paid'), { variant: 'confirmed', label: 'Confirmed' });
  assert.deepEqual(orderBadge('shipped'), { variant: 'shipping', label: 'Out for delivery' });
  assert.deepEqual(orderBadge('DELIVERED'), { variant: 'delivered', label: 'Delivered' });
  assert.deepEqual(orderBadge(undefined), { variant: 'placed', label: 'Placed' });
});

test('orderSteps marks done, current and todo; delivered is all done', () => {
  assert.deepEqual(orderSteps('shipped')?.map((s) => s.state), ['done', 'done', 'current', 'todo']);
  assert.deepEqual(orderSteps('pending')?.map((s) => s.state), ['current', 'todo', 'todo', 'todo']);
  assert.deepEqual(orderSteps('delivered')?.map((s) => s.state), ['done', 'done', 'done', 'done']);
  assert.equal(orderSteps('cancelled'), null);
});

test('active vs past orders', () => {
  assert.equal(isActiveOrder('paid'), true);
  assert.equal(isActiveOrder('delivered'), false);
  assert.equal(isActiveOrder('cancelled'), false);
});

test('order number and date', () => {
  assert.equal(orderNumber('0a1b2c3d-0000-4000'), '0A1B2C3D');
  assert.equal(orderDate('2026-10-16T09:00:00Z'), 'Fri 16 Oct 2026');
});
