-- =====================================================================
-- Solicitudes de servicio · tarea 1 (contrato)
-- Migración ADITIVA: no modifica nada de lo existente, salvo agregar
-- una columna nullable a `resenas`. La regla que EXIGE la solicitud
-- para reseñar va en la tarea 2 (migración de cambio).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tipo de estado
-- ---------------------------------------------------------------------
create type public.estado_solicitud as enum (
  'pendiente',
  'aceptada',
  'rechazada',
  'cancelada',
  'realizada'
);

-- ---------------------------------------------------------------------
-- 2. Tabla
--    cliente_id y maestro_id se copian del contacto al crear la
--    solicitud. Las FK y el `on delete cascade` siguen a `contactos`,
--    para que borrar una cuenta no quede bloqueado por sus solicitudes.
-- ---------------------------------------------------------------------
create table public.solicitudes_servicio (
  id              uuid primary key default gen_random_uuid(),
  contacto_id     uuid not null references public.contactos (id) on delete cascade,
  cliente_id      uuid not null references public.perfiles (id) on delete cascade,
  maestro_id      uuid not null references public.maestros (id) on delete cascade,
  descripcion     text not null
                  check (char_length(descripcion) between 1 and 500),
  fecha_acordada  timestamptz not null,
  estado          public.estado_solicitud not null default 'pendiente',
  motivo_rechazo  text
                  check (motivo_rechazo is null or char_length(motivo_rechazo) <= 300),
  creada_en       timestamptz not null default now(),
  respondida_en   timestamptz,
  realizada_en    timestamptz,
  realizada_por   uuid references public.perfiles (id) on delete set null
);

create index solicitudes_servicio_contacto_idx
  on public.solicitudes_servicio (contacto_id);
create index solicitudes_servicio_cliente_idx
  on public.solicitudes_servicio (cliente_id, creada_en desc);
create index solicitudes_servicio_maestro_idx
  on public.solicitudes_servicio (maestro_id, creada_en desc);

-- ---------------------------------------------------------------------
-- 3. RLS: solo lectura para participantes y admin.
--    Sin insert/update/delete directos: todo pasa por las funciones.
-- ---------------------------------------------------------------------
alter table public.solicitudes_servicio enable row level security;

-- Supabase da privilegios amplios por defecto; los quitamos y dejamos select.
revoke all on public.solicitudes_servicio from anon, authenticated;
grant select on public.solicitudes_servicio to authenticated;

create policy solicitudes_select_participantes
  on public.solicitudes_servicio
  for select
  to authenticated
  using (
    cliente_id = (select auth.uid())
    or maestro_id = (select auth.uid())
    or public.es_admin()
  );

