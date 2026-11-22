-- MasterPlace · RF-12 (denunciar reseñas) y RF-8 (moderación de denuncias). Responsable: Diego.
-- Migración ADITIVA: agrega tipos, la tabla `denuncias`, la columna `resenas.oculta` (default false) y funciones.
-- Mientras nadie acepte una denuncia, ninguna reseña se oculta y la app publicada se comporta igual que antes.
--
-- Igual que `revisar_identidad` (20261113120000): la app no escribe directo en `denuncias`, `resenas.oculta` ni
-- `auditoria`; todo pasa por funciones security definer que validan quién llama.

-- 1. Tipos ------------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'motivo_denuncia') then
    create type public.motivo_denuncia as enum ('ofensiva', 'falsa', 'datos_personales', 'otro');
  end if;
  if not exists (select 1 from pg_type where typname = 'estado_denuncia') then
    create type public.estado_denuncia as enum ('pendiente', 'aceptada', 'descartada');
  end if;
end;
$$;

-- 2. Reseñas ocultas --------------------------------------------------------------------
-- La app no puede cambiarla: `resenas` solo concede insert en (contacto_id, calificacion, comentario).

alter table public.resenas
  add column if not exists oculta boolean not null default false;

-- 3. Tabla de denuncias -----------------------------------------------------------------

create table if not exists public.denuncias (
  id              uuid primary key default gen_random_uuid(),
  resena_id       uuid not null references public.resenas (id) on delete cascade,
  denunciante_id  uuid not null references public.perfiles (id) on delete cascade,
  motivo          public.motivo_denuncia not null,
  detalle         text check (char_length(detalle) <= 500),
  estado          public.estado_denuncia not null default 'pendiente',
  creada_en       timestamptz not null default now(),
  revisor_id      uuid references public.perfiles (id),
  revisada_en     timestamptz,
  unique (resena_id, denunciante_id)
);

create index if not exists denuncias_pendientes_idx
  on public.denuncias (creada_en)
  where estado = 'pendiente';

-- 4. RLS: el denunciante ve las suyas, el admin ve todas; nadie escribe directo -----------

alter table public.denuncias enable row level security;

revoke insert, update, delete on public.denuncias from anon, authenticated;
revoke select on public.denuncias from anon;

drop policy if exists denuncias_select_propias on public.denuncias;
create policy denuncias_select_propias on public.denuncias
  for select to authenticated
  using (denunciante_id = (select auth.uid()));

drop policy if exists denuncias_select_admin on public.denuncias;
create policy denuncias_select_admin on public.denuncias
  for select to authenticated
  using (public.es_admin());

-- 5. Denunciar una reseña (solo el maestro reseñado) -------------------------------------

