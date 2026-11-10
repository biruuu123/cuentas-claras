import bcrypt from 'bcryptjs';
import { prisma } from '../db.ts';
import { DomainError } from '../domain/errors.ts';

export type PublicUser = { id: number; email: string; name: string };

const toPublic = (u: { id: number; email: string; name: string }): PublicUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
});

/** RB-013: email único, contraseña de 8+ caracteres guardada con bcrypt. */
export async function register(email: string, name: string, password: string): Promise<PublicUser> {
  if (password.length < 8) throw new DomainError('CONTRASENA_CORTA');
  const normalized = email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normalized } })) throw new DomainError('EMAIL_EN_USO');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email: normalized, name: name.trim(), passwordHash } });
  return toPublic(user);
}

export async function login(email: string, password: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new DomainError('CREDENCIALES_INVALIDAS');
  }
  return toPublic(user);
}

export async function getUser(id: number): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new DomainError('NO_AUTENTICADO');
  return toPublic(user);
}
