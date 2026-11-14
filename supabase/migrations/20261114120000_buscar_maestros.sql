-- MasterPlace · RF-3 Búsqueda de maestros con PostGIS (CI-1). Autor: Pedro. Corrección: Gabriel (14-11).
--
-- Devuelve los maestros verificados que cubren la comuna, opcionalmente de un oficio, ordenados por la distancia
-- geodésica (ST_Distance sobre geography, elipsoide WGS84) entre su punto de referencia y el punto de búsqueda.
-- Las columnas son las que espera src/lib/busqueda/buscarMaestros.ts (FilaFuncion); si cambian, hay que ajustar
-- desdeFuncion() ahí. Con la función aplicada, la app deja de calcular la distancia en el navegador (respaldo con
-- Haversine) y usa esta.
--
-- Seguridad: SECURITY INVOKER, así que aplica RLS igual que la consulta de respaldo. Un visitante solo ve maestros
-- verificados (maestros_select_publico), el nombre de su perfil (perfiles_select_maestro_publico) y su cobertura.
-- No devuelve teléfono, RUT ni documentos.
--
-- Mismo criterio que la consulta de respaldo: no filtra por `disponible` (la interfaz lo filtra con «Solo
-- disponibles»), y p_oficio_id = null significa «todos los oficios».
--
-- ⚠️ No aplicar en producción durante la ventana de la validación con usuarios (hasta el domingo 15 a las 20:00):
-- cambia cómo se calcula el orden de la búsqueda que ven los participantes en T3.

create or replace function public.buscar_maestros(
  p_oficio_id integer,
  p_comuna_id integer,
  p_lat double precision,
  p_lng double precision
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
  distancia_km       double precision
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
    o.nombre                                as oficio,
    m.descripcion,
    m.anios_experiencia,
    m.disponible,
    m.certificado_ok,
    m.nivel_reputacion,
    st_y(m.referencia::geometry)            as lat,
    st_x(m.referencia::geometry)            as lng,
    st_distance(m.referencia, punto.g) / 1000.0 as distancia_km
  from public.maestros m
  join public.perfiles p on p.id = m.id
  join public.oficios  o on o.id = m.oficio_id
  cross join punto
  where m.estado_identidad = 'verificada'
    and (p_oficio_id is null or m.oficio_id = p_oficio_id)
    and exists (
      select 1 from public.coberturas c
       where c.maestro_id = m.id and c.comuna_id = p_comuna_id
    )
  order by distancia_km asc, m.id;
$$;

revoke all on function public.buscar_maestros(integer, integer, double precision, double precision) from public;
grant execute on function public.buscar_maestros(integer, integer, double precision, double precision)
  to anon, authenticated;

comment on function public.buscar_maestros(integer, integer, double precision, double precision) is
  'RF-3/CI-1: maestros verificados que cubren la comuna (y el oficio si se indica), ordenados por ST_Distance sobre '
  'geography (WGS84). SECURITY INVOKER: respeta RLS.';
