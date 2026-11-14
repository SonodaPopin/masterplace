-- MasterPlace · Crear los enlaces de la validación con usuarios (plan_validacion.md, sección 3).
-- Requiere la migración 20261114000000_validacion_usuarios.sql. Ejecutar en el SQL Editor de Supabase.
--
-- P1 a P5: maestros. P6 a P10: clientes (plan_validacion.md, sección 2).
-- P90 a P97: enlaces del equipo para probar de punta a punta (uno por integrante: cada enlace guarda su avance y
-- usa su propio correo de prueba, así que no se comparte). P90 y P92–P94 maestro; P91 y P95–P97 cliente.
-- NO se cuentan en el análisis (resultados.sql excluye desde P90).
-- Idempotente: si un código ya existe, conserva su enlace.

insert into public.validacion_participantes (token, codigo, perfil)
select encode(extensions.gen_random_bytes(12), 'hex'), c.codigo, c.perfil
  from (values
    ('P1', 'maestro'), ('P2', 'maestro'), ('P3', 'maestro'), ('P4', 'maestro'), ('P5', 'maestro'),
    ('P6', 'cliente'), ('P7', 'cliente'), ('P8', 'cliente'), ('P9', 'cliente'), ('P10', 'cliente'),
    ('P90', 'maestro'), ('P91', 'cliente'),
    ('P92', 'maestro'), ('P93', 'maestro'), ('P94', 'maestro'),
    ('P95', 'cliente'), ('P96', 'cliente'), ('P97', 'cliente')
  ) as c(codigo, perfil)
on conflict (codigo) do nothing;

-- Enlaces para enviar por WhatsApp (uno por persona).
select codigo,
       perfil,
       'https://masterplace.vercel.app/prueba/' || token as enlace,
       lower(codigo) || '@prueba.masterplace.cl' as correo_de_prueba
  from public.validacion_participantes
 order by length(codigo), codigo;

-- Limpieza después de que el equipo pruebe (antes de enviar los enlaces reales):
-- 1. Respuestas de los enlaces del equipo (P90 en adelante):
-- delete from public.validacion_respuestas
--  where token in (select token from public.validacion_participantes where substring(codigo from 2)::int >= 90);
-- 2. Cuentas que el equipo creó con sus correos de prueba (borra en cascada perfil, maestro, cédula y contactos):
-- delete from auth.users where email ~ '^p9[0-9]@prueba\.masterplace\.cl$';
--    Ojo: si un maestro subió su cédula, el archivo queda en el bucket «cedulas»; bórrelo desde Storage.
