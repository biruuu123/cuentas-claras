import { expect, test } from 'vitest';
import { buildSplit } from './split';

test('IGUAL: requiere participantes', () => {
  expect(buildSplit(1000, { type: 'IGUAL', selected: [], values: {} })).toHaveProperty('error');
  expect(buildSplit(1000, { type: 'IGUAL', selected: [1, 2], values: {} })).toEqual({
    split: { type: 'IGUAL', participants: [1, 2] },
  });
});

test('PORCENTAJE: deben sumar 100 %', () => {
  expect(buildSplit(1000, { type: 'PORCENTAJE', selected: [], values: { 1: '60', 2: '30' } })).toHaveProperty('error');
  expect(buildSplit(1000, { type: 'PORCENTAJE', selected: [], values: { 1: '33,33', 2: '66,67', 3: '' } })).toEqual({
    split: { type: 'PORCENTAJE', parts: [{ userId: 1, basisPoints: 3333 }, { userId: 2, basisPoints: 6667 }] },
  });
});

test('EXACTO: deben sumar el total', () => {
  expect(buildSplit(1000, { type: 'EXACTO', selected: [], values: { 1: '7', 2: '2' } })).toHaveProperty('error');
  expect(buildSplit(1000, { type: 'EXACTO', selected: [], values: { 1: '7', 2: '3' } })).toEqual({
    split: { type: 'EXACTO', parts: [{ userId: 1, amount: 700 }, { userId: 2, amount: 300 }] },
  });
});

test('monto total inválido', () => {
  expect(buildSplit(null, { type: 'IGUAL', selected: [1], values: {} })).toHaveProperty('error');
});
