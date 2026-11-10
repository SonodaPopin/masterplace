-- MasterPlace · Función es_admin()
-- Debe ejecutarse ANTES de 20261110000000_politicas_rls.sql, porque las políticas
-- la usan. Si el esquema inicial tiene un timestamp posterior a este, renombrar
-- este archivo para que quede entre el esquema y las políticas.

-- security definer: lee perfiles saltándose RLS. Sin esto, usarla dentro de una
-- política de `perfiles` provocaría recursión infinita.
-- (select auth.uid()) permite a Postgres evaluarla una vez por consulta.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.perfiles p
     where p.id = (select auth.uid())
       and p.rol = 'admin'
  );
$$;

-- Solo usuarios con sesión; anon no necesita saber si es admin.
revoke execute on function public.es_admin() from public, anon;
grant  execute on function public.es_admin() to authenticated;

comment on function public.es_admin() is
  'true si el usuario autenticado tiene rol admin en perfiles. Para usar en políticas RLS.';