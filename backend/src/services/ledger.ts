import { prisma } from '../db.ts';
import { computeBalances, type Payment } from '../domain/balances.ts';

/**
 * Calcula los saldos del grupo (RB-006).
 * Incluye a ex miembros que figuran en gastos o pagos viejos para que la suma siga dando cero.
 * Con includePending = true, los pagos pendientes se cuentan como hechos (se usa para validar pagos nuevos).
 */
export async function groupBalances(groupId: number, memberIds: number[], includePending = false) {
  const [expenses, payments] = await Promise.all([
    prisma.expense.findMany({ where: { groupId }, include: { shares: true } }),
    prisma.payment.findMany({ where: { groupId, status: { not: 'RECHAZADO' } } }),
  ]);
  const ids = new Set(memberIds);
  for (const e of expenses) {
    ids.add(e.payerId);
    e.shares.forEach((s) => ids.add(s.userId));
  }
  for (const p of payments) {
    ids.add(p.fromId);
    ids.add(p.toId);
  }
  const domainPayments: Payment[] = payments.map((p) => ({
    fromId: p.fromId,
    toId: p.toId,
    amount: p.amount,
    status: includePending && p.status === 'PENDIENTE' ? 'CONFIRMADO' : p.status,
  }));
  return computeBalances(
    [...ids].sort((a, b) => a - b),
    expenses.map((e) => ({ payerId: e.payerId, amount: e.amount, shares: e.shares })),
    domainPayments,
  );
}
