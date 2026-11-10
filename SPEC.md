# SPEC — Cuentas Claras

Aplicación web para registrar gastos compartidos en grupos y calcular quién le debe a quién, con la mínima cantidad de transferencias.

## 1. Alcance

### Alcance mínimo obligatorio (MVP)
- F-01 Registro e inicio de sesión (email + contraseña, JWT).
- F-02 Crear grupos; el creador es administrador.
- F-03 Agregar miembros por email (usuarios ya registrados).
- F-04 Registrar gastos con reparto igual, por porcentajes o por montos exactos.
- F-05 Ver saldos de cada miembro.
- F-06 Ver plan de liquidación (transferencias sugeridas).
- F-07 Registrar pagos entre miembros y confirmarlos.
- F-08 Editar y eliminar gastos con permisos.
- F-09 Quitar miembros del grupo.

### Fuera de alcance (solo si sobra tiempo)
Monedas múltiples, invitaciones por link, adjuntar comprobantes, notificaciones por email, cierre de períodos.

## 2. Convenciones
- Todo monto se expresa en **centavos enteros** (`int`). Nunca se usan decimales flotantes para dinero.
- Los porcentajes se expresan en **puntos básicos** (1 % = 100; 100 % = 10000).
- Saldo positivo: al miembro le deben. Saldo negativo: el miembro debe.

## 3. Reglas de negocio

### RB-001 Monto válido
- **Descripción:** todo gasto y todo pago tiene un monto en centavos.
- **Condiciones:** al crear o editar un gasto o un pago.
- **Comportamiento esperado:** se acepta solo un entero mayor a 0 y menor o igual a 100.000.000 (1.000.000,00).
- **Validaciones:** rechazar con error `MONTO_INVALIDO` si es 0, negativo, decimal, no numérico o supera el máximo.
- **Casos de prueba:** CP-001a acepta 1 y 100000000; CP-001b rechaza 0, -5, 10.5, NaN, 100000001.

### RB-002 Reparto en partes iguales
- **Descripción:** el total se divide entre los participantes.
- **Condiciones:** tipo de reparto `IGUAL`, al menos 1 participante.
- **Comportamiento esperado:** cada uno recibe `floor(total / n)`; los centavos sobrantes se asignan de a uno a los participantes en orden ascendente de id.
- **Validaciones:** sin participantes → `SIN_PARTICIPANTES`; participantes repetidos → `PARTICIPANTE_DUPLICADO`.
- **Casos de prueba:** CP-002a 1000 entre 3 → 334, 333, 333; CP-002b 900 entre 3 → 300 c/u; CP-002c lista vacía rechaza; CP-002d la suma siempre es igual al total.

### RB-003 Reparto por porcentajes
- **Descripción:** cada participante paga un porcentaje del total.
- **Condiciones:** tipo `PORCENTAJE`.
- **Comportamiento esperado:** cada parte es `floor(total * pb / 10000)`; los centavos sobrantes se asignan de a uno empezando por el porcentaje mayor (empate: menor id).
- **Validaciones:** los puntos básicos deben sumar exactamente 10000 → si no, `PORCENTAJES_NO_SUMAN_100`; cada porcentaje debe ser entero > 0.
- **Casos de prueba:** CP-003a 1000 con 50/50 → 500/500; CP-003b 1000 con 33,33/33,33/33,34 suma 1000; CP-003c 60/30 rechaza; CP-003d porcentaje 0 rechaza.

### RB-004 Reparto por montos exactos
- **Descripción:** se indica cuánto paga cada participante.
- **Condiciones:** tipo `EXACTO`.
- **Comportamiento esperado:** las partes son las indicadas.
- **Validaciones:** la suma debe ser igual al total → si no, `MONTOS_NO_SUMAN_TOTAL`; cada parte entera > 0.
- **Casos de prueba:** CP-004a 700+300 sobre 1000 se acepta; CP-004b 700+200 rechaza; CP-004c parte negativa rechaza.

### RB-005 Participantes deben ser miembros
- **Descripción:** quien paga y quienes participan de un gasto pertenecen al grupo.
- **Condiciones:** al crear o editar un gasto o un pago.
- **Comportamiento esperado:** se rechaza la operación si alguien no es miembro.
- **Validaciones:** error `NO_ES_MIEMBRO`.
- **Casos de prueba:** CP-005a pagador externo rechaza; CP-005b participante externo rechaza.

