-- MasterPlace · Políticas RLS y Storage (E1 §5.3, RNF-1)
-- Requiere: esquema inicial y es_admin() (20261109235900). Todas las tablas ya
-- tienen RLS activado y sin políticas: lo que no se permite aquí sigue denegado.
--
-- Principios
--  1. anon solo lee catálogos y maestros verificados.
--  2. Un usuario nunca puede cambiar su propio rol ni sus niveles de confianza:
--     esas columnas no tienen permiso de escritura para `authenticated`
--     (GRANT por columna). Solo las cambian funciones security definer
--     (aprobación de documentos, reputación) o el service_role.
--  3. Las políticas no se referencian en círculo (perfiles <-> contactos daría
--     «infinite recursion»); por eso existe rol_actual(), security definer.
--  4. Cada política se elimina antes de crearla: la migración se puede repetir.

-- 0. Funciones de apoyo ----------------------------------------------------------

create or replace function public.rol_actual()
returns public.rol_usuario
language sql
stable
security definer
set search_path = public
as $$
  select p.rol from public.perfiles p where p.id = (select auth.uid());
$$;

revoke execute on function public.rol_actual() from public, anon;
grant  execute on function public.rol_actual() to authenticated;

comment on function public.rol_actual() is
  'Rol del usuario autenticado (null si no tiene perfil). Evita recursión de RLS entre perfiles y otras tablas.';

