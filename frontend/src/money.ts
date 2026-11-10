/** Utilidades de dinero del frontend. Los montos viajan a la API en centavos enteros (RB-001). */

const MAX_CENTS = 100_000_000;

/** Convierte "1.234,56", "1234,5" o "1234.56" a centavos. Devuelve null si no es válido. */
export function parseMoney(input: string): number | null {
  let s = input.trim().replace(/\$/g, '').replace(/\s/g, '');
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, dec = ''] = s.split('.');
  const cents = Number(whole) * 100 + Number(dec.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_CENTS) return null;
  return cents;
}

/** Convierte "33,33" o "50" a puntos básicos (1 % = 100). Devuelve null si no es válido. */
export function parsePercent(input: string): number | null {
  const s = input.trim().replace('%', '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, dec = ''] = s.split('.');
  const bp = Number(whole) * 100 + Number(dec.padEnd(2, '0'));
  return bp > 0 && bp <= 10_000 ? bp : null;
}

const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

export function formatMoney(cents: number): string {
  return formatter.format(cents / 100);
}

/** Muestra centavos como texto editable, por ejemplo 123456 → "1234,56". */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}
