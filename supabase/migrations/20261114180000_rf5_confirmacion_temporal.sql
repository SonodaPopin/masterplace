-- RF-5 · Confirmación automática provisional para E3.
-- El contacto se confirma al iniciarse.
-- Esta regla deberá revisarse cuando se defina
-- el procedimiento definitivo de confirmación.

-- Evitar contactos activos duplicados.
-- Si existen, detener la migración sin modificar
-- el historial de conversaciones ni las reseñas.

do $$
begin
  if exists (
    select 1
    from public.contactos
    where estado in (
      'abierto'::public.estado_contacto,
      'servicio_confirmado'::public.estado_contacto
    )
    group by cliente_id, maestro_id
    having count(*) > 1
  ) then
    raise exception
      'Existen contactos activos duplicados. Resolverlos antes de aplicar la migración RF-5.';
  end if;
end;
$$;

-- Reemplazar el índice original por uno que considere
-- tanto los contactos abiertos como los confirmados.

drop index if exists public.contactos_unico_activo_cliente_maestro_idx;
create unique index contactos_unico_activo_cliente_maestro_idx
  on public.contactos (cliente_id, maestro_id)
  where estado in (
    'abierto'::public.estado_contacto,
    'servicio_confirmado'::public.estado_contacto
  );

-- RF-5: Confirmar los contactos antiguos que siguen abiertos.
-- Decisión provisional para E3.
-- No modificar los contactos cerrados.

update public.contactos
set estado = 'servicio_confirmado'::public.estado_contacto
where estado = 'abierto'::public.estado_contacto;

-- Confirmar automáticamente los nuevos contactos.
alter table public.contactos
  alter column estado
  set default 'servicio_confirmado'::public.estado_contacto;

-- Permitir mensajería en contactos abiertos o confirmados.
-- Eliminar ambas políticas anteriores para evitar
-- que sus permisos se combinen mediante OR.

drop policy if exists mensajes_insert_participante
  on public.mensajes;

drop policy if exists mensajes_insert_participantes_contacto_abierto
  on public.mensajes;

create policy mensajes_insert_participantes_contacto_activo
  on public.mensajes
  for insert
  to authenticated
  with check (
    emisor_id = (select auth.uid())
    and exists (
      select 1
      from public.contactos c
      where c.id = mensajes.contacto_id
        and c.estado in ('abierto', 'servicio_confirmado')
        and (
          c.cliente_id = (select auth.uid())
          or c.maestro_id = (select auth.uid())
        )
    )
  );

-- Impedir cambios directos de estado desde el cliente.
revoke update (estado, cerrado_en)
  on public.contactos
  from authenticated;
-- RF-5: crear o reutilizar un contacto confirmado.
-- Confirmación automática provisional para E3.

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

  insert into public.contactos as contacto (
    cliente_id,
    maestro_id,
    estado
  )
  values (
    v_cliente_id,
    v_maestro_id,
    'servicio_confirmado'::public.estado_contacto
  )
  on conflict (cliente_id, maestro_id)
    where estado in (
      'abierto'::public.estado_contacto,
      'servicio_confirmado'::public.estado_contacto
    )
  do update set creado_en = contacto.creado_en
  returning contacto.id into v_contacto_id;

  return v_contacto_id;
end;
$$;

-- RF-5: Permitir la creación de contactos únicamente
-- a usuarios autenticados.

revoke all on function public.crear_o_reutilizar_contacto(uuid)
  from public, anon;

grant execute on function public.crear_o_reutilizar_contacto(uuid)
  to authenticated;
