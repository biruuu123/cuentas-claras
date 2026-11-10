# Despliegue (T-18)

| Parte | Servicio | URL |
|---|---|---|
| Frontend | Vercel (plan Hobby) | https://cuentas-claras-chi-three.vercel.app |
| Backend | Render (plan Free, región Virginia) | https://cuentas-claras-api-3wyo.onrender.com |
| Base de datos | Neon PostgreSQL (región São Paulo) | privada, solo accesible con `DATABASE_URL` |

## Render (backend)
- Root Directory: `backend`
- Build Command: `npm install && npx prisma migrate deploy`
- Start Command: `npm run start`
- Variables de entorno: `DATABASE_URL`, `JWT_SECRET` (generado por Render, distinto al local), `FRONTEND_URL=https://cuentas-claras-chi-three.vercel.app`
- Cada push a `main` vuelve a desplegar y aplica las migraciones pendientes.
- Plan gratuito: el servidor se duerme tras 15 minutos sin uso y la primera petición tarda unos 50 segundos.

## Vercel (frontend)
- Root Directory: `frontend`, framework Vite.
- Variable de entorno: `VITE_API_URL=https://cuentas-claras-api-3wyo.onrender.com`
- `vercel.json` redirige todas las rutas a `index.html` para que funcione el router de React.

## Verificación en producción (10/11/2026)
1. `GET /api/health` → `{"ok":true}`.
2. Primer intento desde el frontend bloqueado por CORS porque `FRONTEND_URL` todavía apuntaba a localhost. Se corrigió la variable en Render.
3. Petición desde el origen de Vercel a `/api/auth/login` con credenciales falsas → 401 `CREDENCIALES_INVALIDAS` (CORS correcto).
4. Flujo principal probado a mano por el desarrollador con dos cuentas: registro, crear grupo, agregar miembro, gasto de $1000 en partes iguales, saldo de −$500, plan de liquidación, registrar pago, confirmarlo y saldos en cero. Resultado: correcto.

## Incidente durante el despliegue
- Primer deploy en Render falló con `P1012: the URL must start with the protocol postgresql://`. Causa: la variable `DATABASE_URL` se pegó con texto de más. Se corrigió el valor y el deploy siguiente funcionó.
