-- MasterPlace · Revisión de identidad del maestro (RF-2, RF-8, §5.3)
-- Autor: Diego. Revisa: Ignacio (datos y seguridad) antes de aplicarla.
-- Requiere: esquema inicial, es_admin() y las políticas RLS (20261110000000).
--
-- Por qué una función: las políticas no dejan que la app cambie `maestros.estado_identidad` ni escriba en
-- `auditoria`, ni siquiera siendo admin (GRANT por columna). Esta función, security definer, hace la revisión
-- completa en una sola transacción y solo si quien llama es admin:
--   1. marca la cédula como aprobada (sin ruta de archivo, por el check de la tabla) o rechazada;
--   2. deja al maestro como «verificada» o «rechazada»;
--   3. registra la revisión en `auditoria`, sin la ruta ni datos de la cédula.
-- Devuelve la ruta del archivo para que el panel lo borre del bucket con la API de Storage (SQL no puede borrar
-- archivos de Storage; la política documentos_storage_admin permite al admin hacerlo). La cédula rechazada
-- conserva su archivo hasta la eliminación programada.

create or replace function public.revisar_identidad(
  p_documento_id uuid,
  p_aprobar      boolean,
  p_motivo       text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc    public.documentos;
  v_motivo text := nullif(regexp_replace(btrim(coalesce(p_motivo, '')), '\s+', ' ', 'g'), '');
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede revisar identidades' using errcode = '42501';
  end if;

  -- for update: si dos admins revisan a la vez, el segundo espera y luego ve que ya no está pendiente.
  select * into v_doc from public.documentos where id = p_documento_id for update;

  if not found then
    raise exception 'El documento no existe';
  end if;
  if v_doc.tipo <> 'cedula' then
    raise exception 'Solo se revisan cédulas con esta función';
  end if;
  if v_doc.estado <> 'pendiente' then
    raise exception 'Este documento ya fue revisado';
  end if;
  if not p_aprobar and char_length(coalesce(v_motivo, '')) not between 10 and 300 then
    raise exception 'El rechazo necesita un motivo de 10 a 300 caracteres';
  end if;

  update public.documentos
     set estado       = case when p_aprobar then 'aprobado' else 'rechazado' end::public.estado_revision,
         ruta_archivo = case when p_aprobar then null else ruta_archivo end,
         revisor_id   = (select auth.uid()),
         revisado_en  = now()
   where id = v_doc.id;

  update public.maestros
     set estado_identidad = case when p_aprobar then 'verificada' else 'rechazada' end::public.estado_identidad
   where id = v_doc.maestro_id;

  insert into public.auditoria (actor_id, accion, objeto)
  values (
    (select auth.uid()),
    case when p_aprobar then 'aprobar_cedula' else 'rechazar_cedula' end,
    'documento:' || v_doc.id || ' maestro:' || v_doc.maestro_id
      || case when p_aprobar then '' else ' motivo: ' || v_motivo end
  );

  return v_doc.ruta_archivo;
end;
$$;

revoke execute on function public.revisar_identidad(uuid, boolean, text) from public, anon;
grant  execute on function public.revisar_identidad(uuid, boolean, text) to authenticated;

comment on function public.revisar_identidad(uuid, boolean, text) is
  'RF-2/RF-8: el admin aprueba o rechaza una cédula pendiente; actualiza documento y maestro y registra en auditoría. Devuelve la ruta del archivo para borrarlo del bucket.';
