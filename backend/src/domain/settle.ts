export type Transfer = { fromId: number; toId: number; amount: number };

/**
 * RB-007: empareja repetidamente al mayor deudor con el mayor acreedor.
 * Cada paso deja al menos un saldo en cero, por lo que hay como máximo n − 1 transferencias.
 */
export function settle(balances: Map<number, number>): Transfer[] {
  const debtors = [...balances].filter(([, v]) => v < 0).map(([id, v]) => ({ id, v: -v }));
  const creditors = [...balances].filter(([, v]) => v > 0).map(([id, v]) => ({ id, v }));
  const byAmount = (a: { id: number; v: number }, b: { id: number; v: number }) => b.v - a.v || a.id - b.id;
  const transfers: Transfer[] = [];
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(byAmount);
    creditors.sort(byAmount);
    const d = debtors[0]!;
    const c = creditors[0]!;
    const amount = Math.min(d.v, c.v);
    transfers.push({ fromId: d.id, toId: c.id, amount });
    d.v -= amount;
    c.v -= amount;
    if (d.v === 0) debtors.shift();
    if (c.v === 0) creditors.shift();
  }
  return transfers;
}
