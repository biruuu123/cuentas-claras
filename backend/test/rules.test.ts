import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertValidPayment, resolvePayment, assertCanRemoveMember, assertCanEditExpense,
} from '../src/domain/rules.ts';
import { computeBalances } from '../src/domain/balances.ts';

const balances = new Map([[1, 600], [2, -300], [3, -300]]);

test('RB-008 CP-008a pago de 300 de B a A se acepta', () => {
  assert.doesNotThrow(() => assertValidPayment(balances, 2, 1, 300));
});

test('RB-008 CP-008b pago que supera la deuda se rechaza', () => {
  assert.throws(() => assertValidPayment(balances, 2, 1, 400), { code: 'PAGO_SUPERA_DEUDA' });
});

test('RB-008 CP-008c pago a sí mismo se rechaza', () => {
  assert.throws(() => assertValidPayment(balances, 2, 2, 100), { code: 'PAGO_A_SI_MISMO' });
});

test('RB-008 CP-008d pago de un acreedor o hacia un deudor se rechaza', () => {
  assert.throws(() => assertValidPayment(balances, 1, 2, 100), { code: 'PAGO_SUPERA_DEUDA' });
  assert.throws(() => assertValidPayment(balances, 2, 3, 100), { code: 'PAGO_SUPERA_DEUDA' });
});

test('RB-009 CP-009a el receptor confirma', () => {
  assert.equal(resolvePayment({ toId: 1, status: 'PENDIENTE' }, 1, 'CONFIRMADO'), 'CONFIRMADO');
});

test('RB-009 CP-009b el pagador no puede confirmar', () => {
  assert.throws(() => resolvePayment({ toId: 1, status: 'PENDIENTE' }, 2, 'CONFIRMADO'), { code: 'SIN_PERMISO' });
});

test('RB-009 CP-009c un pago pendiente no cambia saldos', () => {
  const b = computeBalances([1, 2], [], [{ fromId: 2, toId: 1, amount: 100, status: 'PENDIENTE' }]);
  assert.deepEqual([...b.values()], [0, 0]);
});

test('RB-009 CP-009d no se resuelve dos veces', () => {
  assert.throws(() => resolvePayment({ toId: 1, status: 'CONFIRMADO' }, 1, 'RECHAZADO'), { code: 'PAGO_YA_RESUELTO' });
});

test('RB-010 CP-010a admin quita miembro con saldo 0', () => {
  assert.doesNotThrow(() => assertCanRemoveMember({ adminId: 1 }, 1, 2, 0));
});

test('RB-010 CP-010b no se quita miembro con saldo ni al admin', () => {
  assert.throws(() => assertCanRemoveMember({ adminId: 1 }, 1, 2, -5), { code: 'SALDO_PENDIENTE' });
  assert.throws(() => assertCanRemoveMember({ adminId: 1 }, 1, 1, 0), { code: 'ES_ADMIN' });
});

test('RB-010 CP-010c un no admin no puede quitar miembros', () => {
  assert.throws(() => assertCanRemoveMember({ adminId: 1 }, 3, 2, 0), { code: 'SIN_PERMISO' });
});

test('RB-011 CP-011a/b creador y admin pueden editar', () => {
  assert.doesNotThrow(() => assertCanEditExpense({ createdById: 2 }, { adminId: 1 }, 2));
  assert.doesNotThrow(() => assertCanEditExpense({ createdById: 2 }, { adminId: 1 }, 1));
});

test('RB-011 CP-011c otro miembro no puede editar', () => {
  assert.throws(() => assertCanEditExpense({ createdById: 2 }, { adminId: 1 }, 3), { code: 'SIN_PERMISO' });
});
