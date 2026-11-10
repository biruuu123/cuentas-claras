import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertMembers, computeBalances } from '../../src/domain/balances.ts';
import { splitEqual } from '../../src/domain/split.ts';

const total = (m: Map<number, number>) => [...m.values()].reduce((a, b) => a + b, 0);

test('RB-005 CP-005a rechaza pagador externo', () => {
  assert.throws(() => assertMembers([1, 2], [9]), { code: 'NO_ES_MIEMBRO' });
});

test('RB-005 CP-005b rechaza participante externo y acepta miembros', () => {
  assert.throws(() => assertMembers([1, 2], [1, 3]), { code: 'NO_ES_MIEMBRO' });
  assert.doesNotThrow(() => assertMembers([1, 2], [1, 2]));
});

test('RB-006 CP-006a gasto de 900 pagado por A entre A, B, C', () => {
  const b = computeBalances([1, 2, 3], [{ payerId: 1, amount: 900, shares: splitEqual(900, [1, 2, 3]) }], []);
  assert.deepEqual([...b.entries()], [[1, 600], [2, -300], [3, -300]]);
});

test('RB-006 CP-006b gastos y pagos suman cero; pagos pendientes no cuentan', () => {
  const b = computeBalances(
    [1, 2, 3, 4],
    [
      { payerId: 1, amount: 1001, shares: splitEqual(1001, [1, 2, 3, 4]) },
      { payerId: 3, amount: 257, shares: splitEqual(257, [2, 3]) },
    ],
    [
      { fromId: 2, toId: 1, amount: 100, status: 'CONFIRMADO' },
      { fromId: 4, toId: 1, amount: 50, status: 'PENDIENTE' },
    ],
  );
  assert.equal(total(b), 0);
  assert.equal(b.get(4), -250);
});
