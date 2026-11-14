-- MasterPlace · Resultados de la validación con usuarios (plan_validacion.md, secciones 6 y 8). Responsable: Hugo.
-- Solo lectura. Ejecutar en el SQL Editor de Supabase después del cierre (domingo 15 a las 20:00).
-- Excluye los enlaces del equipo (P90 en adelante).
--
-- Columnas:
--   *_logro      lo que el participante dijo («¿Pudo hacerlo?»)
--   *_seg        tiempo medido entre «Comenzar» y «Terminé» (segundos)
--   *_base       si la tarea quedó hecha en la base (vale lo que dice la base, sección 6)
--   sus          puntaje SUS de 0 a 100

with p as (
  select v.token, v.codigo, v.perfil, v.usuario_id,
         coalesce(v.usuario_id, (select u.id from auth.users u where u.email = lower(v.codigo) || '@prueba.masterplace.cl')) as cuenta
    from public.validacion_participantes v
   where substring(v.codigo from 2)::int < 90
),
r as (
  select token, jsonb_object_agg(clave, valor) as x
    from public.validacion_respuestas
   group by token
),
seg as (
  select p.token, t.id,
         extract(epoch from ((r.x ->> (t.id || '_fin'))::timestamptz - (r.x ->> (t.id || '_inicio'))::timestamptz))::int as s
    from p
    join r on r.token = p.token
    cross join (values ('t1'), ('t2'), ('t3'), ('t4')) as t(id)
   where r.x ? (t.id || '_inicio') and r.x ? (t.id || '_fin')
)
select
  p.codigo,
  p.perfil,
  r.x -> 'consentimiento' ->> 'acepta'                                         as acepta,
  r.x -> 'datos' ->> 'comuna'                                                  as comuna,
  r.x -> 'datos' ->> 'aparato'                                                 as aparato,
  r.x -> 'datos' ->> 'uso_2x3'                                                 as uso_2x3,
  -- T1 · Registro de maestro
  r.x -> 't1' ->> 'logro'                                                      as t1_logro,
  (select s from seg where seg.token = p.token and seg.id = 't1')              as t1_seg,
  case when p.perfil = 'maestro' then
    exists (select 1 from public.maestros m
             where m.id = p.cuenta and m.estado_identidad = 'pendiente' and m.oficio_id is not null
               and exists (select 1 from public.coberturas cb where cb.maestro_id = m.id)
               and exists (select 1 from public.documentos d where d.maestro_id = m.id and d.tipo = 'cedula'))
  end                                                                          as t1_base,
  -- T2 · Cuenta de cliente
  r.x -> 't2' ->> 'logro'                                                      as t2_logro,
  (select s from seg where seg.token = p.token and seg.id = 't2')              as t2_seg,
  case when p.perfil = 'cliente' then
    exists (select 1 from public.perfiles pf where pf.id = p.cuenta and pf.rol = 'cliente')
  end                                                                          as t2_base,
  -- T3 · Búsqueda
  r.x -> 't3' ->> 'logro'                                                      as t3_logro,
  (select s from seg where seg.token = p.token and seg.id = 't3')              as t3_seg,
  r.x -> 't3' ->> 'respuesta'                                                  as t3_eleccion,
  -- T4 · Contacto
  r.x -> 't4' ->> 'logro'                                                      as t4_logro,
  (select s from seg where seg.token = p.token and seg.id = 't4')              as t4_seg,
  case when p.perfil = 'cliente' then
    exists (select 1 from public.contactos c join public.mensajes m on m.contacto_id = c.id
             where c.cliente_id = p.cuenta and m.emisor_id = p.cuenta)
  end                                                                          as t4_base,
  -- T5, SUS y preguntas finales
  r.x -> 't5' ->> 'texto'                                                      as t5_senales,
  (r.x -> 'sus' ->> 'puntaje')::numeric                                        as sus,
  r.x -> 'finales' -> 'orden'                                                  as a2_orden,
  r.x -> 'a1' ->> 'texto'                                                      as a1,
  r.x -> 'finales' ->> 'a3'                                                    as a3,
  r.x -> 'finales' ->> 'a4'                                                    as a4,
  -- comentarios de cada tarea («¿Dónde se confundió?»)
  concat_ws(' | ', r.x -> 't1' ->> 'comentario', r.x -> 't2' ->> 'comentario',
                   r.x -> 't3' ->> 'comentario', r.x -> 't4' ->> 'comentario') as comentarios,
  r.x ? 'fin'                                                                  as termino
from p
left join r on r.token = p.token
order by length(p.codigo), p.codigo;

-- Resumen para la diapositiva: participantes que terminaron, SUS promedio, mínimo y máximo.
-- select count(*) filter (where r.x ? 'fin') as terminaron,
--        round(avg((r.x -> 'sus' ->> 'puntaje')::numeric), 1) as sus_promedio,
--        min((r.x -> 'sus' ->> 'puntaje')::numeric) as sus_min,
--        max((r.x -> 'sus' ->> 'puntaje')::numeric) as sus_max
--   from public.validacion_participantes v
--   join (select token, jsonb_object_agg(clave, valor) x from public.validacion_respuestas group by token) r using (token)
--  where substring(v.codigo from 2)::int < 90;
