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
