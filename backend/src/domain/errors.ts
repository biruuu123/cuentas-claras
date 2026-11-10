export type DomainErrorCode =
  | 'MONTO_INVALIDO'
  | 'SIN_PARTICIPANTES'
  | 'PARTICIPANTE_DUPLICADO'
  | 'PORCENTAJES_NO_SUMAN_100'
  | 'MONTOS_NO_SUMAN_TOTAL'
  | 'NO_ES_MIEMBRO'
  | 'PAGO_A_SI_MISMO'
  | 'PAGO_SUPERA_DEUDA'
  | 'SIN_PERMISO'
  | 'PAGO_YA_RESUELTO'
  | 'SALDO_PENDIENTE'
  | 'ES_ADMIN'
  | 'EMAIL_EN_USO'
  | 'CONTRASENA_CORTA'
  | 'CREDENCIALES_INVALIDAS'
  | 'NO_AUTENTICADO'
  | 'NO_ENCONTRADO'
  | 'USUARIO_NO_ENCONTRADO'
  | 'YA_ES_MIEMBRO'
  | 'VALIDACION';

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'DomainError';
  }
}
