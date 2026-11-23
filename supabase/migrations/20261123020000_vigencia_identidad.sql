
-- MasterPlace · Vigencia de identidad de maestros (90 días).
--
-- Agrega vencimiento de identidad, actualiza la aprobación,
-- excluye identidades vencidas de la visibilidad pública y
-- permite reactivar la moderación al subir una nueva cédula.
--
-- No modifica las migraciones anteriores.

-- 1. Fecha de vencimiento de la identidad.
ALTER TABLE public.maestros
ADD COLUMN IF NOT EXISTS identidad_vence_en timestamptz;

COMMENT ON COLUMN public.maestros.identidad_vence_en IS
  'Fecha y hora en que vence la verificación de identidad. Cada aprobación concede 90 días.';

-- Los maestros que ya estaban verificados reciben 90 días
-- desde la aplicación de esta migración.
UPDATE public.maestros
SET identidad_vence_en = now() + interval '90 days'
WHERE estado_identidad = 'verificada'
  AND identidad_vence_en IS NULL;

-- 2. Actualizar el trigger que procesa aprobaciones y rechazos.
CREATE OR REPLACE FUNCTION public.documentos_despues_de_revisar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo = 'cedula' THEN
    UPDATE public.maestros
    SET estado_identidad = (
          CASE NEW.estado
            WHEN 'aprobado' THEN 'verificada'
            ELSE 'rechazada'
          END
        )::public.estado_identidad,
        identidad_vence_en = CASE
          WHEN NEW.estado = 'aprobado'
            THEN now() + interval '90 days'
          ELSE NULL
        END
    WHERE id = NEW.maestro_id;
  ELSE
    UPDATE public.maestros
    SET certificado_ok = (NEW.estado = 'aprobado')
    WHERE id = NEW.maestro_id;
  END IF;

  RETURN NULL;
END;
$$;

