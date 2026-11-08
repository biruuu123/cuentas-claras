import { DomainError } from './errors.ts';

/** Monto máximo permitido en centavos (1.000.000,00). */
export const MAX_AMOUNT_CENTS = 100_000_000;

/** RB-001: valida que un monto sea un entero de centavos dentro del rango permitido. */
export function assertValidAmount(amount: unknown): asserts amount is number {
  if (
    typeof amount !== 'number' ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount > MAX_AMOUNT_CENTS
  ) {
    throw new DomainError('MONTO_INVALIDO');
  }
}
