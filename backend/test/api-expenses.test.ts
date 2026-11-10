import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { prisma } from '../src/db.ts';
import { app, auth, createGroup, createUser } from './helpers.ts';

after(() => prisma.$disconnect());

async function setup() {
  const ana = await createUser('Ana');
  const beto = await createUser('Beto');
  const caro = await createUser('Caro');
  const gid = await createGroup(ana, [beto, caro]);
  return { ana, beto, caro, gid, url: `/api/groups/${gid}/expenses` };
}

const amounts = (body: { expense: { shares: { userId: number; amount: number }[] } }) =>
  body.expense.shares.map((s) => s.amount);

test('RB-002 gasto en partes iguales con centavo sobrante', async () => {
  const { ana, beto, caro, url } = await setup();
  const res = await request(app).post(url).set(auth(ana)).send({
    description: 'Super', amount: 1000, payerId: ana.id, split: { type: 'IGUAL', participants: [ana.id, beto.id, caro.id] },
  });
  assert.equal(res.status, 201);
  assert.deepEqual(amounts(res.body), [334, 333, 333]);
  const list = await request(app).get(url).set(auth(beto));
  assert.equal(list.body.expenses.length, 1);
});

test('RB-003 gasto por porcentajes válido e inválido', async () => {
  const { ana, beto, url } = await setup();
  const ok = await request(app).post(url).set(auth(beto)).send({
    description: 'Nafta', amount: 1000, payerId: beto.id,
    split: { type: 'PORCENTAJE', parts: [{ userId: ana.id, basisPoints: 3000 }, { userId: beto.id, basisPoints: 7000 }] },
  });
  assert.equal(ok.status, 201);
  assert.deepEqual(amounts(ok.body), [300, 700]);
  const bad = await request(app).post(url).set(auth(beto)).send({
    description: 'Nafta', amount: 1000, payerId: beto.id,
    split: { type: 'PORCENTAJE', parts: [{ userId: ana.id, basisPoints: 3000 }, { userId: beto.id, basisPoints: 6000 }] },
  });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error.code, 'PORCENTAJES_NO_SUMAN_100');
});

test('RB-004 montos exactos que no suman el total se rechazan', async () => {
  const { ana, beto, url } = await setup();
  const res = await request(app).post(url).set(auth(ana)).send({
    description: 'Cena', amount: 1000, payerId: ana.id,
    split: { type: 'EXACTO', parts: [{ userId: ana.id, amount: 700 }, { userId: beto.id, amount: 200 }] },
  });
  assert.equal(res.body.error.code, 'MONTOS_NO_SUMAN_TOTAL');
});

test('RB-001 monto inválido se rechaza (cero y decimales)', async () => {
  const { ana, url } = await setup();
  const zero = await request(app).post(url).set(auth(ana)).send({
    description: 'X', amount: 0, payerId: ana.id, split: { type: 'IGUAL', participants: [ana.id] },
  });
  assert.equal(zero.body.error.code, 'MONTO_INVALIDO');
  const decimal = await request(app).post(url).set(auth(ana)).send({
    description: 'X', amount: 10.5, payerId: ana.id, split: { type: 'IGUAL', participants: [ana.id] },
  });
  assert.equal(decimal.status, 400);
});

test('RB-005 pagador o participante externo se rechaza', async () => {
  const { ana, url } = await setup();
  const externo = await createUser('Externo');
  const r1 = await request(app).post(url).set(auth(ana)).send({
    description: 'X', amount: 100, payerId: externo.id, split: { type: 'IGUAL', participants: [ana.id] },
  });
  assert.equal(r1.body.error.code, 'NO_ES_MIEMBRO');
  const r2 = await request(app).post(url).set(auth(ana)).send({
    description: 'X', amount: 100, payerId: ana.id, split: { type: 'IGUAL', participants: [ana.id, externo.id] },
  });
  assert.equal(r2.body.error.code, 'NO_ES_MIEMBRO');
});

test('RB-012 un no miembro no puede ver ni crear gastos', async () => {
  const { ana, url } = await setup();
  const intruso = await createUser('Intruso');
  assert.equal((await request(app).get(url).set(auth(intruso))).status, 403);
  const res = await request(app).post(url).set(auth(intruso)).send({
    description: 'X', amount: 100, payerId: ana.id, split: { type: 'IGUAL', participants: [ana.id] },
  });
  assert.equal(res.status, 403);
});

test('RB-011 creador edita, admin elimina, otro miembro no puede', async () => {
  const { ana, beto, caro, url } = await setup();
  const created = await request(app).post(url).set(auth(beto)).send({
    description: 'Taxi', amount: 600, payerId: beto.id, split: { type: 'IGUAL', participants: [beto.id, caro.id] },
  });
  const eid = created.body.expense.id;
  const edit = await request(app).put(`${url}/${eid}`).set(auth(beto)).send({
    description: 'Taxi aeropuerto', amount: 900, payerId: beto.id, split: { type: 'IGUAL', participants: [ana.id, beto.id, caro.id] },
  });
  assert.equal(edit.status, 200);
  assert.equal(edit.body.expense.description, 'Taxi aeropuerto');
  assert.deepEqual(amounts(edit.body), [300, 300, 300]);
  const forbidden = await request(app).delete(`${url}/${eid}`).set(auth(caro));
  assert.equal(forbidden.status, 403);
  assert.equal((await request(app).delete(`${url}/${eid}`).set(auth(ana))).status, 204);
  assert.equal((await request(app).delete(`${url}/${eid}`).set(auth(ana))).status, 404);
});
