import { prisma } from '../db.ts';
import { DomainError } from '../domain/errors.ts';

/** RB-012: devuelve el grupo si existe y el usuario es miembro; si no, lanza el error correspondiente. */
export async function requireMembership(groupId: number, userId: number) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { memberships: { select: { userId: true } } },
  });
  if (!group) throw new DomainError('NO_ENCONTRADO');
  const memberIds = group.memberships.map((m) => m.userId);
  if (!memberIds.includes(userId)) throw new DomainError('NO_ES_MIEMBRO');
  return { id: group.id, name: group.name, adminId: group.adminId, memberIds };
}
