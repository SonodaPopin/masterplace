-- MasterPlace · Esquema inicial (BORRADOR basado en E1 §5.1, Tabla 21)
-- Responsable: Ignacio (datos y seguridad). Revisar, ajustar y aplicar el lunes 9-11.
-- Todas las tablas parten con RLS activado y SIN políticas: nadie puede leer ni escribir
-- hasta que Ignacio agregue las políticas en 20261110000000_politicas_rls.sql.
-- Ya desplegado en vercel

create extension if not exists postgis;

-- Catálogos -----------------------------------------------------------------

create table public.comunas (
  id          smallint primary key,            -- código comunal (ej.: 8101 Concepción)
  nombre      text not null unique,
  region      text not null default 'Biobío',
  centroide   geography(point, 4326) not null  -- para el punto manual por comuna
);

create table public.oficios (
  id      smallserial primary key,
  nombre  text not null unique
);

-- Perfiles ------------------------------------------------------------------

create type public.rol_usuario as enum ('cliente', 'maestro', 'admin');

-- Datos comunes de toda cuenta; id = auth.users.id
create table public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  rol         public.rol_usuario not null,
  nombre      text not null check (char_length(nombre) between 2 and 80),
  telefono    text,
  comuna_id   smallint references public.comunas (id),
  creado_en   timestamptz not null default now()
);

create type public.estado_identidad as enum ('pendiente', 'verificada', 'rechazada');

-- Perfil público del maestro (lo que ve el cliente). Sin RUT ni documentos.
create table public.maestros (
  id                 uuid primary key references public.perfiles (id) on delete cascade,
  oficio_id          smallint not null references public.oficios (id),
  descripcion        text check (char_length(descripcion) <= 600),
  anios_experiencia  smallint check (anios_experiencia between 0 and 70),
  referencia         geography(point, 4326) not null,  -- punto declarado (no ubicación en vivo)
  disponible         boolean not null default true,
  estado_identidad   public.estado_identidad not null default 'pendiente',  -- Nivel 1
  nivel_reputacion   boolean not null default false,                         -- Nivel 2 (RF-6)
  certificado_ok     boolean not null default false                          -- Nivel 3 (RF-7)
);

create index maestros_referencia_gist on public.maestros using gist (referencia);

-- Datos privados del maestro, separados del perfil público (RNF-1, §5.3)
create table public.maestros_privado (
  id   uuid primary key references public.maestros (id) on delete cascade,
  rut  text not null unique
);

-- Cobertura declarada: N:M maestro–comuna (RB-9)
create table public.coberturas (
  maestro_id  uuid references public.maestros (id) on delete cascade,
  comuna_id   smallint references public.comunas (id),
  primary key (maestro_id, comuna_id)
);

-- Documentos y revisión (cédula = Nivel 1, certificado = Nivel 3) -----------

create type public.tipo_documento as enum ('cedula', 'certificado');
create type public.estado_revision as enum ('pendiente', 'aprobado', 'rechazado');

create table public.documentos (
  id            uuid primary key default gen_random_uuid(),
  maestro_id    uuid not null references public.maestros (id) on delete cascade,
  tipo          public.tipo_documento not null,
  ruta_archivo  text,                      -- ruta en bucket privado; null cuando se borra
  estado        public.estado_revision not null default 'pendiente',
  revisor_id    uuid references public.perfiles (id),
  revisado_en   timestamptz,
  creado_en     timestamptz not null default now()
);

-- Contactos, mensajes y reseñas ----------------------------------------------

create type public.estado_contacto as enum ('abierto', 'servicio_confirmado', 'cerrado');

create table public.contactos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.perfiles (id) on delete cascade,
  maestro_id  uuid not null references public.maestros (id) on delete cascade,
  estado      public.estado_contacto not null default 'abierto',
  creado_en   timestamptz not null default now(),
  cerrado_en  timestamptz
);

create table public.mensajes (
  id           bigserial primary key,
  contacto_id  uuid not null references public.contactos (id) on delete cascade,
  emisor_id    uuid not null references public.perfiles (id),
  contenido    text not null check (char_length(contenido) between 1 and 2000),
  enviado_en   timestamptz not null default now()
);

create index mensajes_contacto_idx on public.mensajes (contacto_id, enviado_en);

create table public.resenas (
  id            uuid primary key default gen_random_uuid(),
  contacto_id   uuid not null unique references public.contactos (id) on delete cascade,  -- RB-7
  calificacion  smallint not null check (calificacion between 1 and 5),
  comentario    text check (char_length(comentario) <= 1000),
  creada_en     timestamptz not null default now()
);

-- Auditoría de revisiones y borrados (sin documentos ni chat) ----------------

create table public.auditoria (
  id         bigserial primary key,
  actor_id   uuid references public.perfiles (id),
  accion     text not null,
  objeto     text not null,
  creada_en  timestamptz not null default now()
);

-- RLS activado en todo (deniega por defecto) -----------------------------------

alter table public.comunas           enable row level security;
alter table public.oficios           enable row level security;
alter table public.perfiles          enable row level security;
alter table public.maestros          enable row level security;
alter table public.maestros_privado  enable row level security;
alter table public.coberturas        enable row level security;
alter table public.documentos        enable row level security;
alter table public.contactos         enable row level security;
alter table public.mensajes          enable row level security;
alter table public.resenas           enable row level security;
alter table public.auditoria         enable row level security;

-- Pendiente (Ignacio): políticas RLS, buckets privados «cedulas» y «certificados»,
-- función es_admin(), borrado de la cédula al aprobar y semilla de datos ficticios.
-- Pendiente (Pedro): función buscar_maestros(oficio, comuna, punto) con ST_Distance.
-- Pendiente (Hugo): vista o función con el promedio bayesiano (CI-2).
