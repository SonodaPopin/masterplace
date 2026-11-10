-- MasterPlace · Crear el perfil al registrarse (RF-10, RF-1)
-- Autor: Gabriel. Revisa: Ignacio (datos y seguridad) antes de aplicarla.
--
-- Por qué un trigger: con "Confirm email" activo, signUp() no devuelve sesión, así que el navegador
-- no puede insertar en `perfiles` (además, RLS lo impide). El frontend manda nombre, rol, teléfono y
-- comuna como metadatos del usuario y este trigger crea la fila en el mismo momento que auth.users.
--
-- Seguridad:
--  * Nunca se acepta el rol «admin» desde los metadatos: cualquier valor distinto de «maestro» queda
--    como «cliente». Los admin se asignan a mano (Ignacio), registrándolo en auditoría.
--  * La comuna solo se guarda si existe en `comunas`; si la semilla aún no está cargada, queda null en
--    vez de hacer fallar el registro completo.
--  * El nombre se recorta a 80 caracteres y, si falta, se usa la parte local del correo, para respetar
--    el check de 2 a 80 caracteres sin bloquear el alta.

create or replace function public.crear_perfil_al_registrarse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta     jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_rol      public.rol_usuario;
  v_nombre   text;
  v_comuna   smallint;
  v_telefono text;
begin
  v_rol := case when v_meta ->> 'rol' = 'maestro' then 'maestro' else 'cliente' end;

  v_nombre := left(btrim(coalesce(v_meta ->> 'nombre', '')), 80);
  if char_length(v_nombre) < 2 then
    v_nombre := left(split_part(coalesce(new.email, 'usuario'), '@', 1), 80);
  end if;
  if char_length(v_nombre) < 2 then
    v_nombre := 'Usuario';
  end if;

  if (v_meta ->> 'comuna_id') ~ '^\d{1,5}$' then
    select c.id into v_comuna from public.comunas c where c.id = (v_meta ->> 'comuna_id')::smallint;
  end if;

  v_telefono := nullif(btrim(coalesce(v_meta ->> 'telefono', '')), '');

  insert into public.perfiles (id, rol, nombre, telefono, comuna_id)
  values (new.id, v_rol, v_nombre, v_telefono, v_comuna)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Solo la ejecuta el trigger, no los usuarios de la app.
revoke execute on function public.crear_perfil_al_registrarse() from public, anon, authenticated;

create trigger al_crear_usuario_crear_perfil
  after insert on auth.users
  for each row
  execute function public.crear_perfil_al_registrarse();

comment on function public.crear_perfil_al_registrarse() is
  'RF-10/RF-1: crea la fila de perfiles desde los metadatos del registro. Nunca asigna rol admin.';

-- Pendiente (Ignacio, en 20261110000000_politicas_rls.sql): política para que cada usuario lea y
-- actualice solo su propio perfil (id = auth.uid()), y lectura pública de `comunas` y `oficios`.
