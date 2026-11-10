# TESTING — Cuentas Claras

## Estrategia
| Nivel | Qué prueba | Herramienta | Dónde |
|---|---|---|---|
| Unitarios | Reglas de negocio puras (`backend/src/domain`) sin base de datos | `node:test` + `tsx` | `backend/test/{balances,errors,money,rules,settle,split}.test.ts` |
| Integración | Endpoints HTTP reales contra PostgreSQL (Neon) | `node:test` + Supertest | `backend/test/api-*.test.ts` |
| Frontend | Conversión de montos y validación de repartos en formularios | Vitest | `frontend/src/*.test.ts` |
| Funcional en producción | Flujo principal completo en las URLs publicadas | Manual | ver abajo |

- Los tests de integración usan el esquema `test` de la base. `npm test` lo recrea desde cero en cada ejecución (`prisma db push --force-reset`), así nunca tocan los datos reales del esquema `public`.
- Cada test se nombra con su regla y caso (`RB-008 CP-008b ...`).
- Cada regla tiene casos positivos y negativos.

## Cómo ejecutarlos
```bash
cd backend && npm test        # unitarios + integración (requiere backend/.env con DATABASE_URL)
cd backend && npm run test:unit   # solo unitarios, sin base de datos
cd frontend && npm test
```

## Resultados de ejecución

### 08/11/2026 — dominio (T-03 a T-07)
Entorno de desarrollo de Claude. `npm test` → 34 pasando, 0 fallando.

### 10/11/2026 — backend completo (T-09 a T-17)
PC del desarrollador (Windows), base Neon, esquema `test`. Comando: `cd backend && npm test`.

Resultado: **96 pasando, 0 fallando** en 124 s. Esa ejecución incluyó 34 tests unitarios duplicados (ver "Errores" más abajo), así que los tests distintos son **62: 34 unitarios y 28 de integración**, todos aprobados.

### 10/11/2026 — frontend
PC del desarrollador. Comando: `cd frontend && npm test`. Resultado: **2 archivos, 9 tests, 9 pasando, 0 fallando**.

### 10/11/2026 — producción
| Paso | Resultado |
|---|---|
| `GET /api/health` en Render | `{"ok":true}` |
| Login con credenciales falsas desde el origen de Vercel | 401 `CREDENCIALES_INVALIDAS`, CORS correcto |
| Registro de dos cuentas | OK |
| Crear grupo y agregar al segundo usuario por email | OK |
| Gasto de $1000 en partes iguales | OK |
| Saldos: B debe $500; liquidación "B le paga a A $500" | OK |
| B registra el pago desde la liquidación; queda pendiente | OK |
| A confirma el pago; ambos quedan al día | OK |

## Cobertura de reglas
| Regla | Unitarios | Integración | Positivo | Negativo |
|---|---|---|---|---|
| RB-001 Monto válido | CP-001a, b | gasto con monto 0 y decimal | ✔ | ✔ |
| RB-002 Reparto igual | CP-002a–d | centavo sobrante | ✔ | ✔ |
| RB-003 Porcentajes | CP-003a–d | válido e inválido | ✔ | ✔ |
| RB-004 Montos exactos | CP-004a–c | no suman el total | ✔ | ✔ |
| RB-005 Miembros | CP-005a, b | pagador y participante externos | ✔ | ✔ |
| RB-006 Saldos suman cero | CP-006a, b | saldos y suma cero | ✔ | — |
| RB-007 Liquidación | CP-007a–c (300 casos aleatorios) | 2 transferencias hacia el acreedor | ✔ | — |
| RB-008 Pago válido | CP-008a–d | supera deuda, a sí mismo, de acreedor, doble pago pendiente | ✔ | ✔ |
| RB-009 Confirmación | CP-009a–d | receptor confirma, pagador no, rechazo, doble resolución | ✔ | ✔ |
| RB-010 Miembros | CP-010a–c | agregar, quitar, admin, con saldo | ✔ | ✔ |
| RB-011 Edición de gastos | CP-011a–c | creador edita, admin elimina, otro no | ✔ | ✔ |
| RB-012 Privacidad | — | 401 sin token, 403 no miembro en grupos, gastos, saldos y pagos | ✔ | ✔ |
| RB-013 Credenciales | — | registro, email repetido, contraseña corta, login | ✔ | ✔ |

Las 13 reglas están cubiertas por al menos un test aprobado.

## Errores encontrados y corregidos
1. **T-02:** `tsc` no aceptaba imports con extensión `.ts`. Se agregaron `allowImportingTsExtensions` y `noEmit`.
2. **T-12 (revisión de QA):** quitar un miembro contaba los pagos pendientes como hechos, y permitía quitar a alguien cuyo pago todavía podía ser rechazado. Ahora se usan solo pagos confirmados.
3. **T-12 (diseño):** un usuario podía registrar dos pagos pendientes por la misma deuda. Ahora los pendientes cuentan al validar un pago nuevo. Lo cubre el test "RB-008 ... doble pago pendiente".
4. **10/11:** al copiar archivos en la PC del desarrollador quedaron copias de los tests unitarios en dos carpetas y se ejecutaron dos veces. Se dejó una sola copia en `backend/test/` (commit "Arreglo") y se actualizó el script `test:unit`.
5. **Despliegue:** `DATABASE_URL` mal pegada en Render (error P1012) y CORS bloqueado por `FRONTEND_URL` desactualizada. Ambos corregidos (ver `docs/DESPLIEGUE.md`).
