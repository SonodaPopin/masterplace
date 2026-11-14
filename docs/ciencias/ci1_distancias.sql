-- MasterPlace · CI-1 · Haversine frente a PostGIS (docs/ciencias/CI-1_distancia.md). Solo lectura.
-- Ejecutar en el SQL Editor de Supabase. Reproduce la tabla de resultados del documento.
--
-- Puntos: el punto de referencia de cada comuna del piloto, guardado en `comunas.centroide` por la semilla
-- (supabase/seed.sql, coordenadas del infobox de Wikipedia consultado el 10-11-2026). Son los mismos puntos que
-- usa la app cuando el usuario busca «desde el centro» de una comuna.
--
-- d_H        = Haversine sobre una esfera de radio 6.371 km (la misma fórmula de src/lib/geo/haversine.ts).
-- d_PostGIS  = ST_Distance(geography, geography): distancia geodésica sobre el elipsoide WGS84.
-- error      = |d_H − d_PostGIS| / d_PostGIS. Tolerancia de E1: 1 %.

-- 1. Tabla de resultados ------------------------------------------------------------------------
with pares (n, desde, hasta) as (values
  (1,  'Concepción', 'Talcahuano'),
  (2,  'Concepción', 'San Pedro de la Paz'),
  (3,  'Concepción', 'Chiguayante'),
  (4,  'Concepción', 'Penco'),
  (5,  'Concepción', 'Hualpén'),
  (6,  'Talcahuano', 'San Pedro de la Paz'),
  (7,  'Talcahuano', 'Chiguayante'),
  (8,  'Chiguayante', 'Penco'),
  (9,  'Hualpén', 'Penco'),
  (10, 'San Pedro de la Paz', 'Penco')
),
puntos as (
  select pr.n, pr.desde, pr.hasta, a.centroide as ga, b.centroide as gb,
         st_y(a.centroide::geometry) as lat1, st_x(a.centroide::geometry) as lng1,
         st_y(b.centroide::geometry) as lat2, st_x(b.centroide::geometry) as lng2
    from pares pr
    join public.comunas a on a.nombre = pr.desde
    join public.comunas b on b.nombre = pr.hasta
),
calculo as (
  select n, desde, hasta, lat1, lng1, lat2, lng2,
         2 * 6371 * asin(sqrt(
           power(sin(radians(lat2 - lat1) / 2), 2)
           + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
         )) as d_haversine_km,
         st_distance(ga, gb) / 1000.0 as d_postgis_km
    from puntos
)
select n,
       desde,
       hasta,
       round(lat1::numeric, 5) || ', ' || round(lng1::numeric, 5) as punto_desde,
       round(lat2::numeric, 5) || ', ' || round(lng2::numeric, 5) as punto_hasta,
       round(d_haversine_km::numeric, 3)                          as haversine_km,
       round(d_postgis_km::numeric, 3)                            as postgis_km,
       round((abs(d_haversine_km - d_postgis_km) / d_postgis_km * 100)::numeric, 3) as error_relativo_pct
  from calculo
 order by n;

-- 2. Tiempo de la consulta de búsqueda (insumo de RNF-2) -----------------------------------------
-- Ejecuta la misma consulta de public.buscar_maestros (gasfitería en Concepción, desde su punto de referencia) y
-- muestra el plan con el tiempo real («Execution Time» y «Planning Time»). Repetirla al menos 3 veces y anotar la
-- mediana. Corre como el usuario del SQL Editor (sin RLS), así que mide la consulta, no la red. En el SQL Editor,
-- `format json` devuelve todo en una sola fila (con el formato de texto, la fila del tiempo puede quedar oculta).
--
-- explain (analyze, format json)
-- select m.id, st_distance(m.referencia, st_setsrid(st_makepoint(-73.0513694, -36.8281944), 4326)::geography) / 1000.0 as km
--   from public.maestros m
--   join public.perfiles p on p.id = m.id
--   join public.oficios  o on o.id = m.oficio_id
--  where m.estado_identidad = 'verificada'
--    and m.oficio_id = 1
--    and exists (select 1 from public.coberturas c where c.maestro_id = m.id and c.comuna_id = 8101)
--  order by km;
