# Auditoría final (T-20) — 10/11/2026

| Requisito | Estado | Evidencia |
|---|---|---|
| Proyecto propio, no ReservaClub | ✔ | Cuentas Claras: gastos compartidos y liquidación de deudas |
| SPEC.md con reglas numeradas | ✔ | RB-001 a RB-013 con condiciones, validaciones y casos de prueba |
| AGENTS.md completo | ✔ | 8 agentes con responsabilidades, límites y flujo; definiciones en `.claude/agents/` |
| PLAN.md actualizado | ✔ | T-01 a T-20 completadas |
| Todas las tareas completadas | ✔ | ver PLAN.md |
| Frontend completo y funcional | ✔ | Login, registro, grupos, gastos (3 repartos), saldos, liquidación, pagos, miembros |
| Backend publicado | ✔ | https://cuentas-claras-api-3wyo.onrender.com/api/health |
| Base de datos publicada | ✔ | Neon PostgreSQL, migración `init` aplicada |
| Reglas de negocio implementadas | ✔ | `backend/src/domain` + servicios |
| Tests ejecutados y aprobados | ✔ | Backend 62/62, frontend 9/9 (TESTING.md) |
| Informe de testing | ✔ | TESTING.md |
| Un commit por tarea | ✔ con observación | Commits `T-01` a `T-20`, uno por tarea. Hay además un commit "Arreglo", que limpió tests duplicados y agregó los `package-lock.json`. No agrupa tareas, pero su nombre no sigue la convención. |
| README completo | ✔ | qué es, problema, funcionalidades, stack, arquitectura, ejecución local, variables, tests, links |
| Repositorio público | ✔ | https://github.com/biruuu123/cuentas-claras |
| Sin secretos ni .env en GitHub | ✔ | `git ls-files` solo lista `.env.example` y `frontend/.env.example` con valores de ejemplo |
| Aplicación accesible desde internet | ✔ | https://cuentas-claras-chi-three.vercel.app |
| Flujo principal probado en producción | ✔ | docs/DESPLIEGUE.md y TESTING.md |

## Observaciones pendientes (no bloquean la entrega)
- `npm install` informó vulnerabilidades en dependencias: backend 5 altas; frontend 8 (5 moderadas, 1 alta, 2 críticas). Las del frontend corresponden a herramientas de desarrollo (Vite, Vitest y esbuild), que no forman parte de la web publicada. Hay que revisar con `npm audit --omit=dev` qué afecta a producción y actualizar sin `--force`.
- Plan gratuito de Render: primera carga de unos 50 segundos después de un rato sin uso.
