# TESTING — Cuentas Claras

## Estrategia
- **Unitarios (dominio):** reglas puras en `backend/src/domain`, sin base de datos. Runner: `node:test` con `tsx`.
- **Integración (API):** Supertest contra una base de test separada (desde T-09).
- **Funcionales (frontend):** Vitest + Testing Library sobre formularios y flujos (desde T-13).
- Cada test se nombra con su regla y caso (`RB-002 CP-002a`). Cada regla tiene casos positivos y negativos.

## Resultados de ejecución

### 08/11/2026 — dominio (T-03 a T-07)
Comando: `cd backend && npm test`. Resultado: **34 tests, 34 pasando, 0 fallando**.

| Regla | Casos | Positivos | Negativos | Estado |
|---|---|---|---|---|
| RB-001 | CP-001a, b | ✔ | ✔ | Pasa |
| RB-002 | CP-002a–d | ✔ | ✔ | Pasa |
| RB-003 | CP-003a–d | ✔ | ✔ | Pasa |
| RB-004 | CP-004a–c | ✔ | ✔ | Pasa |
| RB-005 | CP-005a, b | ✔ | ✔ | Pasa |
| RB-006 | CP-006a, b | ✔ | — | Pasa |
| RB-007 | CP-007a–c (300 casos aleatorios) | ✔ | — | Pasa |
| RB-008 | CP-008a–d | ✔ | ✔ | Pasa |
| RB-009 | CP-009a–d | ✔ | ✔ | Pasa |
| RB-010 | CP-010a–c | ✔ | ✔ | Pasa |
| RB-011 | CP-011a–c | ✔ | ✔ | Pasa |
| RB-012 | — | | | Pendiente (T-10, integración) |
| RB-013 | — | | | Pendiente (T-09, integración) |

## Errores encontrados y corregidos
- T-02: `tsc` no reconocía imports con extensión `.ts`. Se agregó `allowImportingTsExtensions` y `noEmit` en `tsconfig.json`.
