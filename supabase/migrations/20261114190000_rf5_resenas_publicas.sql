-- RF-5: Consulta pública de reseñas de maestros.
-- No expone identificadores de clientes ni contactos.

create or replace function public.obtener_resenas_maestro(
  p_maestro_id uuid
)
returns table (
  calificacion smallint,
  comentario text,
  creada_en timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.calificacion,
    r.comentario,
    r.creada_en
  from public.resenas r
  join public.contactos c
    on c.id = r.contacto_id
  join public.maestros m
    on m.id = c.maestro_id
  where m.id = p_maestro_id
    and m.estado_identidad = 'verificada'::public.estado_identidad
  order by r.creada_en desc;
$$;

revoke all on function public.obtener_resenas_maestro(uuid)
  from public;

grant execute on function public.obtener_resenas_maestro(uuid)
  to anon, authenticated;

-- CI-2: Estadísticas para calcular el promedio bayesiano.
-- Solo considera reseñas de maestros verificados
-- asociadas a servicios confirmados.

create or replace function public.obtener_estadisticas_reputacion(
  p_maestro_id uuid
)
returns table (
  cantidad_resenas bigint,
  promedio_maestro double precision,
  promedio_global double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  with resenas_validas as (
    select
      c.maestro_id,
      r.calificacion::double precision as calificacion
    from public.resenas r
    join public.contactos c
      on c.id = r.contacto_id
    join public.maestros m
      on m.id = c.maestro_id
    where m.estado_identidad = 'verificada'::public.estado_identidad
  )
      select
    count(*) filter (
      where maestro_id = p_maestro_id
    ) as cantidad_resenas,
    avg(calificacion) filter (
      where maestro_id = p_maestro_id
    ) as promedio_maestro,
    avg(calificacion) as promedio_global
  from resenas_validas
  where exists (
    select 1
    from public.maestros m
    where m.id = p_maestro_id
      and m.estado_identidad = 'verificada'::public.estado_identidad
  );
$$;

revoke all on function public.obtener_estadisticas_reputacion(uuid)
  from public;

grant execute on function public.obtener_estadisticas_reputacion(uuid)
  to anon, authenticated;