-- Teléfono de un perfil: solo el dueño, un admin o la contraparte de un contacto.
create or replace function public.telefono_de(p_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.telefono
    from public.perfiles p
   where p.id = p_id
     and (
          p.id = (select auth.uid())
       or public.es_admin()
       or exists (
            select 1 from public.contactos c
             where (c.cliente_id = (select auth.uid()) and c.maestro_id = p_id)
                or (c.maestro_id = (select auth.uid()) and c.cliente_id = p_id)
          )
     );
$$;

revoke execute on function public.telefono_de(uuid) from public, anon;
grant  execute on function public.telefono_de(uuid) to authenticated;

comment on function public.telefono_de(uuid) is
  'Teléfono del perfil si quien llama es el dueño, un admin o la contraparte de un contacto; si no, null.';

-- 1. Permisos de tabla -----------------------------------------------------------
-- RLS filtra filas; los GRANT limitan columnas y comandos. TRUNCATE no pasa por RLS.

revoke insert, update, delete, truncate, references, trigger on
  public.comunas, public.oficios, public.perfiles, public.maestros,
  public.maestros_privado, public.coberturas, public.documentos,
  public.contactos, public.mensajes, public.resenas, public.auditoria
from anon;

revoke truncate, references, trigger on
  public.comunas, public.oficios, public.perfiles, public.maestros,
  public.maestros_privado, public.coberturas, public.documentos,
  public.contactos, public.mensajes, public.resenas, public.auditoria
from authenticated;

-- perfiles: nunca se escribe `rol` después de crear la cuenta; creado_en es automático.
-- `telefono` no se puede leer por la API (ni anon ni authenticated): así el nombre de
-- un maestro verificado es público sin exponer su teléfono, y las consultas de otros
-- (p. ej. buscar_maestros) hacen un join normal a perfiles, sin security definer.
-- El teléfono se obtiene con telefono_de(). Ojo: en el frontend, pedir las columnas
-- por nombre en perfiles (select('id, nombre, rol, comuna_id')); `select *` fallaría.
revoke select on public.perfiles from anon, authenticated;
grant select (id, rol, nombre, comuna_id, creado_en) on public.perfiles to anon, authenticated;
revoke insert, update on public.perfiles from authenticated;
grant insert (id, rol, nombre, telefono, comuna_id) on public.perfiles to authenticated;
grant update (nombre, telefono, comuna_id)          on public.perfiles to authenticated;

-- maestros: estado_identidad, nivel_reputacion y certificado_ok quedan fuera.
revoke insert, update on public.maestros from authenticated;
grant insert (id, oficio_id, descripcion, anios_experiencia, referencia, disponible)
  on public.maestros to authenticated;
grant update (oficio_id, descripcion, anios_experiencia, referencia, disponible)
  on public.maestros to authenticated;

-- contactos: las partes no se pueden cambiar; solo avanza el estado.
revoke insert, update on public.contactos from authenticated;
grant insert (cliente_id, maestro_id) on public.contactos to authenticated;
grant update (estado, cerrado_en)     on public.contactos to authenticated;

-- mensajes y reseñas: solo se crean (sin editar ni borrar; la purga la hace la tarea programada).
revoke insert, update, delete on public.mensajes from authenticated;
grant insert (contacto_id, emisor_id, contenido) on public.mensajes to authenticated;
grant usage on sequence public.mensajes_id_seq to authenticated;  -- id bigserial

revoke insert, update, delete on public.resenas from authenticated;
grant insert (contacto_id, calificacion, comentario) on public.resenas to authenticated;

-- auditoria: solo lectura para admin (las filas las escriben funciones security definer).
revoke insert, update, delete on public.auditoria from authenticated;

-- 2. Catálogos: lectura pública, escritura solo admin ------------------------------

drop policy if exists comunas_select_publico on public.comunas;
create policy comunas_select_publico on public.comunas
  for select to anon, authenticated using (true);

drop policy if exists comunas_admin on public.comunas;
create policy comunas_admin on public.comunas
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists oficios_select_publico on public.oficios;
create policy oficios_select_publico on public.oficios
  for select to anon, authenticated using (true);

drop policy if exists oficios_admin on public.oficios;
create policy oficios_admin on public.oficios
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- 3. perfiles ----------------------------------------------------------------------
-- Nombre y comuna de los maestros verificados son públicos (van con su perfil público).
-- El teléfono nunca sale por aquí: ver GRANT por columna y telefono_de().

drop policy if exists perfiles_select_maestro_publico on public.perfiles;
create policy perfiles_select_maestro_publico on public.perfiles
  for select to anon, authenticated
  using (
    rol = 'maestro'
    and exists (
      select 1 from public.maestros m
       where m.id = perfiles.id and m.estado_identidad = 'verificada'
    )
  );

drop policy if exists perfiles_select_propio on public.perfiles;
create policy perfiles_select_propio on public.perfiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists perfiles_select_admin on public.perfiles;
create policy perfiles_select_admin on public.perfiles
  for select to authenticated using (public.es_admin());

drop policy if exists perfiles_select_contraparte on public.perfiles;
create policy perfiles_select_contraparte on public.perfiles
  for select to authenticated using (
    exists (
      select 1
        from public.contactos c
       where (c.cliente_id = (select auth.uid()) and c.maestro_id = perfiles.id)
          or (c.maestro_id = (select auth.uid()) and c.cliente_id = perfiles.id)
    )
  );

-- Alta de la propia cuenta: nadie se crea como admin.
drop policy if exists perfiles_insert_propio on public.perfiles;
create policy perfiles_insert_propio on public.perfiles
  for insert to authenticated
  with check (id = (select auth.uid()) and rol in ('cliente', 'maestro'));

drop policy if exists perfiles_update_propio on public.perfiles;
create policy perfiles_update_propio on public.perfiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- 4. maestros (perfil público) -----------------------------------------------------

drop policy if exists maestros_select_publico on public.maestros;
create policy maestros_select_publico on public.maestros
  for select to anon, authenticated using (estado_identidad = 'verificada');

drop policy if exists maestros_select_propio on public.maestros;
create policy maestros_select_propio on public.maestros
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists maestros_select_admin on public.maestros;
create policy maestros_select_admin on public.maestros
  for select to authenticated using (public.es_admin());

drop policy if exists maestros_insert_propio on public.maestros;
create policy maestros_insert_propio on public.maestros
  for insert to authenticated
  with check (id = (select auth.uid()) and public.rol_actual() = 'maestro');

drop policy if exists maestros_update_propio on public.maestros;
create policy maestros_update_propio on public.maestros
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- 5. maestros_privado (RUT): solo dueño y admin -------------------------------------

drop policy if exists maestros_privado_propio on public.maestros_privado;
create policy maestros_privado_propio on public.maestros_privado
  for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists maestros_privado_admin on public.maestros_privado;
create policy maestros_privado_admin on public.maestros_privado
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- 6. coberturas: visibles junto con el maestro; las gestiona su dueño -----------------
-- El subselect a maestros pasa por su RLS: anon solo ve coberturas de verificados.

drop policy if exists coberturas_select on public.coberturas;
create policy coberturas_select on public.coberturas
  for select to anon, authenticated
  using (exists (select 1 from public.maestros m where m.id = coberturas.maestro_id));

drop policy if exists coberturas_propio on public.coberturas;
create policy coberturas_propio on public.coberturas
  for all to authenticated
  using (maestro_id = (select auth.uid())) with check (maestro_id = (select auth.uid()));

drop policy if exists coberturas_admin on public.coberturas;
create policy coberturas_admin on public.coberturas
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- 7. documentos: solo dueño y admin ---------------------------------------------------
-- El dueño sube y reemplaza, pero no puede aprobarse (estado/revisor) ni tocar una
-- cédula ya aprobada. Aprobar/rechazar lo hace el admin (o su función security definer).

drop policy if exists documentos_select_propio on public.documentos;
create policy documentos_select_propio on public.documentos
  for select to authenticated using (maestro_id = (select auth.uid()));

drop policy if exists documentos_insert_propio on public.documentos;
create policy documentos_insert_propio on public.documentos
  for insert to authenticated
  with check (
    maestro_id = (select auth.uid())
    and estado = 'pendiente' and revisor_id is null and revisado_en is null
  );

drop policy if exists documentos_update_propio on public.documentos;
create policy documentos_update_propio on public.documentos
  for update to authenticated
  using (maestro_id = (select auth.uid()) and estado <> 'aprobado')
  with check (
    maestro_id = (select auth.uid())
    and estado = 'pendiente' and revisor_id is null and revisado_en is null
  );

drop policy if exists documentos_admin on public.documentos;
create policy documentos_admin on public.documentos
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- 8. contactos y mensajes: solo participantes ----------------------------------------

drop policy if exists contactos_select_participante on public.contactos;
create policy contactos_select_participante on public.contactos
  for select to authenticated
  using (cliente_id = (select auth.uid()) or maestro_id = (select auth.uid()));

-- Solo un cliente abre contactos, y solo con maestros verificados.
drop policy if exists contactos_insert_cliente on public.contactos;
create policy contactos_insert_cliente on public.contactos
  for insert to authenticated
  with check (
    cliente_id = (select auth.uid())
    and public.rol_actual() = 'cliente'
    and exists (
      select 1 from public.maestros m
       where m.id = maestro_id and m.estado_identidad = 'verificada'
    )
  );

drop policy if exists contactos_update_participante on public.contactos;
create policy contactos_update_participante on public.contactos
  for update to authenticated
  using (cliente_id = (select auth.uid()) or maestro_id = (select auth.uid()))
  with check (cliente_id = (select auth.uid()) or maestro_id = (select auth.uid()));

drop policy if exists mensajes_select_participante on public.mensajes;
create policy mensajes_select_participante on public.mensajes
  for select to authenticated
  using (exists (
    select 1 from public.contactos c
     where c.id = mensajes.contacto_id
       and (c.cliente_id = (select auth.uid()) or c.maestro_id = (select auth.uid()))
  ));

-- Se escribe como uno mismo, en un contacto propio y que no esté cerrado.
drop policy if exists mensajes_insert_participante on public.mensajes;
create policy mensajes_insert_participante on public.mensajes
  for insert to authenticated
  with check (
    emisor_id = (select auth.uid())
    and exists (
      select 1 from public.contactos c
       where c.id = contacto_id
         and c.estado <> 'cerrado'
         and (c.cliente_id = (select auth.uid()) or c.maestro_id = (select auth.uid()))
    )
  );

-- 9. resenas ----------------------------------------------------------------------------
-- Escribe el cliente del contacto (el trigger exige servicio confirmado, RB-2).
-- La lectura pública de reseñas/promedio (CI-2) debe hacerla una vista o función
-- security definer, porque un visitante no tiene acceso a `contactos`.

drop policy if exists resenas_select_participante on public.resenas;
create policy resenas_select_participante on public.resenas
  for select to authenticated
  using (exists (
    select 1 from public.contactos c
     where c.id = resenas.contacto_id
       and (c.cliente_id = (select auth.uid()) or c.maestro_id = (select auth.uid()))
  ));

drop policy if exists resenas_insert_cliente on public.resenas;
create policy resenas_insert_cliente on public.resenas
  for insert to authenticated
  with check (exists (
    select 1 from public.contactos c
     where c.id = contacto_id and c.cliente_id = (select auth.uid())
  ));

drop policy if exists resenas_select_admin on public.resenas;
create policy resenas_select_admin on public.resenas
  for select to authenticated using (public.es_admin());

-- 10. auditoria: solo lectura para admin -----------------------------------------------

drop policy if exists auditoria_select_admin on public.auditoria;
create policy auditoria_select_admin on public.auditoria
  for select to authenticated using (public.es_admin());

-- 11. Storage: buckets privados «cedulas» y «certificados» -----------------------------
-- Convención de ruta: <maestro_id>/<archivo>. La primera carpeta es el dueño.
-- Los archivos no se borran por SQL: Storage lo prohíbe (hay que usar su API con
-- service_role; ver pendiente «borrado de la cédula al aprobar»).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cedulas',      'cedulas',      false, 5242880, array['image/jpeg', 'image/png', 'application/pdf']),
  ('certificados', 'certificados', false, 5242880, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists documentos_storage_insert_propio on storage.objects;
create policy documentos_storage_insert_propio on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('cedulas', 'certificados')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.rol_actual() = 'maestro'
  );

drop policy if exists documentos_storage_select_propio on storage.objects;
create policy documentos_storage_select_propio on storage.objects
  for select to authenticated
  using (
    bucket_id in ('cedulas', 'certificados')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists documentos_storage_admin on storage.objects;
create policy documentos_storage_admin on storage.objects
  for all to authenticated
  using (bucket_id in ('cedulas', 'certificados') and public.es_admin())
  with check (bucket_id in ('cedulas', 'certificados') and public.es_admin());