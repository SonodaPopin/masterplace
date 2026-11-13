-- RF-11: habilita eventos INSERT de public.mensajes para Supabase Realtime.
-- Idempotente: no intenta volver a agregar la tabla si ya pertenece a la publicación.
do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'mensajes'
  ) then
    execute 'alter publication supabase_realtime add table public.mensajes';
  end if;
end;
$$;
