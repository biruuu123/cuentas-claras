# Revisión de seguridad (T-17)

Revisión hecha por el agente Security Reviewer siguiendo el checklist de `AGENTS.md`.

| Punto | Estado | Evidencia |
|---|---|---|
| Contraseñas con bcrypt (costo 10), nunca devueltas | OK | `auth-service.ts` solo devuelve `id`, `email`, `name`; test CP-013a verifica que no se expone el hash |
| JWT firmado con `JWT_SECRET` de entorno, vence a los 7 días | OK | `http/auth.ts`, `config.ts` falla al arrancar si falta |
| Toda ruta de grupo verifica membresía (RB-012) | OK | Todos los servicios de grupo llaman a `requireMembership`; tests de 403 en grupos, gastos, saldos y pagos |
| Permisos de admin y creador (RB-010, RB-011) y receptor (RB-009) | OK | Reglas en `domain/rules.ts`, tests unitarios y de integración |
| Validación de entrada con Zod en cuerpos y parámetros | OK | `routes/*.ts`, `routes/params.ts`; cuerpo JSON limitado a 100 kB |
| Errores sin detalles internos | OK | `http/errors.ts` devuelve 500 genérico y loguea en el servidor |
| CORS limitado a `FRONTEND_URL` | OK | `app.ts` |
| Encabezado `X-Powered-By` deshabilitado | OK | `app.ts` |
| Secretos fuera del repositorio | OK | `.env` en `.gitignore`; solo se versiona `.env.example` con valores de ejemplo |
| Tests aislados de los datos reales | OK | `scripts/test.mjs` usa el esquema `test` |
| Inyección SQL | OK | Prisma usa consultas parametrizadas; no hay SQL crudo |
| XSS | OK | React escapa el contenido; no se usa `dangerouslySetInnerHTML` |

## Riesgos aceptados
- El token se guarda en `localStorage`. Es vulnerable si existiera un XSS; se mitiga porque React escapa todo el contenido. Para un producto real convendría una cookie `httpOnly`.
- No hay límite de intentos de login. Mejora futura: limitador de peticiones por IP.

## Pendiente de verificar en la PC del desarrollador
- `npm audit` informó 4 vulnerabilidades altas al instalar en T-08. Hay que revisar `npm audit` con las dependencias actuales y registrar el resultado acá.
