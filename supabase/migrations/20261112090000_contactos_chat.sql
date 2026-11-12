-- MasterPlace · RF-4 Contactos y RF-11 mensajería básica
-- Un cliente puede conservar contactos históricos cerrados con un mismo maestro,
-- pero solo puede existir un contacto abierto por pareja cliente–maestro.
-- Las políticas permiten leer solo a los participantes y enviar mensajes solo en contactos abiertos.

-- Evita crear dos contactos activos para el mismo cliente y maestro.
-- Si ya existen duplicados activos, detener la migración para resolverlos sin perder historial.
do $$
begin
  if exists (
    select 1
      from public.contactos
     where estado = 'abierto'::public.estado_contacto
     group by cliente_id, maestro_id
    having count(*) > 1
  ) then
    raise exception
      'Hay contactos activos duplicados por cliente y maestro. Resuélvelos antes de aplicar 20261112090000_contactos_chat.sql.';
  end if;
end;
$$;

create unique index if not exists contactos_unico_activo_cliente_maestro_idx
  on public.contactos (cliente_id, maestro_id)
  where estado = 'abierto'::public.estado_contacto;

-- Crea un contacto o devuelve el contacto abierto existente.
-- El cliente se obtiene de auth.uid(); nunca se acepta desde el navegador.
-- Solo se puede contactar a maestros verificados (Nivel 1) y disponibles (RB-6).
create or replace function public.crear_o_reutilizar_contacto(p_maestro_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cliente_id uuid := auth.uid();
  v_contacto_id uuid;
  v_maestro_id uuid;
begin
  if v_cliente_id is null then
    raise exception using message = 'USUARIO_NO_AUTENTICADO', errcode = '28000';
  end if;

  if not exists (
    select 1
      from public.perfiles p
     where p.id = v_cliente_id
       and p.rol = 'cliente'::public.rol_usuario
  ) then
    raise exception using message = 'SOLO_CLIENTE', errcode = '42501';
  end if;

  select m.id
    into v_maestro_id
    from public.maestros m
   where m.id = p_maestro_id
     and m.estado_identidad = 'verificada'::public.estado_identidad
     and m.disponible = true
   for share;

  if v_maestro_id is null then
    raise exception using message = 'MAESTRO_NO_CONTACTABLE', errcode = 'P0001';
  end if;

  insert into public.contactos as contacto (cliente_id, maestro_id)
  values (v_cliente_id, v_maestro_id)
  on conflict (cliente_id, maestro_id)
    where (estado = 'abierto'::public.estado_contacto)
  do update set creado_en = contacto.creado_en
  returning contacto.id into v_contacto_id;

  return v_contacto_id;
end;
$$;

revoke all on function public.crear_o_reutilizar_contacto(uuid) from public, anon;
grant execute on function public.crear_o_reutilizar_contacto(uuid) to authenticated;

comment on function public.crear_o_reutilizar_contacto(uuid) is
  'RF-4: crea o reutiliza el único contacto abierto de un cliente autenticado con un maestro verificado y disponible. Los contactos con servicio confirmado o cerrados se conservan como historial.';

-- Contactos: cada participante puede consultar únicamente sus propios contactos.
drop policy if exists contactos_select_participantes on public.contactos;
create policy contactos_select_participantes
  on public.contactos
  for select
  to authenticated
  using (cliente_id = (select auth.uid()) or maestro_id = (select auth.uid()));

-- Mensajes: lectura solo para cliente o maestro participante del contacto.
drop policy if exists mensajes_select_participantes on public.mensajes;
create policy mensajes_select_participantes
  on public.mensajes
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.contactos c
       where c.id = mensajes.contacto_id
         and (c.cliente_id = (select auth.uid()) or c.maestro_id = (select auth.uid()))
    )
  );

-- Envío: el emisor debe ser el usuario autenticado y el contacto debe estar abierto.
drop policy if exists mensajes_insert_participantes_contacto_abierto on public.mensajes;
create policy mensajes_insert_participantes_contacto_abierto
  on public.mensajes
  for insert
  to authenticated
  with check (
    emisor_id = (select auth.uid())
    and exists (
      select 1
        from public.contactos c
       where c.id = mensajes.contacto_id
         and c.estado = 'abierto'::public.estado_contacto
         and (c.cliente_id = (select auth.uid()) or c.maestro_id = (select auth.uid()))
    )
  );

-- Permisos SQL complementan RLS; no se concede UPDATE ni DELETE de mensajes/contactos.
grant select on public.contactos to authenticated;
grant select, insert on public.mensajes to authenticated;
grant usage, select on sequence public.mensajes_id_seq to authenticated;
