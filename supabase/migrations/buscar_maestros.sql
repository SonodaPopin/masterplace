CREATE OR REPLACE FUNCTION buscar_maestros(
    p_oficio_id INT,          -- Cambiar a UUID si tu ID usa ese tipo
    p_comuna_id INT,          -- Cambiar a UUID si corresponde
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION
)
RETURNS TABLE (
    maestro_id INT,           -- ID del maestro
    nombre TEXT,              -- Nombre u otros campos que necesites retornar
    distancia_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id AS maestro_id,
        m.nombre,
        -- ST_Distance en 'geography' devuelve metros. Dividimos por 1000 para obtener km.
        -- Nota PostGIS: ST_MakePoint recibe primero la Longitud (X) y luego la Latitud (Y).
        ST_Distance(
            m.ubicacion::geography, 
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) / 1000.0 AS distancia_km
    FROM maestros m
    -- Relación con oficios
    JOIN maestro_oficios mo ON mo.maestro_id = m.id
    -- Relación de cobertura por comuna
    JOIN maestro_comunas mc ON mc.maestro_id = m.id
    WHERE mo.oficio_id = p_oficio_id
      AND mc.comuna_id = p_comuna_id
      AND m.verificado = TRUE
    ORDER BY distancia_km ASC;
END;
$$ LANGUAGE plpgsql;