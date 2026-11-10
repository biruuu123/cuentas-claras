import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { prisma } from '../src/db.ts';
import { app, auth, createGroup, createUser } from './helpers.ts';

after(() => prisma.$disconnect());

test('F-02 crear grupo: el creador es admin y miembro', async () => {
  const ana = await createUser('Ana');
  const res = await request(app).post('/api/groups').set(auth(ana)).send({ name: 'Depto' });
  assert.equal(res.status, 201);
  assert.equal(res.body.group.adminId, ana.id);
  assert.deepEqual(res.body.group.members.map((m: { id: number }) => m.id), [ana.id]);
  const list = await request(app).get('/api/groups').set(auth(ana));
  assert.ok(list.body.groups.some((g: { id: number }) => g.id === res.body.group.id));
});

test('F-02 validación: nombre vacío se rechaza', async () => {
  const ana = await createUser('Ana');
  const res = await request(app).post('/api/groups').set(auth(ana)).send({ name: '   ' });
  assert.equal(res.status, 400);
});

test('F-03 agregar miembro por email; errores de usuario inexistente, repetido y no admin', async () => {
  const ana = await createUser('Ana');
  const beto = await createUser('Beto');
  const caro = await createUser('Caro');
  const gid = await createGroup(ana, [beto]);
  const dup = await request(app).post(`/api/groups/${gid}/members`).set(auth(ana)).send({ email: beto.email });
  assert.equal(dup.status, 409);
  assert.equal(dup.body.error.code, 'YA_ES_MIEMBRO');
  const none = await request(app).post(`/api/groups/${gid}/members`).set(auth(ana)).send({ email: 'nadie@nadie.com' });
  assert.equal(none.status, 404);
  const notAdmin = await request(app).post(`/api/groups/${gid}/members`).set(auth(beto)).send({ email: caro.email });
  assert.equal(notAdmin.status, 403);
});

test('RB-012 CP-012a/b miembro ve el grupo, no miembro recibe 403, inexistente 404', async () => {
  const ana = await createUser('Ana');
  const beto = await createUser('Beto');
  const intruso = await createUser('Intruso');
  const gid = await createGroup(ana, [beto]);
  assert.equal((await request(app).get(`/api/groups/${gid}`).set(auth(beto))).status, 200);
  const res = await request(app).get(`/api/groups/${gid}`).set(auth(intruso));
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'NO_ES_MIEMBRO');
  const list = await request(app).get('/api/groups').set(auth(intruso));
  assert.ok(!list.body.groups.some((g: { id: number }) => g.id === gid));
  assert.equal((await request(app).get('/api/groups/99999999').set(auth(ana))).status, 404);
});

test('RB-012 CP-012c sin token recibe 401', async () => {
  assert.equal((await request(app).get('/api/groups')).status, 401);
});

test('RB-010 CP-010a admin quita miembro con saldo 0', async () => {
  const ana = await createUser('Ana');
  const beto = await createUser('Beto');
  const gid = await createGroup(ana, [beto]);
  const res = await request(app).delete(`/api/groups/${gid}/members/${beto.id}`).set(auth(ana));
  assert.equal(res.status, 200);
  assert.equal(res.body.group.members.length, 1);
  assert.equal((await request(app).get(`/api/groups/${gid}`).set(auth(beto))).status, 403);
});

test('RB-010 CP-010b/c no se quita al admin; un no admin no puede quitar', async () => {
  const ana = await createUser('Ana');
  const beto = await createUser('Beto');
  const caro = await createUser('Caro');
  const gid = await createGroup(ana, [beto, caro]);
  const self = await request(app).delete(`/api/groups/${gid}/members/${ana.id}`).set(auth(ana));
  assert.equal(self.body.error.code, 'ES_ADMIN');
  const notAdmin = await request(app).delete(`/api/groups/${gid}/members/${caro.id}`).set(auth(beto));
  assert.equal(notAdmin.status, 403);
});
