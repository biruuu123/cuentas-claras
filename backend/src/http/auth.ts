import type { RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.ts';
import { DomainError } from '../domain/errors.ts';

export function signToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: '7d' });
}

/** Verifica el JWT del header Authorization y guarda el id en res.locals.userId. */
export const requireAuth: RequestHandler = (req, res, next) => {
  const [scheme, token] = (req.header('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new DomainError('NO_AUTENTICADO');
  let id: number;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    id = Number(typeof payload === 'object' ? payload.sub : NaN);
  } catch {
    throw new DomainError('NO_AUTENTICADO');
  }
  if (!Number.isInteger(id)) throw new DomainError('NO_AUTENTICADO');
  res.locals.userId = id;
  next();
};

/** Id del usuario autenticado (requiere requireAuth antes). */
export function currentUserId(res: Response): number {
  const id = res.locals.userId as number | undefined;
  if (id === undefined) throw new DomainError('NO_AUTENTICADO');
  return id;
}
