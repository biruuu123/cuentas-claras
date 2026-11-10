import { prisma } from '../db.ts';
import { DomainError } from '../domain/errors.ts';
import { assertValidPayment, resolvePayment } from '../domain/rules.ts';
import { settle } from '../domain/settle.ts';
import { requireMembership } from './access.ts';
import { groupBalances } from './ledger.ts';

/** RB-006 y RB-007: saldos por miembro y plan de liquidación. */
export async function getBalances(groupId: number, userId: number) {
  const group = await requireMembership(groupId, userId);
  const balances = await groupBalances(groupId, group.memberIds);
  const users = await prisma.user.findMany({
    where: { id: { in: [...balances.keys()] } },
    select: { id: true, name: true },
  });
  const nameOf = new Map(users.map((u) => [u.id, u.name]));
  return {
    balances: [...balances]
      .filter(([id, v]) => group.memberIds.includes(id) || v !== 0)
      .map(([id, balance]) => ({ userId: id, name: nameOf.get(id) ?? '?', balance })),
    settlement: settle(balances).map((t) => ({
      ...t,
      fromName: nameOf.get(t.fromId) ?? '?',
      toName: nameOf.get(t.toId) ?? '?',
    })),
  };
}

const include = {
  from: { select: { id: true, name: true } },
  to: { select: { id: true, name: true } },
} as const;

export async function listPayments(groupId: number, userId: number) {
  await requireMembership(groupId, userId);
  return prisma.payment.findMany({ where: { groupId }, include, orderBy: { createdAt: 'desc' } });
}

/** RB-008: el usuario registra un pago a otro miembro. Los pagos pendientes cuentan para no pagar de más. */
export async function createPayment(groupId: number, fromId: number, toId: number, amount: number) {
  const group = await requireMembership(groupId, fromId);
  if (!group.memberIds.includes(toId)) throw new DomainError('NO_ES_MIEMBRO');
  const balances = await groupBalances(groupId, group.memberIds, true);
  assertValidPayment(balances, fromId, toId, amount);
  return prisma.payment.create({ data: { groupId, fromId, toId, amount }, include });
}

/** RB-009: solo el receptor confirma o rechaza un pago pendiente. */
export async function resolve(
  groupId: number,
  paymentId: number,
  userId: number,
  decision: 'CONFIRMADO' | 'RECHAZADO',
) {
  await requireMembership(groupId, userId);
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.groupId !== groupId) throw new DomainError('NO_ENCONTRADO');
  const status = resolvePayment(payment, userId, decision);
  const updated = await prisma.payment.updateMany({
    where: { id: paymentId, status: 'PENDIENTE' },
    data: { status, resolvedAt: new Date() },
  });
  if (updated.count === 0) throw new DomainError('PAGO_YA_RESUELTO');
  return prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include });
}
