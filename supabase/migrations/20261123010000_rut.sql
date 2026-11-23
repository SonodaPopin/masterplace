
-- MasterPlace · RF: Validación de RUT de maestros.
-- Migración aditiva.
--
-- Contrato:
-- - Sin puntos.
-- - Un guion obligatorio.
-- - Cuerpo de 7 u 8 dígitos.
-- - Dígito verificador numérico o K mayúscula.
-- - Validación mediante módulo 11.
--
-- La vigencia de la cédula de 90 días queda fuera
-- de esta migración según PLAN_FINAL.md §7.

-- 1. Función de validación de RUT --------------------------------------------

CREATE OR REPLACE FUNCTION public.rut_valido(p_rut text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
STRICT
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
DECLARE
    v_numero text;
    v_dv text;
    v_suma integer := 0;
    v_factor integer := 2;
    v_resultado integer;
    v_dv_calculado text;
BEGIN
    -- Formato canónico: 7 u 8 dígitos, guion y DV.
    -- No acepta puntos, espacios ni k minúscula.
    IF p_rut !~ '^[1-9][0-9]{6,7}-[0-9K]$' THEN
        RETURN false;
    END IF;

    v_numero := split_part(p_rut, '-', 1);
    v_dv := split_part(p_rut, '-', 2);

    -- Multiplicadores 2, 3, 4, 5, 6, 7, desde la derecha.
    FOR v_i IN REVERSE length(v_numero)..1 LOOP
        v_suma := v_suma
            + substring(v_numero FROM v_i FOR 1)::integer * v_factor;

        v_factor := v_factor + 1;

        IF v_factor > 7 THEN
            v_factor := 2;
        END IF;
    END LOOP;

    -- Cálculo módulo 11.
    v_resultado := 11 - (v_suma % 11);

    v_dv_calculado := CASE v_resultado
        WHEN 11 THEN '0'
        WHEN 10 THEN 'K'
        ELSE v_resultado::text
    END;

    RETURN v_dv = v_dv_calculado;
END;
$$;

COMMENT ON FUNCTION public.rut_valido(text) IS
    'Valida RUT chileno sin puntos, con guion y DV en mayúscula, mediante módulo 11.';

-- 2. Comprobar los RUT existentes antes de agregar CHECK --------------------

DO $$
DECLARE
    v_invalidos bigint;
BEGIN
    SELECT count(*)
      INTO v_invalidos
      FROM public.maestros_privado
     WHERE public.rut_valido(rut) IS NOT TRUE;

    IF v_invalidos > 0 THEN
        RAISE EXCEPTION
            'No se puede agregar el CHECK: existen % RUT inválidos en maestros_privado. Revisar los registros antes de continuar.',
            v_invalidos;
    END IF;
END;
$$;

-- 3. Restricción de formato ---------------------------------------------------

ALTER TABLE public.maestros_privado
    ADD CONSTRAINT maestros_privado_rut_valido_check
    CHECK (public.rut_valido(rut));

-- Se conserva la restricción UNIQUE existente.
