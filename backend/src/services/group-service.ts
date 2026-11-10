import { prisma } from '../db.ts';
import { DomainError } from '../domain/errors.ts';
import { assertCanRemoveMember } from '../domain/rules.ts';
import { requireMembership } from './access.ts';
import { groupBalances } from './ledger.ts';

const memberSelect = { user: { select: { id: true, name: true, email: true } } } as const;

export async function listGroups(userId: number) {
  const groups = await prisma.group.findMany({
    where: { memberships: { some: { userId } } },
    include: { _count: { select: { memberships: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return groups.map((g) => ({ id: g.id, name: g.name, adminId: g.adminId, memberCount: g._count.memberships }));
}

/** F-02: el creador queda como administrador y primer miembro. */
export async function createGroup(userId: number, name: string) {
  const group = await prisma.group.create({
    data: { name: name.trim(), adminId: userId, memberships: { create: { userId } } },
  });
  return getGroup(group.id, userId);
}

export async function getGroup(groupId: number, userId: number) {
  await requireMembership(groupId, userId);
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    include: { memberships: { select: memberSelect, orderBy: { joinedAt: 'asc' } } },
  });
  return {
    id: group.id,
    name: group.name,
    adminId: group.adminId,
    members: group.memberships.map((m) => m.user),
  };
}

/** F-03: solo el administrador agrega miembros, buscándolos por email. */
export async function addMember(groupId: number, actorId: number, email: string) {
  const group = await requireMembership(groupId, actorId);
  if (group.adminId !== actorId) throw new DomainError('SIN_PERMISO');
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) throw new DomainError('USUARIO_NO_ENCONTRADO');
  if (group.memberIds.includes(user.id)) throw new DomainError('YA_ES_MIEMBRO');
  await prisma.membership.create({ data: { groupId, userId: user.id } });
  return getGroup(groupId, actorId);
}

/** RB-010: el admin quita miembros sin saldo pendiente. */
export async function removeMember(groupId: number, actorId: number, memberId: number) {
  const group = await requireMembership(groupId, actorId);
  if (!group.memberIds.includes(memberId)) throw new DomainError('NO_ES_MIEMBRO');
  const balances = await groupBalances(groupId, group.memberIds, true);
  assertCanRemoveMember(group, actorId, memberId, balances.get(memberId) ?? 0);
  await prisma.membership.delete({ where: { groupId_userId: { groupId, userId: memberId } } });
  return getGroup(groupId, actorId);
}
