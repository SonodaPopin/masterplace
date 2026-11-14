# CI-1 · Distancia geográfica: Haversine frente a PostGIS

Responsable: Pedro. Resultados recalculados y verificados el 14-11-2026 con [ci1_distancias.sql](ci1_distancias.sql).
R3-C3 pide: formulación, supuestos, procedimiento, resultados y cómo influyó en el sistema.

## Formulación

Distancia de gran círculo sobre una esfera de radio R = 6.371 km, con φ = latitud y λ = longitud en radianes:

a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)
d = 2R · atan2(√a, √(1 − a))

PostGIS `ST_Distance` sobre `geography` calcula la distancia geodésica sobre el elipsoide WGS84 (más exacto, porque
la Tierra está achatada en los polos).

## Supuestos

- La distancia es en línea recta desde el punto de búsqueda hasta el punto de referencia declarado por el maestro; no
  representa ruta ni tiempo de viaje.
- Haversine aproxima la Tierra con una esfera; se esperaba un error frente al elipsoide menor a 0,5 %.
- Las distancias del piloto son cortas (≤ 25 km dentro del Gran Concepción), donde la diferencia entre esfera y
  elipsoide es pequeña.

## Procedimiento

1. Implementación en `src/lib/geo/haversine.ts`, con pruebas (`haversine.test.ts`): mismo punto = 0, simetría,
   rangos válidos y comparación con el valor de PostGIS del par 1.
2. Puntos: el punto de referencia de cada una de las 6 comunas del piloto, guardado en `comunas.centroide` por la
   semilla (`supabase/seed.sql`, coordenadas del infobox de Wikipedia consultado el 10-11-2026). Son los mismos
   puntos que usa la app al buscar «desde el centro» de una comuna. Se eligieron 10 de los 15 pares posibles.
3. Para cada par, [ci1_distancias.sql](ci1_distancias.sql) calcula en la base de datos la fórmula de Haversine
   (R = 6.371 km) y `ST_Distance(geography, geography)`, y el error relativo |d_H − d_PostGIS| / d_PostGIS.
   Tolerancia de E1: 1 %.
4. Comprobación cruzada: los valores de Haversine calculados en SQL coinciden al metro con los de `haversineKm()` en
   TypeScript para los mismos puntos.
5. Tiempo de la consulta de búsqueda (insumo de RNF-2): `EXPLAIN (ANALYZE)` de la consulta de `buscar_maestros`
   (gasfitería en Concepción, desde su punto de referencia), ejecutado 4 veces en el SQL Editor de Supabase.

## Resultados

| Par | Desde | Hasta | Punto desde (lat, lng) | Punto hasta (lat, lng) | Haversine (km) | PostGIS (km) | Error relativo |
|---|---|---|---|---|---|---|---|
| 1 | Concepción | Talcahuano | −36,82819, −73,05137 | −36,71667, −73,12194 | 13,903 | 13,888 | 0,111 % |
| 2 | Concepción | San Pedro de la Paz | −36,82819, −73,05137 | −36,84194, −73,10306 | 4,848 | 4,857 | 0,190 % |
| 3 | Concepción | Chiguayante | −36,82819, −73,05137 | −36,91700, −73,01700 | 10,337 | 10,321 | 0,160 % |
| 4 | Concepción | Penco | −36,82819, −73,05137 | −36,73861, −72,99389 | 11,200 | 11,187 | 0,109 % |
| 5 | Concepción | Hualpén | −36,82819, −73,05137 | −36,78833, −73,08667 | 5,434 | 5,431 | 0,054 % |
| 6 | Talcahuano | San Pedro de la Paz | −36,71667, −73,12194 | −36,84194, −73,10306 | 14,031 | 14,003 | 0,193 % |
| 7 | Talcahuano | Chiguayante | −36,71667, −73,12194 | −36,91700, −73,01700 | 24,155 | 24,123 | 0,134 % |
| 8 | Chiguayante | Penco | −36,91700, −73,01700 | −36,73861, −72,99389 | 19,942 | 19,904 | 0,194 % |
| 9 | Hualpén | Penco | −36,78833, −73,08667 | −36,73861, −72,99389 | 9,943 | 9,953 | 0,099 % |
| 10 | San Pedro de la Paz | Penco | −36,84194, −73,10306 | −36,73861, −72,99389 | 15,051 | 15,048 | 0,019 % |

**Error relativo máximo: 0,194 %. Promedio: 0,126 %.** Todos los pares quedan bajo la tolerancia de 1 % y bajo el
0,5 % supuesto. Haversine sobreestima en 8 de 10 pares y subestima en 2 (pares 2 y 9): el signo depende de la
dirección del trayecto respecto del achatamiento del elipsoide, no es un sesgo fijo.

**Tiempo de la consulta de búsqueda** (4 resultados, 4 ejecuciones): ejecución 55,8 – 63,0 ms (mediana ≈ 57,6 ms) y
planificación ≈ 35 ms. Es una cota superior: cada ejecución del SQL Editor abre su propia conexión, que incluye
cargar PostGIS. Aun así es unas 50 veces menor que la meta de p95 ≤ 3 s de RNF-2, que se medirá con carga en
TNF-02 (incluye red y concurrencia, que aquí no están).

## Decisión e influencia en el sistema

- **Haversine es suficiente para ordenar por cercanía en el piloto.** Con un error máximo de 0,194 % (menos de 50 m
  en el par más largo, de 24 km), dos maestros solo cambiarían de lugar si estuvieran a menos de ~0,2 % de distancia
  entre sí, una diferencia que el usuario no percibe. Por eso la app puede usar Haversine en el navegador como
  respaldo (`src/lib/busqueda/buscarMaestros.ts`) sin perder calidad en el orden de resultados.
- **La búsqueda principal usa PostGIS en la base de datos** (`buscar_maestros`, migración
  `20261114120000_buscar_maestros.sql`): filtra verificados y cobertura con RLS y ordena con `ST_Distance` sobre
  `geography`, que es más exacto y no depende del navegador. Cuando la función está aplicada, la app la usa; si no
  existe, cae al respaldo con Haversine y el resultado tiene la misma forma.
- **Estado al 14-11:** la función está probada en Supabase dentro de una transacción que se deshizo (devuelve los mismos
  4 maestros que el respaldo para gasfitería en Concepción, ordenados por distancia, y respeta RLS como visitante),
  pero no se aplicará en producción hasta que cierre la validación con usuarios (domingo 15 a las 20:00), para no
  cambiar la búsqueda durante la prueba. Hasta entonces la app publicada usa el respaldo con Haversine.

## Límites

- Se compararon puntos de referencia de comunas, no direcciones reales de maestros; las distancias reales de una
  búsqueda son en general más cortas (dentro de la misma comuna o vecinas), donde el error relativo es del mismo
  orden.
- El tiempo se midió con unos 50 maestros de prueba; con miles de maestros habrá que comprobar que el índice GiST
  (`maestros_referencia_gist`) se use y repetir la medición (TNF-02).
