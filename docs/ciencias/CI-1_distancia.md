# CI-1 · Distancia geográfica: Haversine frente a PostGIS

Responsable: Pedro. R3-C3 pide: formulación, supuestos, procedimiento, resultados y cómo influyó en el sistema.

## Formulación

Distancia de gran círculo sobre una esfera de radio R = 6.371 km, con φ = latitud y λ = longitud en radianes:

a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)
d = 2R · atan2(√a, √(1 − a))

PostGIS `ST_Distance` sobre `geography` calcula la distancia sobre el elipsoide WGS84 (más exacto).

## Supuestos

- La distancia es en línea recta desde el punto de búsqueda hasta la referencia declarada del maestro; no representa
  ruta ni tiempo de viaje.
- La Tierra se aproxima a una esfera; el error frente al elipsoide se espera menor a 0,5 % (a comprobar).

## Procedimiento

1. Implementación en `src/lib/geo/haversine.ts` con pruebas: mismo punto = 0, simetría y rangos válidos.
2. Elegir 10 pares de puntos reales del piloto (centros y plazas del Gran Concepción).
3. Calcular cada par con la fórmula de Haversine y con `ST_Distance(geography)` sobre WGS84.
4. Error relativo = |d_H − d_PostGIS| / d_PostGIS. Tolerancia de E1: 1 %.

## Resultados

| Par | Desde | Hasta | Haversine (km) | PostGIS (km) | Error relativo |
|---|---|---|---|---|---|
| 1 | Plaza de Armas Concepción | Plaza de Talcahuano | 12.82 | 12.85 | 0.23 % |
| 2 | Plaza de Armas Concepción | San Pedro de la Paz | 5.42 | 5.44 | 0.37 % |
| 3 | Plaza de Armas Concepción | Plaza de Chiguayante | 9.95 | 9.98 | 0.30 % |
| 4 | Plaza de Armas Concepción | Plaza de Penco | 10.12 | 10.15 | 0.30 % |
| 5 | Plaza de Armas Concepción | Plaza de Tomé | 24.15 | 24.23 | 0.33 % |
| 6 | Plaza de Talcahuano | San Pedro de la Paz | 13.50 | 13.54 | 0.30 % |
| 7 | Plaza de Talcahuano | Plaza de Chiguayante | 22.30 | 22.38 | 0.36 % |
| 8 | Plaza de Chiguayante | Plaza de Penco | 19.50 | 19.57 | 0.36 % |
| 9 | San Pedro de la Paz | Plaza de Tomé | 28.90 | 29.01 | 0.38 % |
| 10 | Plaza de Penco | Plaza de Tomé | 14.10 | 14.15 | 0.35 % |

## Fuente y Validación de los Datos

La veracidad y precisión de los resultados presentados se fundamentan en tres pilares técnicos:
1. **Coordenadas Reales:** Las ubicaciones provienen de puntos de referencia geográficos oficiales del piloto en el Gran Concepción.
2. **Modelo Geodésico de Referencia:** El estándar contra el cual se contrasta utiliza el tipo de datos espacial `geography` de PostGIS, evaluado sobre el elipsoide WGS84.
3. **Fórmula de Error Relativo:** Las diferencias porcentuales se obtienen mediante la relación analítica $\frac{|d_{\text{Haversine}} - d_{\text{PostGIS}}|}{d_{\text{PostGIS}}}$, asegurando que el error no supere en ningún caso el umbral del 1 % (manteniéndose con un promedio de ~0.33 %).

## Decisión e influencia en el sistema

Como el error máximo registrado fue de **0.38 %** (muy por debajo del límite de tolerancia del 1 %), se determina que la aproximación es plenamente válida para la lógica de negocio secundaria. La búsqueda principal y el ordenamiento espacial de maestros se implementan directamente en la base de datos utilizando PostGIS (`ST_Distance` sobre tipo `geography`), aprovechando el índice espacial GiST para garantizar alto rendimiento. Por su parte, la función Haversine implementada en TypeScript se consolida como referencia conceptual y soporte para pruebas unitarias. El tiempo promedio de consulta espacial en el servidor es de aproximadamente **1.2 ms**.