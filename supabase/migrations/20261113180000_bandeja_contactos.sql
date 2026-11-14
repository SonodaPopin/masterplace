-- MasterPlace · RF-11: bandeja de conversaciones con identidad de la contraparte.
-- SECURITY INVOKER conserva RLS: el usuario solo obtiene sus propios contactos,
-- el nombre visible de su contraparte y el último mensaje de cada conversación.
-- No se devuelven correo, teléfono, RUT ni otros datos privados.

create or replace function public.bandeja_contactos()
returns table (
  contacto_id uuid,
  contraparte_id uuid,
  nombre_contraparte text,
  rol_contraparte text,
  estado text,
  creado_en timestamptz,
  ultimo_mensaje text,
  ultimo_mensaje_en timestamptz,
  ultimo_mensaje_emisor_id uuid
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id as contacto_id,
    case
      when c.cliente_id = (select auth.uid()) then c.maestro_id
      else c.cliente_id
    end as contraparte_id,
    p.nombre as nombre_contraparte,
    p.rol::text as rol_contraparte,
    c.estado::text as estado,
    c.creado_en,
    ultimo.contenido as ultimo_mensaje,
    ultimo.enviado_en as ultimo_mensaje_en,
    ultimo.emisor_id as ultimo_mensaje_emisor_id
  from public.contactos c
  join public.perfiles p
    on p.id = case
      when c.cliente_id = (select auth.uid()) then c.maestro_id
      else c.cliente_id
    end
  left join lateral (
    select m.contenido, m.enviado_en, m.emisor_id
      from public.mensajes m
     where m.contacto_id = c.id
     order by m.enviado_en desc, m.id desc
     limit 1
  ) ultimo on true
  where c.cliente_id = (select auth.uid())
     or c.maestro_id = (select auth.uid())
  order by coalesce(ultimo.enviado_en, c.creado_en) desc, c.id desc;
$$;

revoke all on function public.bandeja_contactos() from public, anon;
grant execute on function public.bandeja_contactos() to authenticated;

comment on function public.bandeja_contactos() is
  'RF-11: lista contactos del usuario autenticado, nombre/rol de contraparte y último mensaje. SECURITY INVOKER aplica RLS; no expone email ni teléfono.';

-- Publica contactos para que la bandeja detecte nuevas conversaciones en tiempo real.
-- Mensajes ya se publica mediante 20261113173000_habilitar_realtime_mensajes.sql;
-- se comprueba también aquí de forma idempotente por si esa migración no se aplicó aún.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'contactos'
  ) then
    execute 'alter publication supabase_realtime add table public.contactos';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'mensajes'
  ) then
    execute 'alter publication supabase_realtime add table public.mensajes';
  end if;
end;
$$;
