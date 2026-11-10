import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { DomainError, type DomainErrorCode } from '../domain/errors.ts';

const STATUS: Partial<Record<DomainErrorCode, number>> = {
  NO_AUTENTICADO: 401,
  CREDENCIALES_INVALIDAS: 401,
  NO_ES_MIEMBRO: 403,
  SIN_PERMISO: 403,
  NO_ENCONTRADO: 404,
  USUARIO_NO_ENCONTRADO: 404,
  EMAIL_EN_USO: 409,
  YA_ES_MIEMBRO: 409,
  PAGO_YA_RESUELTO: 409,
};

const MESSAGES: Record<DomainErrorCode, string> = {
  MONTO_INVALIDO: 'El monto debe ser mayor a 0 y menor a 1.000.000.',
  SIN_PARTICIPANTES: 'El gasto necesita al menos un participante.',
  PARTICIPANTE_DUPLICADO: 'Hay participantes repetidos.',
  PORCENTAJES_NO_SUMAN_100: 'Los porcentajes deben ser mayores a 0 y sumar 100 %.',
  MONTOS_NO_SUMAN_TOTAL: 'Los montos deben sumar el total del gasto.',
  NO_ES_MIEMBRO: 'No sos miembro de este grupo o la persona indicada no lo es.',
  PAGO_A_SI_MISMO: 'No podés registrar un pago a vos mismo.',
  PAGO_SUPERA_DEUDA: 'El pago supera lo que debés o lo que le deben a esa persona.',
  SIN_PERMISO: 'No tenés permiso para hacer esto.',
  PAGO_YA_RESUELTO: 'Este pago ya fue confirmado o rechazado.',
  SALDO_PENDIENTE: 'No se puede quitar a un miembro con saldo pendiente.',
  ES_ADMIN: 'No se puede quitar al administrador del grupo.',
  EMAIL_EN_USO: 'Ya existe una cuenta con ese email.',
  CONTRASENA_CORTA: 'La contraseña debe tener al menos 8 caracteres.',
  CREDENCIALES_INVALIDAS: 'Email o contraseña incorrectos.',
  NO_AUTENTICADO: 'Tenés que iniciar sesión.',
  NO_ENCONTRADO: 'No encontrado.',
  USUARIO_NO_ENCONTRADO: 'No hay ninguna cuenta registrada con ese email.',
  YA_ES_MIEMBRO: 'Esa persona ya es miembro del grupo.',
  VALIDACION: 'Datos inválidos.',
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof DomainError) {
    res.status(STATUS[err.code] ?? 400).json({ error: { code: err.code, message: MESSAGES[err.code] } });
    return;
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    res.status(400).json({
      error: { code: 'VALIDACION', message: first ? `${first.path.join('.')}: ${first.message}` : MESSAGES.VALIDACION },
    });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'VALIDACION', message: 'JSON inválido.' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'ERROR_INTERNO', message: 'Error interno del servidor.' } });
};
