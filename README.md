# Cuentas Claras

Aplicación web para dividir gastos en grupos (viajes, departamentos compartidos, amigos) y saber quién le debe a quién, con la mínima cantidad de transferencias para saldar todo.

> Proyecto final de Generación T.

**App publicada:** https://cuentas-claras-chi-three.vercel.app
**API:** https://cuentas-claras-api-3wyo.onrender.com (salud: `/api/health`)
**Repositorio:** https://github.com/biruuu123/cuentas-claras

> El servidor usa el plan gratuito de Render y se duerme sin uso: la primera carga puede tardar unos 50 segundos.

## Problema
En los grupos nadie sabe con certeza cuánto debe cada uno. Las planillas se desordenan y los redondeos generan discusiones.

## Funcionalidades
- Registro e inicio de sesión.
- Grupos con administrador y miembros.
- Gastos con reparto igual, por porcentajes o por montos exactos.
- Saldos por miembro y plan de liquidación mínimo.
- Pagos entre miembros con confirmación del receptor.

Las reglas de negocio están numeradas en [`SPEC.md`](SPEC.md).

## Tecnologías
React + TypeScript (Vite) · Node.js + Express + TypeScript · PostgreSQL (Neon) + Prisma · Vercel · Render.

## Arquitectura
```
frontend (Vercel)  ──HTTP/JSON──>  backend (Render)  ──>  PostgreSQL (Neon)
                                   routes → services → domain / repositories
```

## Ejecutar localmente
Requisitos: Node.js 20 o superior y una base PostgreSQL (por ejemplo, un proyecto gratuito de Neon).

```bash
# Backend
cd backend
npm install
# crear backend/.env a partir de ../.env.example y completar los valores
npx prisma migrate dev
npm run dev            # API en http://localhost:3000

# Frontend (otra terminal)
cd frontend
npm install
# opcional: crear frontend/.env con VITE_API_URL=http://localhost:3000
npm run dev            # web en http://localhost:5173
```

## Variables de entorno
Ver `.env.example`. El archivo `.env` nunca se sube a GitHub.

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión directa a PostgreSQL (Neon), la usa Prisma |
| `DATABASE_URL_POOLED` | Conexión con pool de Neon (reservada para producción) |
| `JWT_SECRET` | Secreto para firmar tokens |
| `FRONTEND_URL` | Origen permitido por CORS |
| `PORT` | Puerto del backend |

## Tests
```bash
cd backend && npm test       # 62 tests: unitarios + integración contra el esquema "test" de la base
cd frontend && npm test      # 9 tests
```
Resultados y cobertura por regla en [`TESTING.md`](TESTING.md).

## Documentación
[`SPEC.md`](SPEC.md) · [`AGENTS.md`](AGENTS.md) y [`.claude/agents/`](.claude/agents) · [`PLAN.md`](PLAN.md) · [`TESTING.md`](TESTING.md) · [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md) · [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) · [`docs/AUDITORIA.md`](docs/AUDITORIA.md)

## Aplicación publicada
- Frontend: https://cuentas-claras-chi-three.vercel.app
- Backend: https://cuentas-claras-api-3wyo.onrender.com

Detalles de configuración en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).
