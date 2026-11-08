# PLAN — Cuentas Claras

Entrega: 31/12/2026. Estados: `pendiente`, `en progreso`, `completada`.

## Arquitectura (resumen)
- **Frontend:** React + TypeScript + Vite → Vercel.
- **Backend:** Node.js + Express + TypeScript → Render.
- **Base de datos:** PostgreSQL en Neon, acceso con Prisma (migraciones versionadas).
- **Auth:** JWT en header `Authorization: Bearer`, contraseñas con bcrypt.
- **Validación:** Zod en backend; validación equivalente en formularios del frontend.
- **Tests:** `node:test` + `tsx` para dominio; Supertest para endpoints; Vitest + Testing Library en frontend.
- **Capas del backend:** `routes → services → domain (puro) / repositories (Prisma)`. Las reglas viven en `domain/` y no dependen de Express ni de la base.

## Fases y tareas

| ID | Tarea | Depende de | Prioridad | Criterio de aceptación | Estado |
|---|---|---|---|---|---|
| T-01 | Documentación base (SPEC, AGENTS, PLAN, TESTING, README) | — | Alta | Documentos completos y versionados | completada |
| T-02 | Estructura del backend y configuración de tests | T-01 | Alta | `npm test` ejecuta | completada |
| T-03 | Dominio: dinero y validación de montos (RB-001) | T-02 | Alta | Tests CP-001 pasan | completada |
| T-04 | Dominio: repartos (RB-002, RB-003, RB-004) | T-03 | Alta | Tests CP-002 a CP-004 pasan | pendiente |
| T-05 | Dominio: saldos (RB-005, RB-006) | T-04 | Alta | Tests CP-005, CP-006 pasan | pendiente |
| T-06 | Dominio: plan de liquidación (RB-007) | T-05 | Alta | Tests CP-007 pasan | pendiente |
| T-07 | Dominio: pagos y permisos (RB-008 a RB-011) | T-05 | Alta | Tests CP-008 a CP-011 pasan | pendiente |
| T-08 | Esquema Prisma y migración inicial | T-02 | Alta | Migración aplica en Neon | pendiente |
| T-09 | Auth: registro y login (RB-013) | T-08 | Alta | Tests CP-013 pasan | pendiente |
| T-10 | API grupos y miembros (RB-010, RB-012) | T-09 | Alta | Tests de integración pasan | pendiente |
| T-11 | API gastos (RB-002 a RB-005, RB-011) | T-10 | Alta | Tests de integración pasan | pendiente |
| T-12 | API saldos, liquidación y pagos (RB-006 a RB-009) | T-11 | Alta | Tests de integración pasan | pendiente |
| T-13 | Frontend: estructura, routing, login y registro | T-09 | Alta | Flujo de login funciona contra la API | pendiente |
| T-14 | Frontend: grupos y miembros | T-10, T-13 | Alta | Crear grupo y agregar miembro | pendiente |
| T-15 | Frontend: gastos | T-11, T-14 | Alta | Alta/edición con los 3 repartos | pendiente |
| T-16 | Frontend: saldos, liquidación y pagos | T-12, T-15 | Alta | Pagar y confirmar desde la UI | pendiente |
| T-17 | Revisión de seguridad | T-12 | Alta | Checklist de AGENTS.md sin hallazgos abiertos | pendiente |
| T-18 | Despliegue: Neon + Render + Vercel | T-16 | Alta | Flujo principal probado en producción | pendiente |
| T-19 | Informe de testing final y README con links | T-18 | Alta | TESTING.md con resultados reales | pendiente |
| T-20 | Auditoría final | T-19 | Alta | Checklist de la consigna completo | pendiente |

## Calendario sugerido
- Semana 1 (9–15 nov): T-08 a T-10.
- Semana 2 (16–22 nov): T-11, T-12.
- Semana 3 (23–29 nov): T-13, T-14.
- Semana 4 (30 nov–6 dic): T-15, T-16.
- Semana 5 (7–13 dic): T-17, T-18.
- Semana 6 (14–20 dic): T-19, T-20.
- 21–31 dic: margen para imprevistos. No se agregan funcionalidades.

## Riesgos
- Fiestas: el margen final no se usa para extras.
- Render gratuito "duerme" el servidor: la primera petición tarda ~1 minuto. Se avisa en el README.
