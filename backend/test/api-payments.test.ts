import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { prisma } from '../src/db.ts';
import { app, auth, createGroup, createUser, type TestUser } from './helpers.ts';

after(() => prisma.$disconnect());

/** Ana paga 900 entre Ana, Beto y Caro → Ana +600, Beto −300, Caro −300. */
async function setup() {
  const ana = await createUser('Ana');
  const beto = await createUser('Beto');
  const caro = await createUser('Caro');
  const gid = await createGroup(ana, [beto, caro]);
  await request(app).post(`/api/groups/${gid}/expenses`).set(auth(ana)).send({
    description: 'Asado', amount: 900, payerId: ana.id, split: { type: 'IGUAL', participants: [ana.id, beto.id, caro.id] },
  });
  return { ana, beto, caro, gid, base: `/api/groups/${gid}` };
}

async function balanceOf(base: string, viewer: TestUser) {
  const res = await request(app).get(`${base}/balances`).set(auth(viewer));
  return {
    body: res.body,
    map: new Map<number, number>(res.body.balances.map((b: { userId: number; balance: number }) => [b.userId, b.balance])),
  };
}

test('RB-006 saldos del grupo y suma cero', async () => {
  const { ana, beto, caro, base } = await setup();
  const { map } = await balanceOf(base, beto);
  assert.equal(map.get(ana.id), 600);
  assert.equal(map.get(beto.id), -300);
  assert.equal(map.get(caro.id), -300);
  assert.equal([...map.values()].reduce((a, b) => a + b, 0), 0);
});

test('RB-007 plan de liquidación con 2 transferencias hacia Ana', async () => {
  const { ana, base } = await setup();
  const { body } = await balanceOf(base, ana);
  assert.equal(body.settlement.length, 2);
  assert.ok(body.settlement.every((t: { toId: number; amount: number }) => t.toId === ana.id && t.amount === 300));
});

test('RB-008 pago válido, pago que supera la deuda, a sí mismo y de un acreedor', async () => {
  const { ana, beto, base } = await setup();
  const over = await request(app).post(`${base}/payments`).set(auth(beto)).send({ toId: ana.id, amount: 400 });
  assert.equal(over.body.error.code, 'PAGO_SUPERA_DEUDA');
  const self = await request(app).post(`${base}/payments`).set(auth(beto)).send({ toId: beto.id, amount: 100 });
  assert.equal(self.body.error.code, 'PAGO_A_SI_MISMO');
  const creditor = await request(app).post(`${base}/payments`).set(auth(ana)).send({ toId: beto.id, amount: 100 });
  assert.equal(creditor.body.error.code, 'PAGO_SUPERA_DEUDA');
  const ok = await request(app).post(`${base}/payments`).set(auth(beto)).send({ toId: ana.id, amount: 300 });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.payment.status, 'PENDIENTE');
  // Con el pago pendiente, Beto ya no puede volver a pagar los mismos 300.
  const again = await request(app).post(`${base}/payments`).set(auth(beto)).send({ toId: ana.id, amount: 300 });
  assert.equal(again.body.error.code, 'PAGO_SUPERA_DEUDA');
});

test('RB-009 solo el receptor confirma; el pendiente no cambia saldos; no se resuelve dos veces', async () => {
  const { ana, beto, base } = await setup();
  const pay = await request(app).post(`${base}/payments`).set(auth(beto)).send({ toId: ana.id, amount: 300 });
  const pid = pay.body.payment.id;
  assert.equal((await balanceOf(base, ana)).map.get(beto.id), -300);
  const byPayer = await request(app).post(`${base}/payments/${pid}/resolve`).set(auth(beto)).send({ decision: 'CONFIRMADO' });
  assert.equal(byPayer.status, 403);
  const ok = await request(app).post(`${base}/payments/${pid}/resolve`).set(auth(ana)).send({ decision: 'CONFIRMADO' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.payment.status, 'CONFIRMADO');
  const { map, body } = await balanceOf(base, ana);
  assert.equal(map.get(beto.id), 0);
  assert.equal(map.get(ana.id), 300);
  assert.equal(body.settlement.length, 1);
  const twice = await request(app).post(`${base}/payments/${pid}/resolve`).set(auth(ana)).send({ decision: 'RECHAZADO' });
  assert.equal(twice.body.error.code, 'PAGO_YA_RESUELTO');
});

test('RB-009 un pago rechazado no cuenta y se puede volver a pagar', async () => {
  const { ana, caro, base } = await setup();
  const pay = await request(app).post(`${base}/payments`).set(auth(caro)).send({ toId: ana.id, amount: 300 });
  await request(app).post(`${base}/payments/${pay.body.payment.id}/resolve`).set(auth(ana)).send({ decision: 'RECHAZADO' });
  assert.equal((await balanceOf(base, ana)).map.get(caro.id), -300);
  const retry = await request(app).post(`${base}/payments`).set(auth(caro)).send({ toId: ana.id, amount: 300 });
  assert.equal(retry.status, 201);
});

test('RB-010 no se quita a un miembro con saldo; con saldo 0 sí y los saldos siguen sumando cero', async () => {
  const { ana, beto, base } = await setup();
  const blocked = await request(app).delete(`${base}/members/${beto.id}`).set(auth(ana));
  assert.equal(blocked.body.error.code, 'SALDO_PENDIENTE');
  const pay = await request(app).post(`${base}/payments`).set(auth(beto)).send({ toId: ana.id, amount: 300 });
  await request(app).post(`${base}/payments/${pay.body.payment.id}/resolve`).set(auth(ana)).send({ decision: 'CONFIRMADO' });
  assert.equal((await request(app).delete(`${base}/members/${beto.id}`).set(auth(ana))).status, 200);
  const { map } = await balanceOf(base, ana);
  assert.equal([...map.values()].reduce((a, b) => a + b, 0), 0);
});

test('RB-012 un no miembro no ve saldos ni pagos', async () => {
  const { base } = await setup();
  const intruso = await createUser('Intruso');
  assert.equal((await request(app).get(`${base}/balances`).set(auth(intruso))).status, 403);
  assert.equal((await request(app).get(`${base}/payments`).set(auth(intruso))).status, 403);
});
