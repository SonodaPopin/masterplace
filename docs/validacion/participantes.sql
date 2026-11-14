-- MasterPlace · Crear los enlaces de la validación con usuarios (plan_validacion.md, sección 3).
-- Requiere la migración 20261114000000_validacion_usuarios.sql. Ejecutar en el SQL Editor de Supabase.
--
-- P1 a P5: maestros. P6 a P10: clientes (plan_validacion.md, sección 2).
-- P90 (maestro) y P91 (cliente): enlaces del equipo para probar de punta a punta. NO se cuentan en el análisis.
-- Idempotente: si un código ya existe, conserva su enlace.

insert into public.validacion_participantes (token, codigo, perfil)
select encode(extensions.gen_random_bytes(12), 'hex'), c.codigo, c.perfil
  from (values
    ('P1', 'maestro'), ('P2', 'maestro'), ('P3', 'maestro'), ('P4', 'maestro'), ('P5', 'maestro'),
    ('P6', 'cliente'), ('P7', 'cliente'), ('P8', 'cliente'), ('P9', 'cliente'), ('P10', 'cliente'),
    ('P90', 'maestro'), ('P91', 'cliente')
  ) as c(codigo, perfil)
on conflict (codigo) do nothing;

-- Enlaces para enviar por WhatsApp (uno por persona).
select codigo,
       perfil,
       'https://masterplace.vercel.app/prueba/' || token as enlace,
       lower(codigo) || '@prueba.masterplace.cl' as correo_de_prueba
  from public.validacion_participantes
 order by length(codigo), codigo;

-- Para repetir la prueba del equipo desde cero (borra solo las respuestas de P90 y P91):
-- delete from public.validacion_respuestas
--  where token in (select token from public.validacion_participantes where codigo in ('P90', 'P91'));
