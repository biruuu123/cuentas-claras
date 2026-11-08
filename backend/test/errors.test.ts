import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from '../src/domain/errors.ts';

test('DomainError conserva el código', () => {
  const e = new DomainError('MONTO_INVALIDO');
  assert.equal(e.code, 'MONTO_INVALIDO');
  assert.ok(e instanceof Error);
});
