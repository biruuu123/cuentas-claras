import { parseMoney, parsePercent } from './money';
import type { SplitType } from './api';

export type SplitPayload =
  | { type: 'IGUAL'; participants: number[] }
  | { type: 'PORCENTAJE'; parts: { userId: number; basisPoints: number }[] }
  | { type: 'EXACTO'; parts: { userId: number; amount: number }[] };

export type SplitDraft = {
  type: SplitType;
  /** Para IGUAL: miembros tildados. */
  selected: number[];
  /** Para PORCENTAJE y EXACTO: texto ingresado por miembro (vacío = no participa). */
  values: Record<number, string>;
};

/** Validación del reparto en el frontend (espejo de RB-002, RB-003 y RB-004). */
export function buildSplit(total: number | null, draft: SplitDraft): { split: SplitPayload } | { error: string } {
  if (total === null) return { error: 'Ingresá un monto válido (por ejemplo 1500 o 1.500,50).' };
  if (draft.type === 'IGUAL') {
    if (draft.selected.length === 0) return { error: 'Elegí al menos un participante.' };
    return { split: { type: 'IGUAL', participants: draft.selected } };
  }
  const filled = Object.entries(draft.values).filter(([, v]) => v.trim() !== '');
  if (filled.length === 0) return { error: 'Completá la parte de al menos un participante.' };
  if (draft.type === 'PORCENTAJE') {
    const parts: { userId: number; basisPoints: number }[] = [];
    for (const [id, v] of filled) {
      const bp = parsePercent(v);
      if (bp === null) return { error: `Porcentaje inválido: "${v}".` };
      parts.push({ userId: Number(id), basisPoints: bp });
    }
    const sum = parts.reduce((s, p) => s + p.basisPoints, 0);
    if (sum !== 10_000) return { error: `Los porcentajes suman ${(sum / 100).toLocaleString('es-AR')} % y deben sumar 100 %.` };
    return { split: { type: 'PORCENTAJE', parts } };
  }
  const parts: { userId: number; amount: number }[] = [];
  for (const [id, v] of filled) {
    const cents = parseMoney(v);
    if (cents === null) return { error: `Monto inválido: "${v}".` };
    parts.push({ userId: Number(id), amount: cents });
  }
  const sum = parts.reduce((s, p) => s + p.amount, 0);
  if (sum !== total) return { error: `Las partes suman ${(sum / 100).toLocaleString('es-AR')} y el total es ${(total / 100).toLocaleString('es-AR')}.` };
  return { split: { type: 'EXACTO', parts } };
}
