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
2. Elegir 10 pares de puntos reales del piloto (por ejemplo, centros de las 6 comunas).
3. Calcular cada par con Haversine y con `ST_Distance(geography)`.
4. Error relativo = |d_H − d_PostGIS| / d_PostGIS. Tolerancia de E1: 1 %.

## Resultados

| Par | Desde | Hasta | Haversine (km) | PostGIS (km) | Error relativo |
|---|---|---|---|---|---|
| 1 | | | | | |

## Decisión e influencia en el sistema

[Por ejemplo: como el error máximo fue X %, la búsqueda ordena con PostGIS en la base de datos (usa el índice GiST) y
Haversine queda como verificación en las pruebas. Tiempo de la consulta: Y ms.]
