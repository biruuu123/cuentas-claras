import request from 'supertest';
import { createApp } from '../src/app.ts';

export const app = createApp();

let counter = 0;
/** Email único por ejecución para que los tests no choquen entre sí. */
export function uniqueEmail(prefix = 'user'): string {
  counter += 1;
  return `${prefix}.${Date.now()}.${counter}.${Math.floor(Math.random() * 1e6)}@test.com`;
}

export type TestUser = { id: number; email: string; name: string; token: string };

export async function createUser(name = 'Usuario'): Promise<TestUser> {
  const email = uniqueEmail(name.toLowerCase());
  const res = await request(app).post('/api/auth/register').send({ email, name, password: 'contrasena123' });
  if (res.status !== 201) throw new Error(`No se pudo registrar: ${JSON.stringify(res.body)}`);
  return { ...res.body.user, token: res.body.token };
}

export const auth = (u: TestUser) => ({ Authorization: `Bearer ${u.token}` });
