-- MasterPlace · Validación con usuarios dentro de la app (docs/validacion/plan_validacion.md, cambio del 14-11)
-- Autor: Gabriel. Revisa: Ignacio (datos y seguridad).
--
-- Reemplaza el Google Form: cada participante recibe un enlace /prueba/<token> que lo guía por las tareas sobre la
-- app real y guarda sus respuestas y tiempos aquí, separados de las tablas del producto.
--
-- Seguridad:
--  * El token (24 caracteres hexadecimales aleatorios) es la única credencial del participante: no hay cuenta ni
--    datos personales. Quien no tiene el enlace no puede leer ni escribir nada.
--  * La app no lee ni escribe las tablas directamente (RLS sin políticas para anon y authenticated): solo usa
--    validacion_obtener() y validacion_guardar(), security definer, que exigen un token existente.
--  * Solo un admin puede leer las tablas desde la app; el análisis se hace en el SQL Editor.

-- 1. Tablas -------------------------------------------------------------------------------

create table if not exists public.validacion_participantes (
  token       text primary key check (token ~ '^[a-f0-9]{24}$'),
  codigo      text not null unique check (codigo ~ '^P[0-9]{1,3}$'),
  perfil      text not null check (perfil in ('maestro', 'cliente')),
  usuario_id  uuid references auth.users (id) on delete set null,  -- cuenta creada durante la prueba
  creado_en   timestamptz not null default now()
);

comment on table public.validacion_participantes is
  'Un enlace /prueba/<token> por participante de la validación con usuarios. Sin datos personales.';

create table if not exists public.validacion_respuestas (
  token           text not null references public.validacion_participantes (token) on delete cascade,
  clave           text not null check (clave ~ '^[a-z0-9_]{1,40}$'),
  valor           jsonb not null,
  actualizado_en  timestamptz not null default now(),
  primary key (token, clave)
);

comment on table public.validacion_respuestas is
  'Respuestas y marcas de tiempo de cada participante (clave = paso del guion, por ejemplo t1, t1_inicio, sus).';

alter table public.validacion_participantes enable row level security;
alter table public.validacion_respuestas    enable row level security;

revoke all on table public.validacion_participantes from anon, authenticated;
revoke all on table public.validacion_respuestas    from anon, authenticated;
grant select on table public.validacion_participantes to authenticated;
grant select on table public.validacion_respuestas    to authenticated;

drop policy if exists validacion_participantes_admin on public.validacion_participantes;
create policy validacion_participantes_admin on public.validacion_participantes
  for select to authenticated using (public.es_admin());

drop policy if exists validacion_respuestas_admin on public.validacion_respuestas;
create policy validacion_respuestas_admin on public.validacion_respuestas
  for select to authenticated using (public.es_admin());

-- 2. Leer el avance de un participante -----------------------------------------------------
-- Devuelve null si el token no existe. Permite retomar la prueba al recargar o desde otro aparato.

create or replace function public.validacion_obtener(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
           'codigo', p.codigo,
           'perfil', p.perfil,
           'respuestas', coalesce(
             (select jsonb_object_agg(r.clave, r.valor)
                from public.validacion_respuestas r
               where r.token = p.token),
             '{}'::jsonb))
    from public.validacion_participantes p
   where p.token = p_token;
$$;

revoke execute on function public.validacion_obtener(text) from public;
grant  execute on function public.validacion_obtener(text) to anon, authenticated;

-- 3. Guardar una respuesta ----------------------------------------------------------------
-- Inserta o reemplaza la respuesta de un paso. Si quien llama tiene sesión (la cuenta que creó en la prueba), la
-- vincula al participante para verificar en la base las tareas T1, T2 y T4.

create or replace function public.validacion_guardar(p_token text, p_clave text, p_valor jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.validacion_participantes where token = p_token) then
    raise exception 'ENLACE_INVALIDO' using errcode = 'P0001';
  end if;

  if p_clave is null or p_clave !~ '^[a-z0-9_]{1,40}$' or p_valor is null or pg_column_size(p_valor) > 8192 then
    raise exception 'RESPUESTA_INVALIDA' using errcode = '22023';
  end if;

  -- Límite de claves por participante: el guion usa menos de 30.
  if (select count(*) from public.validacion_respuestas where token = p_token) >= 100
     and not exists (select 1 from public.validacion_respuestas where token = p_token and clave = p_clave) then
    raise exception 'DEMASIADAS_RESPUESTAS' using errcode = '54000';
  end if;

  insert into public.validacion_respuestas (token, clave, valor)
  values (p_token, p_clave, p_valor)
  on conflict (token, clave) do update
    set valor = excluded.valor, actualizado_en = now();

  if auth.uid() is not null then
    update public.validacion_participantes
       set usuario_id = auth.uid()
     where token = p_token and (usuario_id is null or usuario_id <> auth.uid());
  end if;
end;
$$;

revoke execute on function public.validacion_guardar(text, text, jsonb) from public;
grant  execute on function public.validacion_guardar(text, text, jsonb) to anon, authenticated;

comment on function public.validacion_guardar(text, text, jsonb) is
  'Guarda la respuesta de un paso de la prueba con usuarios. Solo con un token válido; vincula la cuenta si hay sesión.';
