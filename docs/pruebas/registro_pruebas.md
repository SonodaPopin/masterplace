# Registro de ejecución de pruebas y defectos

## Ejecuciones

| Fecha | Caso | Versión (commit) | Entorno | Resultado | Defectos | Ejecutó |
|---|---|---|---|---|---|---|
| 2026-11-15 | TC-03 | `c080948` (`main`, desplegado) | Vercel (https://masterplace.vercel.app) y API de Supabase como visitante; base de producción con las migraciones del 14-11 aplicadas | **Aprobado.** Gasfitería en Hualpén: 3 maestros, todos verificados y con cobertura en Hualpén; ordenados por distancia (`buscar_maestros`, PostGIS); el mismo conjunto que la base deja ver a un visitante. Con punto manual (toque en el mapa) el aviso cambia a «el punto que elegiste en el mapa» y las distancias se recalculan (5,1, 8,8 y 11 km). Con el permiso de ubicación denegado (simulado reemplazando `navigator.geolocation`) se muestra el aviso y la lista sigue con 3 resultados. No se simuló la caída del mapa: la lista es independiente del mapa y en móvil se puede usar sola («Lista») | — | Gabriel (con Claude) |

## Defectos

| ID | Fecha | Caso | Descripción | Severidad | Responsable | Estado |
|---|---|---|---|---|---|---|
| D-01 | | | | | | |
