# TESTING — Cuentas Claras

## Estrategia
- **Unitarios (dominio):** reglas puras en `backend/src/domain`, sin base de datos. Runner: `node:test` con `tsx`.
- **Integración (API):** Supertest contra una base de test separada (desde T-09).
- **Funcionales (frontend):** Vitest + Testing Library sobre formularios y flujos (desde T-13).
- Cada test se nombra con su regla y caso (`RB-002 CP-002a`). Cada regla tiene casos positivos y negativos.

## Resultados de ejecución
(se completa a medida que avanzan las tareas)

## Errores encontrados y corregidos
(ninguno todavía)
