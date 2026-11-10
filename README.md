# Cuentas Claras

Aplicación web para dividir gastos en grupos (viajes, departamentos compartidos, amigos) y saber quién le debe a quién, con la mínima cantidad de transferencias para saldar todo.

> Proyecto final de Generación T. Estado: en desarrollo (ver `PLAN.md`).

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
Requisitos: Node.js 20 o superior.

```bash
cd backend
npm install
cp ../.env.example .env   # completar valores
npm test
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
cd backend && npm test
```
Resultados en [`TESTING.md`](TESTING.md).

## Aplicación publicada
Pendiente (tarea T-18).
