-- Pruebas del borrado de cédula al aprobar. Requiere la semilla y todas las migraciones.
-- Termina con una excepción que deshace TODO; esperado: ninguna línea con FALLO.
do $$
declare
  r text := E'\n'; n int; v text; b boolean; t timestamptz;
  adm   uuid := 'f137c6e2-fcc8-5da3-8bdb-92484fb11eb9';  -- maestro03 (se promueve a admin)
  m_pen uuid := 'c74eca34-3a1b-5f30-9ea7-f8747f88005b';  -- maestro05 (identidad pendiente)
  m_otr uuid := '792b054a-4038-5069-a3e4-79b899409527';  -- maestro02
  d_ced uuid; d_cer uuid; d_rec uuid; ids bigint[];
begin
  update public.perfiles set rol = 'admin' where id = adm;
  insert into public.documentos (maestro_id, tipo, ruta_archivo) values (m_pen, 'cedula', m_pen||'/cedula.pdf') returning id into d_ced;
  insert into public.documentos (maestro_id, tipo, ruta_archivo) values (m_pen, 'certificado', m_pen||'/cert.pdf') returning id into d_cer;
  insert into public.documentos (maestro_id, tipo, ruta_archivo) values (m_otr, 'cedula', m_otr||'/cedula.pdf') returning id into d_rec;

  -- admin aprueba la cédula con un UPDATE directo (lo que haría el panel) -----------------
  perform set_config('request.jwt.claims', json_build_object('sub', adm)::text, true); set local role authenticated;
  update public.documentos set estado = 'aprobado' where id = d_ced;
  reset role;
  select ruta_archivo into v from public.documentos where id = d_ced;
  r := r || case when v is null then 'OK    ' else 'FALLO ' end || E'cédula aprobada: ruta_archivo queda en null\n';
  select count(*) into n from public.archivos_por_borrar where documento_id = d_ced and bucket = 'cedulas' and ruta = m_pen||'/cedula.pdf' and borrado_en is null;
  r := r || case when n = 1 then 'OK    ' else 'FALLO ' end || E'la ruta original queda en la cola de borrado\n';
  select count(*) into n from public.documentos where id = d_ced and revisor_id = adm and revisado_en is not null;
  r := r || case when n = 1 then 'OK    ' else 'FALLO ' end || E'se registra revisor y fecha\n';
  set constraints all immediate;   -- la auditoría es un trigger diferido: forzarlo para verla
  select count(*) into n from public.auditoria where accion = 'documento_aprobado' and objeto = 'cedula '||d_ced and actor_id = adm;
  r := r || case when n = 1 then 'OK    ' else 'FALLO ' end || E'auditoría registra la aprobación con el actor\n';
  select estado_identidad::text into v from public.maestros where id = m_pen;
  r := r || case when v = 'verificada' then 'OK    ' else 'FALLO ' end || E'el maestro pasa a verificada (ahora aparece en búsquedas)\n';

  -- aprobar de nuevo no duplica nada ----------------------------------------------------------
  reset role; update public.documentos set estado = 'aprobado' where id = d_ced;
  select count(*) into n from public.archivos_por_borrar where documento_id = d_ced;
  r := r || case when n = 1 then 'OK    ' else 'FALLO ' end || E'reaprobar no duplica la cola\n';
  select count(*) into n from public.auditoria where accion = 'documento_aprobado' and objeto = 'cedula '||d_ced;
  r := r || case when n = 1 then 'OK    ' else 'FALLO ' end || E'reaprobar no duplica la auditoría\n';

  -- certificado: conserva su ruta y no se encola --------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', adm)::text, true); set local role authenticated;
  update public.documentos set estado = 'aprobado' where id = d_cer;
  reset role;
  select ruta_archivo into v from public.documentos where id = d_cer;
  r := r || case when v = m_pen||'/cert.pdf' then 'OK    ' else 'FALLO ' end || E'certificado aprobado conserva su ruta (RB-8)\n';
  select count(*) into n from public.archivos_por_borrar where documento_id = d_cer;
  r := r || case when n = 0 then 'OK    ' else 'FALLO ' end || E'certificado no entra a la cola de borrado\n';
  select certificado_ok into b from public.maestros where id = m_pen;
  r := r || case when b then 'OK    ' else 'FALLO ' end || E'certificado aprobado activa certificado_ok\n';

  -- rechazo: el archivo se conserva (se borra a los 30 días, otra tarea) -------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', adm)::text, true); set local role authenticated;
  update public.documentos set estado = 'rechazado' where id = d_rec;
  reset role;
  select ruta_archivo into v from public.documentos where id = d_rec;
  r := r || case when v = m_otr||'/cedula.pdf' then 'OK    ' else 'FALLO ' end || E'cédula rechazada conserva su ruta\n';
  select count(*) into n from public.archivos_por_borrar where documento_id = d_rec;
  r := r || case when n = 0 then 'OK    ' else 'FALLO ' end || E'cédula rechazada no entra a la cola\n';
  select estado_identidad::text into v from public.maestros where id = m_otr;
  r := r || case when v = 'rechazada' then 'OK    ' else 'FALLO ' end || E'rechazo deja estado_identidad = rechazada\n';
  select count(*) into n from public.auditoria where accion = 'documento_rechazado' and objeto = 'cedula '||d_rec;
  r := r || case when n = 1 then 'OK    ' else 'FALLO ' end || E'auditoría registra el rechazo\n';

  -- un maestro sigue sin poder aprobarse ------------------------------------------------------------------
  insert into public.documentos (maestro_id, tipo, ruta_archivo) values (m_otr, 'certificado', m_otr||'/cert.pdf');
  perform set_config('request.jwt.claims', json_build_object('sub', m_otr)::text, true); set local role authenticated;
  begin update public.documentos set estado = 'aprobado' where maestro_id = m_otr and tipo = 'certificado';
        r := r || E'FALLO el dueño aprobó su propio documento\n';
  exception when insufficient_privilege then r := r || E'OK    el dueño no puede aprobar su documento\n'; end;
  reset role;

  -- la cola es invisible para la app ------------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', adm)::text, true); set local role authenticated;
  begin perform 1 from public.archivos_por_borrar; r := r || E'FALLO admin leyó la cola desde la app\n';
  exception when insufficient_privilege then r := r || E'OK    ni el admin ve la cola desde la app (solo service_role)\n'; end;
  begin perform public.confirmar_borrado_archivos(array[1]::bigint[]); r := r || E'FALLO authenticated confirmó borrados\n';
  exception when insufficient_privilege then r := r || E'OK    authenticated no puede ejecutar confirmar_borrado_archivos\n'; end;
  reset role; set local role anon;
  begin perform public.confirmar_borrado_archivos(array[1]::bigint[]); r := r || E'FALLO anon confirmó borrados\n';
  exception when insufficient_privilege then r := r || E'OK    anon no puede ejecutar confirmar_borrado_archivos\n'; end;
  reset role;

  -- el worker (service_role) confirma el borrado --------------------------------------------------------------
  set local role service_role;
  select array_agg(id) into ids from public.archivos_por_borrar where borrado_en is null;
  select public.confirmar_borrado_archivos(ids) into n;
  r := r || case when n = 1 then 'OK    ' else 'FALLO ' end || 'service_role confirma el borrado ('||n||E' archivo)\n';
  select public.confirmar_borrado_archivos(ids) into n;
  r := r || case when n = 0 then 'OK    ' else 'FALLO ' end || E'confirmar dos veces no repite\n';
  reset role;
  select count(*) into n from public.archivos_por_borrar where borrado_en is null;
  r := r || case when n = 0 then 'OK    ' else 'FALLO ' end || E'no quedan archivos pendientes\n';
  select count(*) into n from public.auditoria where accion = 'archivo_cedula_borrado';
  r := r || case when n = 1 then 'OK    ' else 'FALLO ' end || E'auditoría registra el borrado de archivos\n';
  select count(*) into n from public.auditoria where objeto ilike '%/%' or objeto ilike '%.pdf%';
  r := r || case when n = 0 then 'OK    ' else 'FALLO ' end || E'la auditoría no contiene rutas ni nombres de archivo\n';

  raise exception 'RESULTADOS (se deshace todo): %', r;
end $$;