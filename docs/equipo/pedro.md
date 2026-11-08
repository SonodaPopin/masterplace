# Pedro Gajardo · Arquitectura y liderazgo técnico

**Objetivo para el 17-11:** búsqueda de maestros por oficio, comuna y cercanía (RF-3) resuelta en PostGIS, y CI-1
desarrollada con resultados que muestren cuánto difiere Haversine de PostGIS.

| Día | Tarea | Commit esperado |
|---|---|---|
| lun 9 | Revisar con Ignacio el esquema (índice GiST, tipos `geography`). Escribir ADR-001 definitivo con la matriz de E2 | `docs(adr): ADR-001 arquitectura ALT-2` |
| mar 10 | Implementar `haversineKm` en `src/lib/geo/haversine.ts` y reemplazar los `it.todo` por pruebas reales | `feat(ci1): haversine con pruebas` |
| mié 11 | Migración con la función SQL `buscar_maestros(oficio_id, comuna_id, lat, lng)`: filtra cobertura y verificados, ordena por `ST_Distance` y devuelve los km | `db(busqueda): función buscar_maestros con PostGIS` |
| jue 12 | Conectar `Busqueda.tsx` a la función (filtros y lista). Gabriel monta el mapa sobre el mismo resultado | `feat(busqueda): filtros y lista de resultados` |
| vie 13 | **CI-1 resultados:** 10 pares de puntos reales del piloto; tabla Haversine vs PostGIS con error relativo; comprobar la tolerancia de 1 %. Medir el tiempo de la consulta (insumo de RNF-2) | `docs(ci1): resultados y error relativo` |
| sáb 14 | Revisar PR pendientes; apoyar la integración y los defectos de la Integración 2 | `fix(...)` |
| dom 15 | Escribir `docs/ciencias/CI-1_distancia.md` completo: formulación, supuestos, procedimiento, resultados, decisión e influencia en el sistema | `docs(ci1): desarrollo completo` |
| lun 16 | Diapositivas de arquitectura y CI-1; ensayo de la demo con Joaquín | — |

**Dependes de:** Ignacio (comunas con centroide y maestros de prueba con `referencia`).
**Entregas a:** Gabriel (resultados para el mapa), Hugo (tiempo de consulta para TNF-02).

**En la presentación:** narras la demo (C2) y presentas CI-1 (C3, ~1 min).

**Terminado cuando:** una búsqueda en la URL pública devuelve solo maestros verificados de esa comuna, ordenados por
distancia, y `docs/ciencias/CI-1_distancia.md` tiene la tabla de resultados.

**Como líder técnico:** revisas los PR de Ignacio y desbloqueas a quien lleve más de medio día detenido.
