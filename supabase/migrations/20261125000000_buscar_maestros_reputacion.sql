-- 1. Estadísticas agregadas de reseñas respetando RLS vía SECURITY DEFINER
create or replace function public.estadisticas_resenas()
returns table (
  maestro_id uuid,
  cantidad   integer,
  promedio   double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.maestro_id,
    count(*)::integer                  as cantidad,
    avg(r.calificacion)::double precision as promedio
  from public.resenas r
  join public.contactos c on c.id = r.contacto_id
  where not r.oculta
  group by c.maestro_id;
$$;

revoke all on function public.estadisticas_resenas() from public;
grant execute on function public.estadisticas_resenas() to anon, authenticated;

-- 2. Eliminar firma anterior de 4 parámetros para evitar ambigüedad
drop function if exists public.buscar_maestros(integer, integer, double precision, double precision);

-- 3. Nueva función con p_orden y métricas de reseñas / Laplace
create function public.buscar_maestros(
  p_oficio_id integer,
  p_comuna_id integer,
  p_lat       double precision,
  p_lng       double precision,
  p_orden     text default 'distancia'
)
returns table (
  id                 uuid,
  nombre             text,
  oficio             text,
  descripcion        text,
  anios_experiencia  smallint,
  disponible         boolean,
  certificado_ok     boolean,
  nivel_reputacion   boolean,
  lat                double precision,
  lng                double precision,
  distancia_km       double precision,
  cantidad_resenas   integer,
  promedio_resenas   double precision,
  puntaje_laplace    double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with punto as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  )
  select
    m.id,
    p.nombre,
    o.nombre                                                          as oficio,
    m.descripcion,
    m.anios_experiencia,
    m.disponible,
    m.certificado_ok,
    m.nivel_reputacion,
    st_y(m.referencia::geometry)                                      as lat,
    st_x(m.referencia::geometry)                                      as lng,
    st_distance(m.referencia, punto.g) / 1000.0                       as distancia_km,
    coalesce(e.cantidad, 0)::integer                                  as cantidad_resenas,
    e.promedio                                                        as promedio_resenas,
    (e.cantidad * e.promedio + 15.0) / (e.cantidad + 5.0)             as puntaje_laplace
  from public.maestros m
  join public.perfiles p on p.id = m.id
  join public.oficios  o on o.id = m.oficio_id
  left join public.estadisticas_resenas() e on e.maestro_id = m.id
  cross join punto
  where m.estado_identidad = 'verificada'
    and m.identidad_vence_en > now()
    and (p_oficio_id is null or m.oficio_id = p_oficio_id)
    and exists (
      select 1
      from public.coberturas c
      where c.maestro_id = m.id
        and c.comuna_id = p_comuna_id
    )
  order by
    case when p_orden = 'reputacion' then (e.cantidad is null) end,
    case when p_orden = 'reputacion' then (e.cantidad * e.promedio + 15.0) / (e.cantidad + 5.0) end desc,
    distancia_km asc,
    m.id;
$$;

revoke all on function public.buscar_maestros(integer, integer, double precision, double precision, text) from public;
grant execute on function public.buscar_maestros(integer, integer, double precision, double precision, text)
  to anon, authenticated;