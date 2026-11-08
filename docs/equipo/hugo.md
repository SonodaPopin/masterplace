# Hugo Flores · Calidad y pruebas

**Objetivo para el 17-11:** plan de pruebas ejecutado con cobertura reportada, RNF críticos medidos (RNF-2/RNF-6 con
TNF-02), CI-2 desarrollada, y la reseña (RF-5) funcionando.

| Día | Tarea | Commit esperado |
|---|---|---|
| lun 9 | Completar `docs/pruebas/plan_pruebas.md`: qué TC y TNF entran en E3, herramienta, datos y responsable | `docs(pruebas): plan para E3` |
| mar 10 | Implementar `promedioBayesiano` en `src/lib/reputacion/` y reemplazar los `it.todo` por pruebas reales (n = 0, 1, 5, 50) | `feat(ci2): promedio bayesiano con pruebas` |
| mié 11 | **CI-2 sensibilidad:** escenarios sintéticos con m = 1, 5 y 10; tabla y gráfico de cómo cambia el orden de los maestros. Decidir y justificar m | `docs(ci2): sensibilidad de m` |
| jue 12 | **RF-5 Reseña:** `NuevaResena.tsx` (confirmar servicio, calificación 1–5 y comentario). Rechazar la segunda reseña del mismo contacto (RB-7) | `feat(resenas): reseña única por contacto` |
| vie 13 | Ejecutar TC-01 a TC-05 sobre la Integración 2; registrar resultados y defectos en `docs/pruebas/registro_pruebas.md` | `test: TC-01 a TC-05 sobre la integración 2` |
| sáb 14 | **TNF-02:** prueba de carga con k6 (gratuito) o Artillery, 50 usuarios virtuales con la mezcla de §4.1 contra la API de búsqueda; registrar p95, máximo y errores. Registrar las sesiones de validación con Gabriel | `test(rnf): TNF-02 carga 50 usuarios` |
| dom 15 | `npm run test:coverage` y reporte; llenar `docs/pruebas/mediciones_rnf.md` con objetivo, método, obtenido y veredicto; escribir `docs/ciencias/CI-2_promedio_bayesiano.md` | `docs(pruebas): cobertura y RNF medidos` |
| lun 16 | Repetir TC-01 a TC-05 sobre la versión congelada; diapositivas de CI-2 y pruebas; ensayo | `test: regresión final` |

**Dependes de:** Joaquín (contacto creado), Ignacio (tabla `resenas` con RLS), Pedro (consulta de búsqueda para TNF-02).
**Entregas a:** todos (defectos registrados con responsable), Gabriel (registro de las sesiones).

**En la presentación:** CI-2 (C3, ~1 min) y pruebas y RNF medidos (C4, ~1 min).

**Terminado cuando:** la CI muestra la cobertura, cada RNF crítico tiene veredicto con su medición, y los defectos
tienen estado.
