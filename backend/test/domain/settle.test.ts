import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settle, type Transfer } from '../../src/domain/settle.ts';

function apply(balances: Map<number, number>, transfers: Transfer[]) {
  const b = new Map(balances);
  for (const t of transfers) {
    b.set(t.fromId, b.get(t.fromId)! + t.amount);
    b.set(t.toId, b.get(t.toId)! - t.amount);
  }
  return b;
}

test('RB-007 CP-007a saldos en cero dan plan vacío', () => {
  assert.deepEqual(settle(new Map([[1, 0], [2, 0]])), []);
});

test('RB-007 CP-007b A +600, B −300, C −300 da 2 transferencias', () => {
  const t = settle(new Map([[1, 600], [2, -300], [3, -300]]));
  assert.deepEqual(t, [
    { fromId: 2, toId: 1, amount: 300 },
    { fromId: 3, toId: 1, amount: 300 },
  ]);
});

test('RB-007 CP-007c casos aleatorios: ≤ n − 1 transferencias y saldos finales en 0', () => {
  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  for (let round = 0; round < 300; round++) {
    const n = 2 + Math.floor(rand() * 9);
    const values = Array.from({ length: n - 1 }, () => Math.floor(rand() * 20001) - 10000);
    values.push(-values.reduce((a, b) => a + b, 0));
    const balances = new Map(values.map((v, i) => [i + 1, v]));
    const t = settle(balances);
    assert.ok(t.length <= n - 1);
    assert.ok(t.every((x) => x.amount > 0 && Number.isInteger(x.amount)));
    assert.ok([...apply(balances, t).values()].every((v) => v === 0));
  }
});
