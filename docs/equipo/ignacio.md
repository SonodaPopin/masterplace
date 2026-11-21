# Ignacio Barría · Datos y seguridad

> Antes de empezar, lee [`COMO_TRABAJAMOS.md`](COMO_TRABAJAMOS.md) (contratos, migraciones aditivas y de cambio,
> flujo de PR). El porqué de cada decisión está en [`PLAN_FINAL.md`](../PLAN_FINAL.md) §3.2.

**Objetivo:** la solicitud de servicio funciona en la base de datos y las reglas las aplica la base, no la pantalla.
Hoy, al pulsar «Contactar», el contacto nace como «Servicio confirmado» y se puede reseñar sin haber escrito un
mensaje (`20261114180000_rf5_confirmacion_temporal.sql`). Eso se reemplaza por:

1. El cliente crea una solicitud (qué necesita y fecha acordada).
2. El maestro la acepta o la rechaza; el cliente puede cancelarla antes de la fecha.
3. Desde 2 horas después de la fecha acordada, el cliente **o** el maestro la marca como realizada.
4. Solo entonces el cliente puede dejar **una** reseña por solicitud, hasta 30 días después.

**Revisa tus PR:** Pedro. **Tu PR lo usan:** Gabriel (pantallas) y Hugo (pruebas).

## Tareas

### 1. Contrato de la solicitud de servicio · **domingo 22** · migración aditiva

Rama `ignacio/solicitudes-contrato`. Un solo PR con dos archivos.

**a) Migración `supabase/migrations/20261122000000_solicitudes_servicio.sql`:**

- Tipo `estado_solicitud` = `pendiente`, `aceptada`, `rechazada`, `cancelada`, `realizada`.
- Tabla `solicitudes_servicio`: `id uuid`, `contacto_id` (FK a `contactos`), `cliente_id`, `maestro_id` (copiados del
  contacto), `descripcion text` (1 a 500 caracteres), `fecha_acordada timestamptz`, `estado` (por defecto
  `pendiente`), `motivo_rechazo text` (≤ 300), `creada_en`, `respondida_en`, `realizada_en`, `realizada_por`.
- RLS activado. `select` solo para el cliente y el maestro de la solicitud, y para el admin. **Sin** `insert`,
  `update` ni `delete` directos: todo pasa por las funciones.
- Funciones `security definer`, `set search_path = ''`, con `grant execute ... to authenticated`:

| Función | Quién | Reglas | Error si no cumple |
|---|---|---|---|
| `crear_solicitud(p_contacto_id uuid, p_descripcion text, p_fecha_acordada timestamptz) returns uuid` | Cliente del contacto | Contacto no cerrado; fecha entre `now() - 7 días` y `now() + 60 días` | `SOLO_CLIENTE`, `CONTACTO_CERRADO`, `FECHA_INVALIDA`, `DESCRIPCION_INVALIDA` |
| `responder_solicitud(p_id uuid, p_aceptar boolean, p_motivo text default null) returns void` | Maestro | Solo si está `pendiente` | `SOLO_MAESTRO`, `ESTADO_INVALIDO` |
| `cancelar_solicitud(p_id uuid) returns void` | Cliente | Solo `pendiente` o `aceptada`, y antes de la fecha acordada | `SOLO_CLIENTE`, `ESTADO_INVALIDO`, `FUERA_DE_PLAZO` |
| `marcar_realizada(p_id uuid) returns void` | Cliente o maestro | Solo `aceptada` y `now() >= fecha_acordada + interval '2 hours'` | `NO_PARTICIPANTE`, `ESTADO_INVALIDO`, `AUN_NO` |

  La fecha puede estar hasta 7 días en el pasado: el cliente puede registrar un trabajo que ya acordó, y así se puede
  probar el flujo completo sin esperar dos horas (se crea con fecha de hace 3 horas).
- Cada cambio de estado se anota en `auditoria` (`accion` = `solicitud_creada`, `solicitud_aceptada`, etc.; `objeto` =
  id de la solicitud; sin el texto de la descripción).
- Columna nueva `resenas.solicitud_id uuid unique references solicitudes_servicio` (acepta `null` para las reseñas
  antiguas) y `grant insert (solicitud_id)` en `resenas`. Todavía no se exige: eso va en la tarea 2.
- Agregar `solicitudes_servicio` a la publicación de Realtime, para que la tarjeta del chat se actualice sola (mira
  cómo se hizo en `20261113173000_habilitar_realtime_mensajes.sql`).

