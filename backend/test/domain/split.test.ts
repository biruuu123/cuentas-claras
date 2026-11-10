import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitEqual, splitPercentage, splitExact } from '../../src/domain/split.ts';

const sum = (s: { amount: number }[]) => s.reduce((a, x) => a + x.amount, 0);

test('RB-002 CP-002a 1000 entre 3 asigna el centavo sobrante al id menor', () => {
  assert.deepEqual(splitEqual(1000, [3, 1, 2]).map((s) => s.amount), [334, 333, 333]);
});

test('RB-002 CP-002b 900 entre 3 da partes iguales', () => {
  assert.deepEqual(splitEqual(900, [1, 2, 3]).map((s) => s.amount), [300, 300, 300]);
});

test('RB-002 CP-002c rechaza sin participantes o duplicados', () => {
  assert.throws(() => splitEqual(100, []), { code: 'SIN_PARTICIPANTES' });
  assert.throws(() => splitEqual(100, [1, 1]), { code: 'PARTICIPANTE_DUPLICADO' });
});

test('RB-002 CP-002d la suma siempre es igual al total', () => {
  for (let total = 1; total < 500; total += 7) {
    for (let n = 1; n <= 7; n++) {
      assert.equal(sum(splitEqual(total, Array.from({ length: n }, (_, i) => i + 1))), total);
    }
  }
});

test('RB-003 CP-003a 50/50', () => {
  const r = splitPercentage(1000, [{ userId: 1, basisPoints: 5000 }, { userId: 2, basisPoints: 5000 }]);
  assert.deepEqual(r.map((s) => s.amount), [500, 500]);
});

test('RB-003 CP-003b 33,33/33,33/33,34 suma el total', () => {
  const r = splitPercentage(1000, [
    { userId: 1, basisPoints: 3333 },
    { userId: 2, basisPoints: 3333 },
    { userId: 3, basisPoints: 3334 },
  ]);
  assert.equal(sum(r), 1000);
  assert.deepEqual(r.map((s) => s.amount), [333, 333, 334]);
});

test('RB-003 CP-003c rechaza porcentajes que no suman 100', () => {
  assert.throws(
    () => splitPercentage(1000, [{ userId: 1, basisPoints: 6000 }, { userId: 2, basisPoints: 3000 }]),
    { code: 'PORCENTAJES_NO_SUMAN_100' },
  );
});

test('RB-003 CP-003d rechaza porcentaje 0', () => {
  assert.throws(
    () => splitPercentage(1000, [{ userId: 1, basisPoints: 10000 }, { userId: 2, basisPoints: 0 }]),
    { code: 'PORCENTAJES_NO_SUMAN_100' },
  );
});

test('RB-004 CP-004a acepta montos que suman el total', () => {
  assert.equal(sum(splitExact(1000, [{ userId: 1, amount: 700 }, { userId: 2, amount: 300 }])), 1000);
});

test('RB-004 CP-004b rechaza montos que no suman el total', () => {
  assert.throws(
    () => splitExact(1000, [{ userId: 1, amount: 700 }, { userId: 2, amount: 200 }]),
    { code: 'MONTOS_NO_SUMAN_TOTAL' },
  );
});

test('RB-004 CP-004c rechaza parte negativa', () => {
  assert.throws(
    () => splitExact(1000, [{ userId: 1, amount: 1100 }, { userId: 2, amount: -100 }]),
    { code: 'MONTO_INVALIDO' },
  );
});
