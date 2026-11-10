import { describe, expect, test } from 'vitest';
import { centsToInput, formatMoney, parseMoney, parsePercent } from './money';

describe('parseMoney (RB-001 en el frontend)', () => {
  test('acepta formatos argentinos y con punto decimal', () => {
    expect(parseMoney('1.234,56')).toBe(123456);
    expect(parseMoney('1234,5')).toBe(123450);
    expect(parseMoney('1234.56')).toBe(123456);
    expect(parseMoney('$ 10')).toBe(1000);
    expect(parseMoney('1.000')).toBe(100000);
    expect(parseMoney('0,01')).toBe(1);
  });

  test('rechaza vacíos, cero, negativos, más de 2 decimales y montos enormes', () => {
    for (const v of ['', '0', '0,00', '-5', '10,555', 'abc', '1.000.000,01', '12,3,4']) {
      expect(parseMoney(v)).toBeNull();
    }
  });
});

describe('parsePercent (RB-003 en el frontend)', () => {
  test('convierte a puntos básicos', () => {
    expect(parsePercent('50')).toBe(5000);
    expect(parsePercent('33,33')).toBe(3333);
    expect(parsePercent('100%')).toBe(10000);
  });

  test('rechaza cero, más de 100 y texto', () => {
    for (const v of ['0', '100,01', 'x', '']) expect(parsePercent(v)).toBeNull();
  });
});

test('formatMoney y centsToInput', () => {
  expect(formatMoney(123456)).toContain('1.234,56');
  expect(centsToInput(123456)).toBe('1234,56');
});
