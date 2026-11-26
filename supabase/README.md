# Base de datos (Supabase)

Responsables: Ignacio (esquema, políticas, semilla) y Joaquín (proyecto y entornos).

## Archivos

- `migrations/AAAAMMDDHHMMSS_descripcion.sql`: cada cambio es una migración nueva. No editar una migración ya aplicada.
- `seed.sql`: datos ficticios de desarrollo.

## Aplicar los cambios

Opción A, en el panel de Supabase: SQL Editor → pegar cada migración en orden → ejecutar. Después, `seed.sql`.

Opción B, con la CLI de Supabase:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref <ref-del-proyecto>
npx supabase@latest db push
```

## Reglas

- RLS activado en todas las tablas. Una tabla sin política no se puede leer ni escribir desde el frontend.
- La clave `service_role` nunca va al frontend ni al repositorio.
- Buckets `cedulas` y `certificados` privados; se accede solo con URL firmada de corta duración.

## Migraciones aplicadas en producción

Agrega una fila cada vez que apliques una migración en producción. Las aditivas se aplican el mismo día que se fusionan en `premain`; las de cambio, solo el viernes de congelamiento.

| Archivo | Fusión en premain | Quién la aplicó | Comprobación hecha |
|---|---|---|---|
| `20261109000000_esquema_inicial.sql` | 2026-11-08 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261109235900_funcion_es_admin.sql` | 2026-11-10 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261110000000_politicas_rls.sql` | 2026-11-11 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261110120000_perfil_al_registrarse.sql` | 2026-11-10 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261112000000_borrar_cedula_al_aprobar.sql` | 2026-11-13 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261112090000_contactos_chat.sql` | 2026-11-12 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261113120000_revisar_identidad.sql` | 2026-11-13 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261113173000_habilitar_realtime_mensajes.sql` | 2026-11-13 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261113180000_bandeja_contactos.sql` | 2026-11-13 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261114000000_validacion_usuarios.sql` | 2026-11-13 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261114120000_buscar_maestros.sql` | 2026-11-14 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261114180000_rf5_confirmacion_temporal.sql` | 2026-11-15 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261114190000_rf5_resenas_publicas.sql` | 2026-11-15 | (por confirmar) | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261122000000_solicitudes_servicio.sql` | 2026-11-24 | Joaquín | Aparece en `schema_migrations`; existen la tabla con RLS, las 5 funciones, `resenas.solicitud_id` y la publicación Realtime; `anon` no puede ejecutar `crear_solicitud` |
| `20261123000000_denuncias.sql` | 2026-11-22 | Joaquín | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261123010000_rut.sql` | 2026-11-23 | Joaquín | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |
| `20261123020000_vigencia_identidad.sql` | 2026-11-23 | Joaquín | Aparece en `supabase_migrations.schema_migrations` (revisado el 2026-11-26) |

La fecha registrada es la de fusión en `premain`, porque producción no guarda la fecha de aplicación.

## Migración: validación de RUT

Archivo: `migrations/20261123010000_rut.sql`

Esta migración incorpora la validación del RUT chileno de los maestros.

### Cambios realizados

- Se crea `public.rut_valido(text)`, que valida el RUT mediante el algoritmo módulo 11.
- El formato aceptado es sin puntos, con guion y dígito verificador en mayúscula.
- Se incorpora la restricción CHECK `maestros_privado_rut_valido_check`.
- Se conserva la restricción UNIQUE existente sobre `maestros_privado.rut`.
- Los RUT duplicados continúan generando el error PostgreSQL `23505`.


### Vigencia de identidad (90 días)

Archivo: `migrations/20261123020000_vigencia_identidad.sql`

Esta migración incorpora la vigencia de 90 días para la verificación de identidad de los maestros.

**Cambios realizados**

- Se agrega `maestros.identidad_vence_en` para almacenar la fecha de vencimiento.
- Cada aprobación de cédula concede 90 días de vigencia.
- Los maestros que ya estaban verificados reciben 90 días desde la aplicación de la migración.
- Al rechazar una cédula, se elimina la fecha de vencimiento.
- Los maestros con identidad vencida dejan de aparecer en las búsquedas y perfiles públicos.
- Al subir una nueva cédula, un maestro con identidad vencida o rechazada vuelve al estado `pendiente`.
- Se actualiza la función de creación de contactos para impedir nuevos contactos con maestros cuya identidad venció.
- Se conserva el acceso de los maestros a sus propios registros y el acceso administrativo.

**Pruebas locales**

- Migración aplicada correctamente en Supabase local.
- 15 maestros verificados recibieron una fecha de vencimiento.
- Se comprobó la renovación de identidades vencidas y rechazadas.
- Se comprobó la asignación de 90 días al aprobar y la eliminación del vencimiento al rechazar.
- Se revisaron las políticas RLS de maestros, perfiles y contactos.
- Las pruebas funcionales realizadas utilizaron cambios reversibles.
- La autorización administrativa de `revisar_identidad()` queda pendiente de una prueba con un usuario administrador local.

**Estado de aplicación**

- Desarrollo local: aplicada y probada.
- Producción: aplicada (ver «Migraciones aplicadas en producción»).


### Pruebas

- Función `rut_valido(text)` probada en Supabase local.
- Casos válidos e inválidos de módulo 11 comprobados.
- Restricción CHECK probada.
- Restricción UNIQUE probada.
- Datos existentes de producción revisados previamente a la aplicación del CHECK.

### Estado de aplicación

- Desarrollo local: aplicada y probada.
- Producción: aplicada (ver «Migraciones aplicadas en producción»).