**b) Servicio `src/features/solicitudes/servicioSolicitudes.ts`** con los tipos y funciones exactos de
`COMO_TRABAJAMOS.md` §1 (`crearSolicitud`, `listarSolicitudes`, `responderSolicitud`, `cancelarSolicitud`,
`marcarRealizada`) más `traducirErrorSolicitud(mensaje): string`, que pasa cada código de error a un texto para el
usuario (copia la idea de `traducirErrorContacto` en `src/features/contacto/servicioContactos.ts`).

- `listarSolicitudes` lee la tabla (las políticas filtran) y calcula `puedeMarcarRealizada` (estado `aceptada` y han
  pasado 2 h) y `puedeResenar` (estado `realizada`, quien mira es el cliente, sin reseña y dentro de 30 días).
- Pon la regla de las 2 h y los 30 días como funciones puras en `src/lib/solicitudes/reglas.ts`, con pruebas en
  `reglas.test.ts` (justo antes y justo después del límite). Así la pantalla y la base usan las mismas cifras.

**Terminado cuando:** la migración aplica en una base local desde cero (`npx supabase@latest db reset`), las pruebas
pasan, el PR está fusionado y le avisaste a Joaquín en el issue que la aplique en producción.
Commit: `db(solicitudes): tabla, funciones y servicio [aditiva]`.

### 2. Reglas que cambian el comportamiento · **martes 24** · migración de cambio (se aplica el viernes 27)

Rama `ignacio/solicitudes-reglas`. Migración `20261124000000_resena_exige_solicitud.sql`:

- `contactos.estado` vuelve a tener por defecto `abierto`, y `crear_o_reutilizar_contacto` crea contactos `abierto`.
  **No** cambies los contactos que ya existen.
- La reseña nueva exige `solicitud_id` de una solicitud `realizada`, cuyo cliente es quien reseña, con
  `realizada_en >= now() - interval '30 days'`. Reemplaza el trigger actual que exige «servicio confirmado» (RB-2) y
  la política `resenas_insert_cliente` (`20261110000000_politicas_rls.sql`, sección 9).
- Una reseña por solicitud: quitar el `unique` de `resenas.contacto_id`, así un cliente que vuelve a contratar al
  mismo maestro puede reseñar cada trabajo. Las reseñas antiguas (sin solicitud) se conservan.
- Los mensajes se siguen permitiendo en contactos `abierto` y `servicio_confirmado`.

**Terminado cuando:** en la base local, sin solicitud realizada la reseña se rechaza; con solicitud realizada se acepta
una vez y la segunda se rechaza; los contactos antiguos y sus reseñas siguen visibles. Avísale a Hugo en el issue para
que lo incluya en las pruebas de abuso. Commit: `db(resenas): exigir solicitud realizada [de cambio]`.

### 3. Pruebas de las reglas en la base · **miércoles 25**

Script SQL en `supabase/snippets/pruebas_solicitudes.sql`, al estilo de `Untitled query 650.sql` (termina con una
excepción que deshace todo y muestra `FALLO` si algo no se cumple). Casos mínimos:

- Un tercero no ve ni modifica una solicitud ajena.
- El maestro no puede crear solicitudes y el cliente no puede aceptarlas.
- No se puede marcar realizada antes de las 2 h ni si no fue aceptada.
- No se puede cancelar después de la fecha.
- Reseña: sin solicitud, con solicitud ajena, dos veces, después de 30 días → todo rechazado.

Registra el resultado en `docs/pruebas/registro_pruebas.md`. Commit: `test(solicitudes): reglas en la base`.

### 4. Riesgos y replanificación · **viernes 27**

Actualiza `docs/gestion/riesgos.md` (riesgos materializados desde E3 y su acción) y `docs/gestion/replanificacion.md`
(fechas reales, qué entró y qué se recortó). Commit: `docs(riesgos): estado al congelamiento`.

## Informe y defensa

- **Informe (borrador el domingo 29 a las 18:00):** capítulo 3, la parte de arquitectura final y modelo de datos
  (diagrama con la tabla nueva), y la seguridad del capítulo 4 (RLS, funciones `security definer`, borrado de la
  cédula). Envíale el texto a Diego.
- **Defensa:** construcción del sistema y la demo junto con Joaquín, como en E3, más la seguridad.

## Si te bloqueas

- Aplicar en producción, acceso al panel → Joaquín.
- Cómo se verá en pantalla → Gabriel, en el issue.
- Cualquier otra duda → escríbela en tu issue (ver `COMO_TRABAJAMOS.md` §5).