-- 3. Actualizar la función de revisión de identidad.
-- Se conserva la lógica original de aprobación, rechazo y auditoría.
CREATE OR REPLACE FUNCTION public.revisar_identidad(
  p_documento_id uuid,
  p_aprobar      boolean,
  p_motivo       text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc    public.documentos;
  v_motivo text := nullif(
    regexp_replace(btrim(coalesce(p_motivo, '')), '\s+', ' ', 'g'),
    ''
  );
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede revisar identidades'
      USING errcode = '42501';
  END IF;

  SELECT *
  INTO v_doc
  FROM public.documentos
  WHERE id = p_documento_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El documento no existe';
  END IF;

  IF v_doc.tipo <> 'cedula' THEN
    RAISE EXCEPTION 'Solo se revisan cédulas con esta función';
  END IF;

  IF v_doc.estado <> 'pendiente' THEN
    RAISE EXCEPTION 'Este documento ya fue revisado';
  END IF;

  IF NOT p_aprobar
     AND char_length(coalesce(v_motivo, '')) NOT BETWEEN 10 AND 300 THEN
    RAISE EXCEPTION 'El rechazo necesita un motivo de 10 a 300 caracteres';
  END IF;

  UPDATE public.documentos
  SET estado = CASE
        WHEN p_aprobar THEN 'aprobado'
        ELSE 'rechazado'
      END::public.estado_revision,
      ruta_archivo = CASE
        WHEN p_aprobar THEN NULL
        ELSE ruta_archivo
      END,
      revisor_id = (SELECT auth.uid()),
      revisado_en = now()
  WHERE id = v_doc.id;

  INSERT INTO public.auditoria (actor_id, accion, objeto)
  VALUES (
    (SELECT auth.uid()),
    CASE
      WHEN p_aprobar THEN 'aprobar_cedula'
      ELSE 'rechazar_cedula'
    END,
    'documento:' || v_doc.id || ' maestro:' || v_doc.maestro_id
      || CASE
           WHEN p_aprobar THEN ''
           ELSE ' motivo: ' || v_motivo
         END
  );

  RETURN v_doc.ruta_archivo;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.revisar_identidad(uuid, boolean, text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.revisar_identidad(uuid, boolean, text)
TO authenticated;

COMMENT ON FUNCTION public.revisar_identidad(uuid, boolean, text) IS
  'RF-2/RF-8: el admin aprueba o rechaza una cédula pendiente. Al aprobar concede 90 días de vigencia; al rechazar limpia el vencimiento. Registra la revisión en auditoría y devuelve la ruta del archivo.';


-- 4. Reactivar la moderación cuando un maestro vencido
-- sube una nueva cédula.
CREATE OR REPLACE FUNCTION public.reabrir_identidad_vencida()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.tipo = 'cedula'::public.tipo_documento THEN
    UPDATE public.maestros
    SET estado_identidad = 'pendiente'::public.estado_identidad,
        identidad_vence_en = NULL
    WHERE id = NEW.maestro_id
      AND (
        -- Permite volver a presentar una cédula rechazada.
        estado_identidad = 'rechazada'::public.estado_identidad

        OR

        -- Permite renovar una identidad vencida.
        (
          estado_identidad = 'verificada'::public.estado_identidad
          AND (
            identidad_vence_en IS NULL
            OR identidad_vence_en <= now()
          )
        )
      );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reabrir_identidad_vencida()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS documentos_reabrir_identidad_vencida
ON public.documentos;

-- Evita crear contactos nuevos con maestros cuya identidad venció.
CREATE OR REPLACE FUNCTION public.crear_o_reutilizar_contacto(
  p_maestro_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cliente_id uuid := auth.uid();
  v_contacto_id uuid;
  v_maestro_id uuid;
BEGIN
  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION USING
      MESSAGE = 'USUARIO_NO_AUTENTICADO',
      ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.perfiles p
    WHERE p.id = v_cliente_id
      AND p.rol = 'cliente'::public.rol_usuario
  ) THEN
    RAISE EXCEPTION USING
      MESSAGE = 'SOLO_CLIENTE',
      ERRCODE = '42501';
  END IF;

  SELECT m.id
  INTO v_maestro_id
  FROM public.maestros m
  WHERE m.id = p_maestro_id
    AND m.estado_identidad = 'verificada'::public.estado_identidad
    AND m.identidad_vence_en > now()
    AND m.disponible = true
  FOR SHARE;

  IF v_maestro_id IS NULL THEN
    RAISE EXCEPTION USING
      MESSAGE = 'MAESTRO_NO_CONTACTABLE',
      ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.contactos AS contacto (
    cliente_id,
    maestro_id
  )
  VALUES (
    v_cliente_id,
    v_maestro_id
  )
  ON CONFLICT (cliente_id, maestro_id)
    WHERE (estado = 'abierto'::public.estado_contacto)
  DO UPDATE SET creado_en = contacto.creado_en
  RETURNING contacto.id INTO v_contacto_id;

  RETURN v_contacto_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crear_o_reutilizar_contacto(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.crear_o_reutilizar_contacto(uuid)
TO authenticated;

COMMENT ON FUNCTION public.crear_o_reutilizar_contacto(uuid) IS
  'RF-4: crea o reutiliza un contacto abierto con un maestro verificado, vigente y disponible.';

CREATE TRIGGER documentos_reabrir_identidad_vencida
AFTER INSERT ON public.documentos
FOR EACH ROW
EXECUTE FUNCTION public.reabrir_identidad_vencida();

COMMENT ON FUNCTION public.reabrir_identidad_vencida() IS
  'Cuando un maestro con identidad vencida sube una nueva cédula, devuelve su identidad a pendiente para revisión administrativa.';


-- 5. Actualizar la visibilidad pública de maestros.
DROP POLICY IF EXISTS maestros_select_publico ON public.maestros;

CREATE POLICY maestros_select_publico
ON public.maestros
FOR SELECT TO anon, authenticated
USING (
  estado_identidad = 'verificada'
  AND identidad_vence_en > now()
);


-- 6. Actualizar la visibilidad pública de perfiles de maestros.
DROP POLICY IF EXISTS perfiles_select_maestro_publico ON public.perfiles;

CREATE POLICY perfiles_select_maestro_publico
ON public.perfiles
FOR SELECT TO anon, authenticated
USING (
  rol = 'maestro'
  AND EXISTS (
    SELECT 1
    FROM public.maestros m
    WHERE m.id = perfiles.id
      AND m.estado_identidad = 'verificada'
      AND m.identidad_vence_en > now()
  )
);


-- 7. Impedir nuevos contactos con maestros cuya identidad venció.
DROP POLICY IF EXISTS contactos_insert_cliente ON public.contactos;

CREATE POLICY contactos_insert_cliente
ON public.contactos
FOR INSERT TO authenticated
WITH CHECK (
  cliente_id = (SELECT auth.uid())
  AND public.rol_actual() = 'cliente'
  AND EXISTS (
    SELECT 1
    FROM public.maestros m
    WHERE m.id = maestro_id
      AND m.estado_identidad = 'verificada'
      AND m.identidad_vence_en > now()
  )
);


-- 8. Actualizar la búsqueda SQL para excluir identidades vencidas.
CREATE OR REPLACE FUNCTION public.buscar_maestros(
  p_oficio_id integer,
  p_comuna_id integer,
  p_lat double precision,
  p_lng double precision
)
RETURNS TABLE (
  id                 uuid,
  nombre             text,
  oficio             text,
  descripcion        text,
  anios_experiencia  smallint,
  disponible         boolean,
  certificado_ok     boolean,
  nivel_reputacion   boolean,
  lat                double precision,
  lng                double precision,
  distancia_km       double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  WITH punto AS (
    SELECT st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography AS g
  )
  SELECT
    m.id,
    p.nombre,
    o.nombre AS oficio,
    m.descripcion,
    m.anios_experiencia,
    m.disponible,
    m.certificado_ok,
    m.nivel_reputacion,
    st_y(m.referencia::geometry) AS lat,
    st_x(m.referencia::geometry) AS lng,
    st_distance(m.referencia, punto.g) / 1000.0 AS distancia_km
  FROM public.maestros m
  JOIN public.perfiles p ON p.id = m.id
  JOIN public.oficios o ON o.id = m.oficio_id
  CROSS JOIN punto
  WHERE m.estado_identidad = 'verificada'
    AND m.identidad_vence_en > now()
    AND (p_oficio_id IS NULL OR m.oficio_id = p_oficio_id)
    AND EXISTS (
      SELECT 1
      FROM public.coberturas c
      WHERE c.maestro_id = m.id
        AND c.comuna_id = p_comuna_id
    )
  ORDER BY distancia_km ASC, m.id;
$$;

REVOKE ALL ON FUNCTION public.buscar_maestros(
  integer, integer, double precision, double precision
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.buscar_maestros(
  integer, integer, double precision, double precision
) TO anon, authenticated;

COMMENT ON FUNCTION public.buscar_maestros(
  integer, integer, double precision, double precision
) IS
  'RF-3/CI-1: maestros verificados y con identidad vigente que cubren la comuna, ordenados por distancia geodésica WGS84. SECURITY INVOKER: respeta RLS.';
