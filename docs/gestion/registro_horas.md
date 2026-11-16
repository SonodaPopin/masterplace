# Registro de horas

Base corregida tras E2 (observación O1): **2.400 horas-persona** (6 integrantes × 40 h semanales × 10 semanas) valoradas
en $5.000 por hora. Reemplaza la base de E1 de 300 h-persona.
Cada uno agrega una fila por día trabajado. Sirve para comparar lo estimado con lo ejecutado (R3-C6, R4-C8) y como
evidencia de contribución (R6).

| Fecha | Integrante | Horas | Tarea | Enlace (PR, commit o documento) |
|---|---|---|---|---|
| 2026-11-08 | Gabriel | 4 (aprox.) | Preparación del repositorio, plan hacia E3 y tareas del equipo | `c8e5843` |
| 2026-11-09 | Gabriel | 3 (aprox.) | Plan e instrumento de validación; reglas de PR y despliegue | PR #4, PR #6 |
| 2026-11-10 | Gabriel | 4 (aprox.) | Registro de cliente, inicio de sesión, perfil al registrarse e identidad visual | PR #10 |
| 2026-11-11 | Gabriel | 5 (aprox.) | Registro de maestro en 3 pasos y mapa Leaflet de la búsqueda | PR #20, PR #25 |
| 2026-11-13 | Gabriel | 7 (aprox.) | Accesibilidad (TNF-06), carnet de prueba, cola de borrado de cédulas y prueba con usuarios dentro de la app | PR #26, #35, #39, #40 |
| 2026-11-14 | Gabriel | 2 (aprox.) | Arreglo de `buscar_maestros` y CI-1 reproducible; envío de enlaces de la validación | PR #42 |
| 2026-11-15 | Gabriel | 3 (aprox.) | Registro de invitaciones y análisis de resultados de la validación | PR #46 |
| 2026-11-09 a 15 | Gabriel | 5 (aprox.) | Trabajo en otro dispositivo, sin commits asociados | — |
| 2026-11-09 | Ignacio | 1 hora y 30 minutos aprox | Revisar el borrador supabase/migrations/20261109000000_esquema_inicial.sql |  |
| 2026-11-10 | Ignacio | 1 hora y 30 minutos aprox | Semilla: 6 comunas con código y centroides, 5 oficios, 15 maestros ficticios (3 por oficio) y 20 clientes. Creacion de función es_admin() | Update 20261109000000_esquema_inicial.sql |
| 2026-11-11 | Ignacio | 1 hora y 30 minutos aprox | db(rls): políticas por rol y participante | db(rls): políticas por rol y participante |
| 2026-11-13 | Ignacio | 3 hora y 30 minutos aprox | db(cedula): borrar archivo al aprobar y test(seguridad): TNF-01 accesos indebidos | Update jue 12 |
| 2026-11-14 | Ignacio | 1 hora y 30 minutos aprox | Corregir lo que falló en TNF-01 | Update viernes 13 |
| 2026-11-15 | Ignacio | 1 hora y 50 minutos aprox | Continuar comprobaciones en TNF-01 | Comprobaciones parciales TNF 1|
| 2026-11-10 | Diego | 1,5 | Revisión del plan y del repositorio; borrador de la bitácora y del panel de moderación | |
| 2026-11-11 | Diego | 1,5 | Observaciones de E2 en la bitácora y riesgo R-10; PR de documentos | PR #14 |
| 2026-11-13 | Diego | 3 | Función `revisar_identidad`, PR del panel; revisión del MVP, Iteración 3 y borrador de la replanificación | PR #28, PR #29 |
| 2026-11-14 | Diego | 1 | Prueba de los enlaces de validación y reclutamiento del participante P2 | |
| 2026-11-15 | Diego | 2 | Cierre de las iteraciones 1 a 3, replanificación y preguntas probables | |
| 2026-11-09 | Joaquín | 2 (estimado, a confirmar) | Proyecto Supabase, conexión con Vercel y primer despliegue | «deploy en vercel» |
| 2026-11-10 | Joaquín | 2 (estimado, a confirmar) | Rutas SPA en Vercel y monitor de disponibilidad (UptimeRobot) | PR #13 |
| 2026-11-12 | Joaquín | 4 (estimado, a confirmar) | RF-4 contacto y RF-11 chat (enviar y listar mensajes) | PR #22 |
| 2026-11-13 | Joaquín | 5 (estimado, a confirmar) | Chat en tiempo real y bandeja de contactos | PR #37 |
| 2026-11-09 a 15 | Joaquín | 2 (estimado, a confirmar) | Revisión e integración de PR de `premain` a `main` | PR #1 a #48 |
| 2026-11-10 | Hugo | 3 (estimado, a confirmar) | CI-2: promedio bayesiano con pruebas y análisis de sensibilidad | `87791bd`, `f67038a` |
| 2026-11-11 | Hugo | 2 (estimado, a confirmar) | Plan de pruebas para E3 | PR #18 |
| 2026-11-14 | Hugo | 5 (estimado, a confirmar) | RF-5 reseñas y perfil público del maestro, con pruebas | PR #43 |
| 2026-11-11 | Pedro | 2 (estimado, a confirmar) | `haversineKm` para CI-1 | `3ea2c93`, `22176d1` |
| 2026-11-13 | Pedro | 2 (estimado, a confirmar) | Función `buscar_maestros` con PostGIS | `5d6d2b7` |
| 2026-11-14 | Pedro | 4 (estimado, a confirmar) | Pruebas de Haversine, corrección de `buscar_maestros`, CI-1 y ADR-001 | `fe7c6be` a `52446a3` |

## Resumen semanal (lo completa Diego)

| Semana | Estimado (Gantt E1) | Registrado | Diferencia | Causa |
|---|---|---|---|---|
| S6 09–15 nov | 240 h | ≈ 82 h | ≈ −158 h | Ignacio y Diego registraron sus horas (20,3 h); las de Gabriel (29 h en S6) son una estimación propia, y las de Joaquín, Hugo y Pedro se estimaron el 15-11 desde sus commits y PR (a confirmar). No incluyen reuniones ni trabajo sin commit; ver `replanificacion.md` |
| S7 16–22 nov | 240 h | | | |
