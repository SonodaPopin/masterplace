SELECT
    rol,
    COUNT(*) AS cantidad
FROM public.perfiles
GROUP BY rol
ORDER BY rol;