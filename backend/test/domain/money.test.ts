import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertValidAmount } from '../../src/domain/money.ts';

test('RB-001 CP-001a acepta montos válidos', () => {
  assert.doesNotThrow(() => assertValidAmount(1));
  assert.doesNotThrow(() => assertValidAmount(100_000_000));
});

test('RB-001 CP-001b rechaza montos inválidos', () => {
  for (const v of [0, -5, 10.5, NaN, 100_000_001, '100', null]) {
    assert.throws(() => assertValidAmount(v), { code: 'MONTO_INVALIDO' }, String(v));
  }
});
