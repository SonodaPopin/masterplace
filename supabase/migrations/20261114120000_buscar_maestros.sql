CREATE OR REPLACE FUNCTION buscar_maestros(
    p_oficio_id INT,          -- O UUID según tu esquema
    p_comuna_id INT,          -- O UUID según tu esquema
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION
)
RETURNS TABLE (
    maestro_id INT,
    nombre TEXT,
    distancia_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id AS maestro_id,
        m.nombre,
        -- Cálculo de distancia geodésica sobre WGS84 convertido a kilómetros
        ST_Distance(
            m.ubicacion::geography, 
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) / 1000.0 AS distancia_km
    FROM maestros m
    JOIN coberturas c ON c.maestro_id = m.id
    WHERE m.oficio_id = p_oficio_id
      AND c.comuna_id = p_comuna_id
      AND m.estado_identidad = 'verificada'
    ORDER BY distancia_km ASC;
END;
$$ LANGUAGE plpgsql;