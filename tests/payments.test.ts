import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountLine, screenshotProblem } from '../src/lib/payments.ts';

test('screenshotProblem enforces type and 5 MB', () => {
  assert.equal(screenshotProblem({ name: 'proof.PNG', size: 1000 }), null);
  assert.equal(screenshotProblem({ name: 'proof.webp', size: 5 * 1024 * 1024 }), null);
  assert.match(screenshotProblem({ name: 'proof.gif', size: 10 }) ?? '', /JPEG, PNG or WebP/);
  assert.match(screenshotProblem({ name: 'proof.jpg', size: 5 * 1024 * 1024 + 1 }) ?? '', /5 MB/);
});

test('accountLine describes an account for dropdowns', () => {
  const momo = { id: 'a', kind: 'momo', provider: 'MTN MoMo', account_name: 'GrottoMore Ltd', account_number: '0241234567', branch: '', instructions: '', is_active: true, sort_order: 0 } as const;
  assert.equal(accountLine(momo), 'MTN MoMo · 0241234567 · GrottoMore Ltd');
});
