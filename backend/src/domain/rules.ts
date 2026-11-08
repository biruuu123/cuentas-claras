import { DomainError } from './errors.ts';
import { assertValidAmount } from './money.ts';
import type { PaymentStatus } from './balances.ts';

/** RB-008: valida un pago nuevo contra los saldos actuales. */
export function assertValidPayment(
  balances: Map<number, number>,
  fromId: number,
  toId: number,
  amount: number,
): void {
  assertValidAmount(amount);
  if (fromId === toId) throw new DomainError('PAGO_A_SI_MISMO');
  const from = balances.get(fromId);
  const to = balances.get(toId);
  if (from === undefined || to === undefined) throw new DomainError('NO_ES_MIEMBRO');
  if (from >= 0 || to <= 0 || amount > -from || amount > to) {
    throw new DomainError('PAGO_SUPERA_DEUDA');
  }
}

/** RB-009: solo el receptor resuelve un pago pendiente. */
export function resolvePayment(
  payment: { toId: number; status: PaymentStatus },
  actorId: number,
  decision: 'CONFIRMADO' | 'RECHAZADO',
): PaymentStatus {
  if (payment.toId !== actorId) throw new DomainError('SIN_PERMISO');
  if (payment.status !== 'PENDIENTE') throw new DomainError('PAGO_YA_RESUELTO');
  return decision;
}

/** RB-010: el admin quita miembros sin saldo pendiente, nunca a sí mismo. */
export function assertCanRemoveMember(
  group: { adminId: number },
  actorId: number,
  memberId: number,
  memberBalance: number,
): void {
  if (actorId !== group.adminId) throw new DomainError('SIN_PERMISO');
  if (memberId === group.adminId) throw new DomainError('ES_ADMIN');
  if (memberBalance !== 0) throw new DomainError('SALDO_PENDIENTE');
}

/** RB-011: solo el creador del gasto o el admin lo editan o eliminan. */
export function assertCanEditExpense(
  expense: { createdById: number },
  group: { adminId: number },
  actorId: number,
): void {
  if (actorId !== expense.createdById && actorId !== group.adminId) {
    throw new DomainError('SIN_PERMISO');
  }
}
