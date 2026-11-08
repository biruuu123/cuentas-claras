import { DomainError } from './errors.ts';
import type { Share } from './split.ts';

export type Expense = { payerId: number; amount: number; shares: Share[] };
export type PaymentStatus = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO';
export type Payment = { fromId: number; toId: number; amount: number; status: PaymentStatus };

/** RB-005: pagador y participantes deben ser miembros del grupo. */
export function assertMembers(memberIds: number[], userIds: number[]): void {
  const members = new Set(memberIds);
  if (userIds.some((id) => !members.has(id))) throw new DomainError('NO_ES_MIEMBRO');
}

/** RB-006: saldo = pagado − correspondiente + pagos enviados − pagos recibidos (solo confirmados). */
export function computeBalances(
  memberIds: number[],
  expenses: Expense[],
  payments: Payment[],
): Map<number, number> {
  const balances = new Map<number, number>(memberIds.map((id) => [id, 0]));
  const add = (id: number, delta: number) => {
    if (!balances.has(id)) throw new DomainError('NO_ES_MIEMBRO');
    balances.set(id, balances.get(id)! + delta);
  };
  for (const e of expenses) {
    add(e.payerId, e.amount);
    for (const s of e.shares) add(s.userId, -s.amount);
  }
  for (const p of payments) {
    if (p.status !== 'CONFIRMADO') continue;
    add(p.fromId, p.amount);
    add(p.toId, -p.amount);
  }
  return balances;
}
