# AGENTS — Cuentas Claras

Documento central para todos los agentes (humanos o IA) que trabajan en el repositorio.

## Fuentes de verdad
1. `SPEC.md`: qué se construye. Nada fuera de su alcance.
2. `PLAN.md`: qué tarea se hace y en qué orden.
3. Este archivo: cómo se trabaja.

Ante conflicto, manda SPEC.md. Si algo no está en la SPEC, el agente se detiene y le consulta al Project Manager.

## Agentes

| Agente | Responsabilidad | Puede modificar | Entregable |
|---|---|---|---|
| Project Manager | Elige la próxima tarea de PLAN.md, asigna agente, controla dependencias y fechas, avisa riesgos de alcance | `PLAN.md` | Tarea asignada con criterio de aceptación |
| Product Designer / UX | Define pantallas, flujos, estados de carga/error/vacío y textos | `docs/ux/` | Especificación de pantalla antes de cada tarea de frontend |
| Frontend Developer | Implementa la interfaz en React | `frontend/` | Pantalla funcional conectada a la API, con tests |
| Backend Developer | Implementa reglas en `domain/`, servicios y endpoints | `backend/src/` excepto `prisma/` | Endpoint con tests de integración |
| Database Engineer | Diseña el esquema, migraciones e índices | `backend/prisma/` | Migración aplicable y reversible |
| QA Engineer | Escribe y ejecuta tests, valida criterios de aceptación, registra resultados | `backend/test/`, `frontend/src/**/*.test.tsx`, `TESTING.md` | Aprobación o rechazo de la tarea con evidencia |
| Security Reviewer | Revisa auth, permisos, validaciones, secretos, CORS, dependencias | Solo comentarios; los cambios los hace el dueño del archivo | Checklist de seguridad |
| Code Reviewer | Revisa legibilidad, convenciones y respeto de la arquitectura | Solo comentarios | Aprobación del cambio |

## Flujo de una tarea
1. PM marca la tarea `en progreso` en PLAN.md.
2. (Frontend) UX entrega la especificación de pantalla.
3. El desarrollador implementa y escribe tests junto con el código.
4. El desarrollador corre `npm test` en el paquete tocado. Todo debe pasar.
5. QA ejecuta la suite completa, verifica el criterio de aceptación y registra el resultado en TESTING.md.
6. Code Reviewer (y Security Reviewer si toca auth, permisos o datos) aprueban.
7. PM marca la tarea `completada`.
8. Se hace **un commit por tarea**: `T-XX: descripción breve`.

Ninguna tarea se marca completada sin tests ejecutados y aprobados.

## Arquitectura obligatoria
- Backend en capas: `routes/` (HTTP, validación Zod) → `services/` (orquestación, transacciones) → `domain/` (reglas puras) y `repositories/` (Prisma).
- `domain/` no importa Express, Prisma ni nada con efectos secundarios.
- Dinero siempre en centavos enteros. Porcentajes en puntos básicos.
- Los errores de negocio se lanzan como `DomainError(codigo)` y se traducen a HTTP en un único middleware.
- Respuestas de error: `{ "error": { "code": "...", "message": "..." } }`.

## Convenciones
- TypeScript estricto. Sin `any` salvo justificación en comentario.
- Archivos `kebab-case.ts`; componentes React `PascalCase.tsx`; funciones y variables `camelCase`; constantes `UPPER_SNAKE_CASE`.
- Rutas REST en plural y en inglés: `/api/groups/:id/expenses`.
- Cada test referencia la regla y el caso: `test('RB-002 CP-002a ...')`.

## Testing
- Cada regla RB-XXX tiene al menos un caso positivo y uno negativo.
- Dominio: tests unitarios sin base de datos.
- Endpoints: Supertest contra una base de test separada.
- Frontend: tests de formularios y flujos principales.
- Está prohibido borrar o saltear tests para que la suite pase.

## Prohibido
- Agregar funcionalidades fuera de SPEC.md.
- Cambiar la arquitectura o el stack sin aprobación del PM y del usuario.
- Versionar `.env`, contraseñas, tokens o URLs con credenciales.
- Usar `float` para dinero.
- Datos falsos en lugar de funcionalidad real, botones sin acción o pantallas a medio hacer.
- Commits que mezclen tareas independientes o commits vacíos.
- Declarar que algo funciona sin haberlo ejecutado.

## Checklist de seguridad
- Contraseñas con bcrypt; nunca se devuelven en respuestas.
- Toda ruta de grupo verifica membresía (RB-012).
- Validación Zod en todos los cuerpos y parámetros.
- CORS limitado a la URL del frontend.
- `JWT_SECRET` y `DATABASE_URL` solo en variables de entorno.
- `npm audit` sin vulnerabilidades altas.

## Cómo informar una tarea terminada
```
Tarea: T-XX
Reglas cubiertas: RB-...
Archivos modificados: ...
Tests: N pasando, 0 fallando (comando ejecutado: ...)
QA: aprobado / rechazado (motivo)
Commit: <hash>
```

## Implementación en el entorno
Con Claude Code, cada agente se define como subagente en `.claude/agents/<nombre>.md` con una copia de su fila de esta tabla y sus límites. El agente principal actúa como Project Manager: lee PLAN.md, delega la tarea al subagente correspondiente y luego al QA antes de hacer el commit.
