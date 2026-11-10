import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { prisma } from '../src/db.ts';
import { app, uniqueEmail } from './helpers.ts';

after(() => prisma.$disconnect());

test('RB-013 CP-013a registro válido devuelve token y no expone la contraseña', async () => {
  const email = uniqueEmail();
  const res = await request(app).post('/api/auth/register').send({ email, name: 'Ana', password: 'contrasena123' });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, email);
  assert.equal(res.body.user.passwordHash, undefined);
  const stored = await prisma.user.findUnique({ where: { email } });
  assert.notEqual(stored?.passwordHash, 'contrasena123');
});

test('RB-013 CP-013b email repetido se rechaza (409)', async () => {
  const email = uniqueEmail();
  await request(app).post('/api/auth/register').send({ email, name: 'Ana', password: 'contrasena123' });
  const res = await request(app).post('/api/auth/register').send({ email: email.toUpperCase(), name: 'Otra', password: 'contrasena123' });
  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'EMAIL_EN_USO');
});

test('RB-013 CP-013c contraseña corta se rechaza', async () => {
  const res = await request(app).post('/api/auth/register').send({ email: uniqueEmail(), name: 'Ana', password: '1234567' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'CONTRASENA_CORTA');
});

test('RB-013 validación: email inválido y nombre vacío se rechazan', async () => {
  const r1 = await request(app).post('/api/auth/register').send({ email: 'no-es-email', name: 'Ana', password: 'contrasena123' });
  assert.equal(r1.status, 400);
  assert.equal(r1.body.error.code, 'VALIDACION');
  const r2 = await request(app).post('/api/auth/register').send({ email: uniqueEmail(), name: '  ', password: 'contrasena123' });
  assert.equal(r2.status, 400);
});

test('RB-013 CP-013d login correcto e incorrecto', async () => {
  const email = uniqueEmail();
  await request(app).post('/api/auth/register').send({ email, name: 'Ana', password: 'contrasena123' });
  const ok = await request(app).post('/api/auth/login').send({ email, password: 'contrasena123' });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  const bad = await request(app).post('/api/auth/login').send({ email, password: 'otra-cosa-123' });
  assert.equal(bad.status, 401);
  assert.equal(bad.body.error.code, 'CREDENCIALES_INVALIDAS');
});

test('RB-012 CP-012c /me sin token o con token inválido devuelve 401', async () => {
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer token-falso');
  assert.equal(res.status, 401);
});

test('/me con token válido devuelve el usuario', async () => {
  const email = uniqueEmail();
  const reg = await request(app).post('/api/auth/register').send({ email, name: 'Ana', password: 'contrasena123' });
  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reg.body.token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, email);
});