create or replace function public.denunciar_resena(
  p_resena_id uuid,
  p_motivo    public.motivo_denuncia,
  p_detalle   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_detalle text := nullif(btrim(p_detalle), '');
  v_id      uuid;
begin
  if v_usuario is null then
    raise exception 'USUARIO_NO_AUTENTICADO' using errcode = '42501';
  end if;

  if not exists (
    select 1
      from public.resenas r
      join public.contactos c on c.id = r.contacto_id
     where r.id = p_resena_id
       and c.maestro_id = v_usuario
  ) then
    raise exception 'SOLO_MAESTRO_RESENADO' using errcode = '42501';
  end if;

  if v_detalle is not null and char_length(v_detalle) > 500 then
    raise exception 'DETALLE_MUY_LARGO' using errcode = '22001';
  end if;

  begin
    insert into public.denuncias (resena_id, denunciante_id, motivo, detalle)
    values (p_resena_id, v_usuario, p_motivo, v_detalle)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'YA_DENUNCIADA' using errcode = '23505';
  end;

  return v_id;
end;
$$;

-- 6. Listar denuncias pendientes (solo admin, sin datos del cliente) ---------------------

create or replace function public.listar_denuncias_pendientes()
returns table (
  id                 uuid,
  motivo             public.motivo_denuncia,
  detalle            text,
  creada_en          timestamptz,
  resena_id          uuid,
  resena_calificacion smallint,
  resena_comentario  text,
  resena_creada_en   timestamptz,
  maestro_nombre     text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'SOLO_ADMIN' using errcode = '42501';
  end if;

  return query
    select d.id, d.motivo, d.detalle, d.creada_en,
           r.id, r.calificacion, r.comentario, r.creada_en,
           p.nombre
      from public.denuncias d
      join public.resenas r   on r.id = d.resena_id
      join public.contactos c on c.id = r.contacto_id
      join public.perfiles p  on p.id = c.maestro_id
     where d.estado = 'pendiente'
     order by d.creada_en;   -- la que lleva más tiempo esperando, primero
end;
$$;

-- 7. Resolver una denuncia (solo admin). Si se acepta, la reseña se oculta ---------------

create or replace function public.resolver_denuncia(
  p_id      uuid,
  p_aceptar boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_denuncia public.denuncias%rowtype;
begin
  if not public.es_admin() then
    raise exception 'SOLO_ADMIN' using errcode = '42501';
  end if;

  select * into v_denuncia
    from public.denuncias
   where id = p_id
   for update;

  if not found then
    raise exception 'DENUNCIA_NO_EXISTE' using errcode = 'P0002';
  end if;

  if v_denuncia.estado <> 'pendiente' then
    raise exception 'DENUNCIA_YA_RESUELTA' using errcode = '22023';
  end if;

  update public.denuncias
     set estado      = case when p_aceptar then 'aceptada' else 'descartada' end::public.estado_denuncia,
         revisor_id  = auth.uid(),
         revisada_en = now()
   where id = p_id;

  if p_aceptar then
    update public.resenas set oculta = true where id = v_denuncia.resena_id;
  end if;

  insert into public.auditoria (actor_id, accion, objeto)
  values (
    auth.uid(),
    case when p_aceptar then 'aceptar_denuncia' else 'descartar_denuncia' end,
    format('denuncia:%s resena:%s motivo:%s', v_denuncia.id, v_denuncia.resena_id, v_denuncia.motivo)
  );
end;
$$;

revoke all on function public.denunciar_resena(uuid, public.motivo_denuncia, text) from public, anon;
revoke all on function public.listar_denuncias_pendientes() from public, anon;
revoke all on function public.resolver_denuncia(uuid, boolean) from public, anon;
grant execute on function public.denunciar_resena(uuid, public.motivo_denuncia, text) to authenticated;
grant execute on function public.listar_denuncias_pendientes() to authenticated;
grant execute on function public.resolver_denuncia(uuid, boolean) to authenticated;

-- 8. Las reseñas ocultas no se muestran ni cuentan en el promedio -------------------------
-- Redefine las funciones de 20261114190000_rf5_resenas_publicas.sql.
-- `obtener_resenas_maestro` ahora devuelve también el `id` (columna nueva al principio), para que el maestro pueda
-- denunciar una reseña desde su perfil. Cambiar las columnas de salida obliga a borrar y crear la función.

drop function if exists public.obtener_resenas_maestro(uuid);

create function public.obtener_resenas_maestro(
  p_maestro_id uuid
)
returns table (
  id uuid,
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
    r.id,
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
    and not r.oculta
  order by r.creada_en desc;
$$;

revoke all on function public.obtener_resenas_maestro(uuid) from public;
grant execute on function public.obtener_resenas_maestro(uuid) to anon, authenticated;

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
      and not r.oculta
  )
  select
    count(*) filter (where maestro_id = p_maestro_id) as cantidad_resenas,
    avg(calificacion) filter (where maestro_id = p_maestro_id) as promedio_maestro,
    avg(calificacion) as promedio_global
  from resenas_validas
  where exists (
    select 1
    from public.maestros m
    where m.id = p_maestro_id
      and m.estado_identidad = 'verificada'::public.estado_identidad
  );
$$;

revoke all on function public.obtener_estadisticas_reputacion(uuid) from public;
grant execute on function public.obtener_estadisticas_reputacion(uuid) to anon, authenticated;
