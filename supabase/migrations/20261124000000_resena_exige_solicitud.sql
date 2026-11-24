-- =====================================================================
-- Reseñas exigen una solicitud realizada · tarea 2
-- Migración DE CAMBIO: cambia el comportamiento de contactos y reseñas.
-- Se aplica en producción el viernes 27, junto con el frontend que la
-- usa. NO antes: la app publicada todavía espera que el contacto nazca
-- «servicio_confirmado».
-- Requiere 20261122000000_solicitudes_servicio.sql (tarea 1).
-- No modifica los contactos ni las reseñas que ya existen.
--
-- Errores nuevos al insertar una reseña (los lanza el trigger):
--   RESENA_SIN_SOLICITUD, RESENA_SOLICITUD_INVALIDA, RESENA_SOLO_CLIENTE,
--   RESENA_SOLICITUD_NO_REALIZADA, RESENA_FUERA_DE_PLAZO.
-- Una segunda reseña de la misma solicitud falla por el unique
-- resenas_solicitud_id_key (error 23505).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. El contacto vuelve a nacer «abierto»
--    Los contactos existentes no se tocan.
-- ---------------------------------------------------------------------
alter table public.contactos
  alter column estado set default 'abierto'::public.estado_contacto;

-- Misma función de 20261114180000_rf5_confirmacion_temporal.sql, con un
-- único cambio: el contacto nuevo se inserta como 'abierto'. Los permisos
-- de ejecución actuales se conservan (create or replace no los modifica).
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
    'abierto'::public.estado_contacto
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

-- ---------------------------------------------------------------------
-- 2. Se retira la regla RB-2 antigua («servicio confirmado»)
-- ---------------------------------------------------------------------
drop trigger resenas_requiere_servicio_confirmado on public.resenas;
drop function public.validar_resena_servicio_confirmado();

-- ---------------------------------------------------------------------
-- 3. Una reseña por solicitud (ya no una por contacto)
--    Quitar el unique de contacto_id también quita su índice, así que se
--    crea uno normal para las búsquedas por contacto.
--    El unique de solicitud_id (tarea 1) pasa a ser la regla RB-7.
-- ---------------------------------------------------------------------
alter table public.resenas drop constraint resenas_contacto_id_key;

create index resenas_contacto_id_idx on public.resenas (contacto_id);

-- ---------------------------------------------------------------------
-- 4. La reseña nueva exige una solicitud realizada
--    Trigger (errores con código) + política (respaldo).
--    Solo se valida al INSERTAR: las reseñas antiguas (solicitud_id null)
--    no se tocan, y ningún rol de la app tiene UPDATE sobre resenas.
--    El trigger corre con los permisos de quien inserta, así que RLS de
--    solicitudes_servicio solo le deja ver las solicitudes propias.
-- ---------------------------------------------------------------------
create or replace function public.validar_resena_solicitud_realizada()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_sol public.solicitudes_servicio%rowtype;
begin
  if new.solicitud_id is null then
    raise exception 'RESENA_SIN_SOLICITUD';
  end if;

  select * into v_sol
    from public.solicitudes_servicio s
   where s.id = new.solicitud_id;

  if not found or v_sol.contacto_id <> new.contacto_id then
    raise exception 'RESENA_SOLICITUD_INVALIDA';
  end if;

  if v_sol.cliente_id is distinct from auth.uid() then
    raise exception 'RESENA_SOLO_CLIENTE';
  end if;

  if v_sol.estado <> 'realizada' then
    raise exception 'RESENA_SOLICITUD_NO_REALIZADA';
  end if;

  -- Las mismas 30 días de src/lib/solicitudes/reglas.ts (límite incluido).
  if v_sol.realizada_en < now() - interval '30 days' then
    raise exception 'RESENA_FUERA_DE_PLAZO';
  end if;

  return new;
end;
$$;

create trigger resenas_requiere_solicitud_realizada
  before insert on public.resenas
  for each row
  execute function public.validar_resena_solicitud_realizada();

drop policy resenas_insert_cliente on public.resenas;

create policy resenas_insert_cliente
  on public.resenas
  for insert
  to authenticated
  with check (
    exists (
      select 1
        from public.solicitudes_servicio s
       where s.id = resenas.solicitud_id
         and s.contacto_id = resenas.contacto_id
         and s.cliente_id = (select auth.uid())
         and s.estado = 'realizada'
         and s.realizada_en >= now() - interval '30 days'
    )
  );

comment on table public.resenas is
  'RB-2: solo se crea desde una solicitud realizada, del cliente, dentro de 30 días (trigger y política). RB-7: una reseña por solicitud (unique en solicitud_id); un contacto puede tener varias. Las reseñas anteriores conservan solicitud_id null.';