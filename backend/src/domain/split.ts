import { DomainError } from './errors.ts';
import { assertValidAmount } from './money.ts';

export type Share = { userId: number; amount: number };

export type SplitInput =
  | { type: 'IGUAL'; participants: number[] }
  | { type: 'PORCENTAJE'; parts: { userId: number; basisPoints: number }[] }
  | { type: 'EXACTO'; parts: { userId: number; amount: number }[] };

function assertUniqueParticipants(ids: number[]): void {
  if (ids.length === 0) throw new DomainError('SIN_PARTICIPANTES');
  if (new Set(ids).size !== ids.length) throw new DomainError('PARTICIPANTE_DUPLICADO');
}

/** RB-002: partes iguales; los centavos sobrantes van a los ids menores. */
export function splitEqual(total: number, participants: number[]): Share[] {
  assertValidAmount(total);
  assertUniqueParticipants(participants);
  const ids = [...participants].sort((a, b) => a - b);
  const base = Math.floor(total / ids.length);
  let remainder = total - base * ids.length;
  return ids.map((userId) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { userId, amount: base + extra };
  });
}

/** RB-003: por porcentajes (puntos básicos); sobrantes al porcentaje mayor, empate al id menor. */
export function splitPercentage(
  total: number,
  parts: { userId: number; basisPoints: number }[],
): Share[] {
  assertValidAmount(total);
  assertUniqueParticipants(parts.map((p) => p.userId));
  for (const p of parts) {
    if (!Number.isInteger(p.basisPoints) || p.basisPoints <= 0) {
      throw new DomainError('PORCENTAJES_NO_SUMAN_100', 'Cada porcentaje debe ser entero y mayor a 0');
    }
  }
  if (parts.reduce((s, p) => s + p.basisPoints, 0) !== 10_000) {
    throw new DomainError('PORCENTAJES_NO_SUMAN_100');
  }
  const shares = parts.map((p) => ({ userId: p.userId, amount: Math.floor((total * p.basisPoints) / 10_000) }));
  let remainder = total - shares.reduce((s, x) => s + x.amount, 0);
  const order = [...parts].sort((a, b) => b.basisPoints - a.basisPoints || a.userId - b.userId);
  for (let i = 0; remainder > 0; i = (i + 1) % order.length, remainder--) {
    shares.find((s) => s.userId === order[i]!.userId)!.amount += 1;
  }
  return shares.sort((a, b) => a.userId - b.userId);
}

/** RB-004: montos exactos que deben sumar el total. */
export function splitExact(total: number, parts: { userId: number; amount: number }[]): Share[] {
  assertValidAmount(total);
  assertUniqueParticipants(parts.map((p) => p.userId));
  for (const p of parts) assertValidAmount(p.amount);
  if (parts.reduce((s, p) => s + p.amount, 0) !== total) {
    throw new DomainError('MONTOS_NO_SUMAN_TOTAL');
  }
  return parts.map((p) => ({ ...p })).sort((a, b) => a.userId - b.userId);
}

export function split(total: number, input: SplitInput): Share[] {
  switch (input.type) {
    case 'IGUAL':
      return splitEqual(total, input.participants);
    case 'PORCENTAJE':
      return splitPercentage(total, input.parts);
    case 'EXACTO':
      return splitExact(total, input.parts);
  }
}
