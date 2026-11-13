-- MasterPlace · Borrado de la cédula al aprobarla (RF-2, §5.3)
-- Requiere: esquema inicial, es_admin() y políticas RLS.
--
-- Por qué hay una cola: Storage no permite borrar archivos con SQL. Borrar filas de
-- storage.objects deja el archivo físico huérfano en el bucket, y una cédula es un
-- dato sensible. El borrado real lo hace la API de Storage (Edge Function
-- `purgar-archivos`, con service_role). La base de datos garantiza dos cosas:
--   1. Al aprobar una cédula, `ruta_archivo` queda en null y la ruta original se
--      anota en `archivos_por_borrar` en la misma transacción: nunca se pierde.
--   2. Todo queda en `auditoria`, sin contenido de documentos.
-- Esto vale sin importar quién apruebe (panel admin, SQL o service_role).

-- 1. Cola de archivos por borrar ---------------------------------------------------

create table if not exists public.archivos_por_borrar (
  id            bigserial primary key,
  bucket        text not null,
  ruta          text not null,
  documento_id  uuid,                       -- sin FK: el documento puede borrarse después
  creado_en     timestamptz not null default now(),
  borrado_en    timestamptz                 -- null = pendiente
);

create index if not exists archivos_por_borrar_pendientes_idx
  on public.archivos_por_borrar (id) where borrado_en is null;

alter table public.archivos_por_borrar enable row level security;
revoke all on table    public.archivos_por_borrar from anon, authenticated;
revoke all on sequence public.archivos_por_borrar_id_seq from anon, authenticated;
grant all on table    public.archivos_por_borrar to service_role;
grant all on sequence public.archivos_por_borrar_id_seq to service_role;

comment on table public.archivos_por_borrar is
  'Cola de archivos de Storage a eliminar con la API. Solo service_role y funciones security definer.';

-- 2. Antes de guardar una revisión: fecha, revisor y cédula sin archivo -----------

create or replace function public.documentos_antes_de_revisar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Quién y cuándo revisó (si quien aprueba no los indicó).
  if new.revisor_id is not distinct from old.revisor_id and (select auth.uid()) is not null then
    new.revisor_id := (select auth.uid());
  end if;
  if new.revisado_en is not distinct from old.revisado_en then
    new.revisado_en := now();
  end if;

  -- Cédula aprobada: anotar el archivo para borrarlo y soltar la ruta (RF-2).
  if new.tipo = 'cedula' and new.estado = 'aprobado' then
    insert into public.archivos_por_borrar (bucket, ruta, documento_id)
    select 'cedulas', r, new.id
      from (select distinct r from unnest(array[old.ruta_archivo, new.ruta_archivo]) as r) x
     where r is not null;
    new.ruta_archivo := null;
  end if;

  return new;
end;
$$;

drop trigger if exists documentos_antes_de_revisar on public.documentos;
create trigger documentos_antes_de_revisar
  before update on public.documentos
  for each row
  when (old.estado is distinct from new.estado
        and new.estado in ('aprobado', 'rechazado'))
  execute function public.documentos_antes_de_revisar();

-- 3. Después de guardar una revisión: niveles de confianza y auditoría ---------------
-- Los niveles no se pueden escribir desde la app (GRANT por columna), así que este
-- trigger security definer es el camino para que una revisión los actualice.
--   Cédula aprobada   -> estado_identidad = 'verificada'   (Nivel 1)
--   Cédula rechazada  -> estado_identidad = 'rechazada'
--   Certificado       -> certificado_ok = (aprobado)       (Nivel 3)
-- revisar_identidad() hace lo mismo para las cédulas; repetirlo es inofensivo.

create or replace function public.documentos_despues_de_revisar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tipo = 'cedula' then
    update public.maestros
       set estado_identidad = (case new.estado when 'aprobado' then 'verificada'
                                               else 'rechazada' end)::public.estado_identidad
     where id = new.maestro_id;
  else
    update public.maestros
       set certificado_ok = (new.estado = 'aprobado')
     where id = new.maestro_id;
  end if;

  return null;
end;
$$;

drop trigger if exists documentos_despues_de_revisar on public.documentos;
create trigger documentos_despues_de_revisar
  after update on public.documentos
  for each row
  when (old.estado is distinct from new.estado
        and new.estado in ('aprobado', 'rechazado'))
  execute function public.documentos_despues_de_revisar();

-- Auditoría. Es un trigger DIFERIDO (corre al final de la transacción) para no repetir
-- lo que ya anotó revisar_identidad() (acciones aprobar_cedula / rechazar_cedula, con el
-- motivo): si esa función ya dejó su registro en esta transacción, aquí no se agrega otro.
-- Si la revisión llegó por otro camino (UPDATE directo, otro código), se anota aquí.
-- Depende del formato 'documento:<id> ...' que usa revisar_identidad(); si ese formato
-- cambia, lo peor que pasa es un registro duplicado.

create or replace function public.documentos_auditar_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.auditoria a
     where a.creada_en = now()                       -- misma transacción
       and a.accion in ('aprobar_cedula', 'rechazar_cedula')
       and a.objeto like 'documento:' || new.id::text || ' %'
  ) then
    return null;
  end if;

  insert into public.auditoria (actor_id, accion, objeto)
  values ((select auth.uid()), 'documento_' || new.estado::text,
          new.tipo::text || ' ' || new.id::text);
  return null;
end;
$$;

drop trigger if exists documentos_auditar_revision on public.documentos;
create constraint trigger documentos_auditar_revision
  after update on public.documentos
  deferrable initially deferred
  for each row
  when (old.estado is distinct from new.estado
        and new.estado in ('aprobado', 'rechazado'))
  execute function public.documentos_auditar_revision();

-- 4. Confirmar que Storage ya borró los archivos -------------------------------------
-- La llama la Edge Function (service_role) después de storage.remove().

create or replace function public.confirmar_borrado_archivos(p_ids bigint[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer;
begin
  with u as (
    update public.archivos_por_borrar
       set borrado_en = now()
     where id = any (p_ids) and borrado_en is null
    returning id
  )
  select count(*) into v_n from u;

  if v_n > 0 then
    insert into public.auditoria (actor_id, accion, objeto)
    values (null, 'archivo_cedula_borrado', v_n || ' archivos eliminados de Storage');
  end if;

  return v_n;
end;
$$;

revoke execute on function public.confirmar_borrado_archivos(bigint[]) from public, anon, authenticated;
grant  execute on function public.confirmar_borrado_archivos(bigint[]) to service_role;