-- ---------------------------------------------------------------------
-- 4. Auditoría (sin el texto de la descripción)
--    Función interna: solo la llaman las funciones de abajo.
--    Columnas reales de `auditoria`: actor_id, accion, objeto (text).
-- ---------------------------------------------------------------------
create or replace function public.auditar_solicitud(
  p_accion       text,
  p_solicitud_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.auditoria (actor_id, accion, objeto)
  values (auth.uid(), p_accion, p_solicitud_id::text);
$$;

revoke all on function public.auditar_solicitud(text, uuid)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. crear_solicitud
--    Errores: SOLO_CLIENTE, CONTACTO_CERRADO, FECHA_INVALIDA,
--             DESCRIPCION_INVALIDA
-- ---------------------------------------------------------------------
create or replace function public.crear_solicitud(
  p_contacto_id    uuid,
  p_descripcion    text,
  p_fecha_acordada timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid         uuid := auth.uid();
  v_contacto    record;
  v_descripcion text := btrim(coalesce(p_descripcion, ''));
  v_id          uuid;
begin
  select c.cliente_id, c.maestro_id, c.estado
    into v_contacto
    from public.contactos c
   where c.id = p_contacto_id;

  if not found or v_uid is null or v_contacto.cliente_id <> v_uid then
    raise exception 'SOLO_CLIENTE';
  end if;

  if v_contacto.estado = 'cerrado' then
    raise exception 'CONTACTO_CERRADO';
  end if;

  if char_length(v_descripcion) not between 1 and 500 then
    raise exception 'DESCRIPCION_INVALIDA';
  end if;

  if p_fecha_acordada is null
     or p_fecha_acordada < now() - interval '7 days'
     or p_fecha_acordada > now() + interval '60 days' then
    raise exception 'FECHA_INVALIDA';
  end if;

  insert into public.solicitudes_servicio
    (contacto_id, cliente_id, maestro_id, descripcion, fecha_acordada)
  values
    (p_contacto_id, v_contacto.cliente_id, v_contacto.maestro_id,
     v_descripcion, p_fecha_acordada)
  returning id into v_id;

  perform public.auditar_solicitud('solicitud_creada', v_id);
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. responder_solicitud
--    Errores: SOLO_MAESTRO, ESTADO_INVALIDO
--    (MOTIVO_INVALIDO se agrega para no chocar con el check de 300.)
-- ---------------------------------------------------------------------
create or replace function public.responder_solicitud(
  p_id       uuid,
  p_aceptar  boolean,
  p_motivo   text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_sol    public.solicitudes_servicio%rowtype;
  v_motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  select * into v_sol
    from public.solicitudes_servicio
   where id = p_id
     for update;

  if not found or v_uid is null or v_sol.maestro_id <> v_uid then
    raise exception 'SOLO_MAESTRO';
  end if;

  if v_sol.estado <> 'pendiente' then
    raise exception 'ESTADO_INVALIDO';
  end if;

  if not coalesce(p_aceptar, false)
     and v_motivo is not null
     and char_length(v_motivo) > 300 then
    raise exception 'MOTIVO_INVALIDO';
  end if;

  update public.solicitudes_servicio
     set estado = case when p_aceptar
                       then 'aceptada'::public.estado_solicitud
                       else 'rechazada'::public.estado_solicitud end,
         motivo_rechazo = case when p_aceptar then null else v_motivo end,
         respondida_en  = now()
   where id = p_id;

  perform public.auditar_solicitud(
    case when p_aceptar then 'solicitud_aceptada' else 'solicitud_rechazada' end,
    p_id
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 7. cancelar_solicitud
--    Errores: SOLO_CLIENTE, ESTADO_INVALIDO, FUERA_DE_PLAZO
-- ---------------------------------------------------------------------
create or replace function public.cancelar_solicitud(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sol public.solicitudes_servicio%rowtype;
begin
  select * into v_sol
    from public.solicitudes_servicio
   where id = p_id
     for update;

  if not found or v_uid is null or v_sol.cliente_id <> v_uid then
    raise exception 'SOLO_CLIENTE';
  end if;

  if v_sol.estado not in ('pendiente', 'aceptada') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  if now() >= v_sol.fecha_acordada then
    raise exception 'FUERA_DE_PLAZO';
  end if;

  update public.solicitudes_servicio
     set estado = 'cancelada'
   where id = p_id;

  perform public.auditar_solicitud('solicitud_cancelada', p_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 8. marcar_realizada
--    Errores: NO_PARTICIPANTE, ESTADO_INVALIDO, AUN_NO
--    Las 2 horas viven también en src/lib/solicitudes/reglas.ts.
-- ---------------------------------------------------------------------
create or replace function public.marcar_realizada(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sol public.solicitudes_servicio%rowtype;
begin
  select * into v_sol
    from public.solicitudes_servicio
   where id = p_id
     for update;

  if not found
     or v_uid is null
     or v_uid not in (v_sol.cliente_id, v_sol.maestro_id) then
    raise exception 'NO_PARTICIPANTE';
  end if;

  if v_sol.estado <> 'aceptada' then
    raise exception 'ESTADO_INVALIDO';
  end if;

  if now() < v_sol.fecha_acordada + interval '2 hours' then
    raise exception 'AUN_NO';
  end if;

  update public.solicitudes_servicio
     set estado        = 'realizada',
         realizada_en  = now(),
         realizada_por = v_uid
   where id = p_id;

  perform public.auditar_solicitud('solicitud_realizada', p_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Permisos de ejecución: solo usuarios autenticados
-- ---------------------------------------------------------------------
revoke all on function public.crear_solicitud(uuid, text, timestamptz)   from public, anon;
revoke all on function public.responder_solicitud(uuid, boolean, text)   from public, anon;
revoke all on function public.cancelar_solicitud(uuid)                   from public, anon;
revoke all on function public.marcar_realizada(uuid)                     from public, anon;

grant execute on function public.crear_solicitud(uuid, text, timestamptz) to authenticated;
grant execute on function public.responder_solicitud(uuid, boolean, text) to authenticated;
grant execute on function public.cancelar_solicitud(uuid)                 to authenticated;
grant execute on function public.marcar_realizada(uuid)                   to authenticated;

-- ---------------------------------------------------------------------
-- 10. Reseñas: columna nueva (todavía NO se exige; eso es la tarea 2)
--     null = reseñas antiguas, sin solicitud.
-- ---------------------------------------------------------------------
alter table public.resenas
  add column solicitud_id uuid unique
  references public.solicitudes_servicio (id);

grant insert (solicitud_id) on public.resenas to authenticated;

-- ---------------------------------------------------------------------
-- 11. Realtime: la tarjeta del chat se actualiza sola
--     (comparar con 20261113173000_habilitar_realtime_mensajes.sql)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname    = 'supabase_realtime'
       and schemaname = 'public'
       and tablename  = 'solicitudes_servicio'
  ) then
    alter publication supabase_realtime add table public.solicitudes_servicio;
  end if;
end
$$;