### RB-006 Saldos del grupo suman cero
- **Descripción:** el saldo de un miembro = lo que pagó − lo que le corresponde + pagos enviados confirmados − pagos recibidos confirmados.
- **Condiciones:** siempre.
- **Comportamiento esperado:** la suma de saldos del grupo es exactamente 0.
- **Casos de prueba:** CP-006a un gasto de 900 pagado por A entre A, B, C → A +600, B −300, C −300; CP-006b combinación de gastos y pagos suma 0.

### RB-007 Plan de liquidación mínimo
- **Descripción:** se sugieren transferencias para dejar todos los saldos en cero.
- **Comportamiento esperado:** se emparejan el mayor deudor con el mayor acreedor de forma repetida; el plan genera como máximo n − 1 transferencias, cada una con monto > 0, y al aplicarlas todos los saldos quedan en 0.
- **Casos de prueba:** CP-007a saldos en cero → plan vacío; CP-007b A +600, B −300, C −300 → 2 transferencias; CP-007c caso aleatorio: ≤ n − 1 y saldos finales 0.

### RB-008 Pago válido
- **Descripción:** un miembro registra un pago a otro.
- **Validaciones:** pagador y receptor distintos → si no, `PAGO_A_SI_MISMO`; el pagador debe tener saldo negativo y el receptor positivo; el monto no puede superar ni lo que debe el pagador ni lo que se le debe al receptor → si no, `PAGO_SUPERA_DEUDA`.
- **Casos de prueba:** CP-008a pago de 300 de B a A se acepta; CP-008b pago de 400 rechaza; CP-008c pago a sí mismo rechaza; CP-008d pago de un acreedor rechaza.

### RB-009 Confirmación de pagos
- **Descripción:** un pago nace `PENDIENTE` y solo el receptor lo puede confirmar o rechazar.
- **Comportamiento esperado:** solo los pagos `CONFIRMADO` afectan los saldos. Un pago confirmado o rechazado no cambia más de estado.
- **Validaciones:** otro usuario → `SIN_PERMISO`; pago ya resuelto → `PAGO_YA_RESUELTO`.
- **Casos de prueba:** CP-009a el receptor confirma; CP-009b el pagador no puede confirmar; CP-009c un pago pendiente no cambia saldos; CP-009d no se confirma dos veces.

### RB-010 Agregar y quitar miembros
- **Descripción:** solo el administrador agrega miembros (por email de un usuario registrado) y los quita. Errores al agregar: `USUARIO_NO_ENCONTRADO`, `YA_ES_MIEMBRO`, `SIN_PERMISO`.
- **Validaciones:** no se quita a quien tiene saldo ≠ 0 → `SALDO_PENDIENTE`; no se quita al administrador → `ES_ADMIN`; solo el admin → `SIN_PERMISO`.
- **Casos de prueba:** CP-010a miembro con saldo 0 se quita; CP-010b con saldo rechaza; CP-010c no admin rechaza.

### RB-011 Edición de gastos
- **Descripción:** solo el creador del gasto o el admin del grupo lo editan o eliminan.
- **Validaciones:** otro usuario → `SIN_PERMISO`.
- **Casos de prueba:** CP-011a creador edita; CP-011b admin elimina; CP-011c otro miembro rechaza.

### RB-012 Privacidad del grupo
- **Descripción:** solo los miembros pueden ver el grupo, sus gastos, saldos y pagos.
- **Validaciones:** no miembro → HTTP 403 `NO_ES_MIEMBRO`; sin sesión → HTTP 401.
- **Casos de prueba:** CP-012a miembro accede; CP-012b no miembro recibe 403; CP-012c sin token recibe 401.

### RB-013 Credenciales
- **Descripción:** registro con email único y contraseña de 8 caracteres o más; las contraseñas se guardan con hash bcrypt.
- **Validaciones:** `EMAIL_EN_USO`, `CONTRASENA_CORTA`, `CREDENCIALES_INVALIDAS`.
- **Casos de prueba:** CP-013a registro válido; CP-013b email repetido rechaza; CP-013c contraseña corta rechaza; CP-013d login incorrecto rechaza.

## 4. Pantallas
Login, Registro, Mis grupos, Detalle del grupo (pestañas Gastos / Saldos / Liquidación / Pagos / Miembros), Formulario de gasto, Formulario de pago.
