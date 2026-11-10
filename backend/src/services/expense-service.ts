import { prisma } from '../db.ts';
import { assertMembers } from '../domain/balances.ts';
import { DomainError } from '../domain/errors.ts';
import { assertValidAmount } from '../domain/money.ts';
import { assertCanEditExpense } from '../domain/rules.ts';
import { split, type SplitInput } from '../domain/split.ts';
import { requireMembership } from './access.ts';

export type ExpenseInput = { description: string; amount: number; payerId: number; split: SplitInput };

const include = {
  shares: { include: { user: { select: { id: true, name: true } } } },
  payer: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

function participantIds(input: SplitInput): number[] {
  return input.type === 'IGUAL' ? input.participants : input.parts.map((p) => p.userId);
}

/** RB-001 a RB-005: valida y calcula las partes del gasto. */
function buildShares(memberIds: number[], input: ExpenseInput) {
  assertValidAmount(input.amount);
  assertMembers(memberIds, [input.payerId, ...participantIds(input.split)]);
  const shares = split(input.amount, input.split);
  const bp = new Map(input.split.type === 'PORCENTAJE' ? input.split.parts.map((p) => [p.userId, p.basisPoints]) : []);
  return shares.map((s) => ({ userId: s.userId, amount: s.amount, basisPoints: bp.get(s.userId) ?? null }));
}

export async function listExpenses(groupId: number, userId: number) {
  await requireMembership(groupId, userId);
  return prisma.expense.findMany({ where: { groupId }, include, orderBy: { createdAt: 'desc' } });
}

export async function createExpense(groupId: number, userId: number, input: ExpenseInput) {
  const group = await requireMembership(groupId, userId);
  const shares = buildShares(group.memberIds, input);
  return prisma.expense.create({
    data: {
      groupId,
      description: input.description.trim(),
      amount: input.amount,
      splitType: input.split.type,
      payerId: input.payerId,
      createdById: userId,
      shares: { create: shares },
    },
    include,
  });
}

async function findEditable(groupId: number, expenseId: number, userId: number) {
  const group = await requireMembership(groupId, userId);
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense || expense.groupId !== groupId) throw new DomainError('NO_ENCONTRADO');
  assertCanEditExpense(expense, group, userId); // RB-011
  return group;
}

export async function updateExpense(groupId: number, expenseId: number, userId: number, input: ExpenseInput) {
  const group = await findEditable(groupId, expenseId, userId);
  const shares = buildShares(group.memberIds, input);
  return prisma.$transaction(async (tx) => {
    await tx.expenseShare.deleteMany({ where: { expenseId } });
    return tx.expense.update({
      where: { id: expenseId },
      data: {
        description: input.description.trim(),
        amount: input.amount,
        splitType: input.split.type,
        payerId: input.payerId,
        shares: { create: shares },
      },
      include,
    });
  });
}

export async function deleteExpense(groupId: number, expenseId: number, userId: number) {
  await findEditable(groupId, expenseId, userId);
  await prisma.expense.delete({ where: { id: expenseId } });
}
