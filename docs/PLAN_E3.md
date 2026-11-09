# Plan hacia el Avance Oral 2 (R3) · martes 17 de noviembre de 2026

## Punto de partida (8-11-2026)

- E1 entregado y con retroalimentación de la profesora. Las correcciones están en el documento
  "MasterPlace · Correcciones a la Entrega 1".
- E2 (Avance Oral 1) con la elección de ALT-2 (React + TypeScript + Supabase).
- **Todavía no hay código.** [CONFIRMAR si se hizo alguna entrevista de concepto después de E1.] La Gantt de E1 situaba la Iteración 1 (cuentas y
  verificación) entre el 12-10 y el 01-11, y E3 entre el 23-11 y el 06-12. Como E3 se adelantó al 17-11 y el código
  no ha empezado, tenemos 8 días para construir el flujo Must. Esta replanificación se informa en R3-C6.

## Qué evalúa R3 y cómo lo cubrimos

| Criterio R3 | Peso | Qué hay que mostrar | Evidencia en el repositorio | Responsable |
|---|---|---|---|---|
| C1 Respuesta a la PDR e iteración | 18 % | Cada observación de E1/E2 con qué cambió y por qué; ≥2 iteraciones con disparador, alternativas, decisión y efecto verificado | `docs/gestion/bitacora_iteraciones.md`, `docs/decisiones/` | Diego |
| C2 Construcción y demo en vivo | 18 % | Flujo principal en vivo con datos persistentes; mayoría de los Must; historial distribuido y CI funcionando | App en Vercel, GitHub Actions en verde, commits de los seis | Pedro y Joaquín |
| C3 Ciencias de la ingeniería | 14 % | CI-1 y CI-2 con formulación, supuestos, procedimiento, resultados y cómo influyeron en el sistema | `docs/ciencias/`, `src/lib/geo`, `src/lib/reputacion` | Pedro (CI-1), Hugo (CI-2) |
| C4 Pruebas y medición de RNF | 16 % | Pruebas unitarias e integración con cobertura; RNF críticos medidos con valor objetivo, método, valor obtenido y veredicto | `docs/pruebas/` | Hugo e Ignacio |
| C5 Validación con usuarios | 12 % | ≥5 participantes externos, instrumento, datos, análisis y límites | `docs/validacion/` | Gabriel |
| C6 Costos, riesgos y replanificación | 10 % | Costo estimado versus ejecutado (horas y dinero), riesgos materializados y plan de las semanas restantes | `docs/gestion/` | Joaquín y Diego |
| C7 Comunicación oral | 12 % | 12 minutos, todos exponen, demo con guion | Guion de demo en `docs/pruebas/guion_demo.md` | Todos |

## Hitos de integración

| Día | Fecha | Hito (al final del día) |
|---|---|---|
| D1 | lun 9-11 | Repo en GitHub con los seis como colaboradores; proyecto Supabase creado; esquema aplicado; todos corren `npm run dev` |
| D2 | mar 10-11 | **Reunión de equipo** (acta). Registro e inicio de sesión funcionando; semilla con 6 comunas y 5 oficios; RLS básicas |
| D3 | mié 11-11 | **Integración 1:** registro de maestro con cédula al bucket privado; búsqueda por comuna devuelve maestros verificados |
| D4 | jue 12-11 | Panel de moderación aprueba y borra la cédula; mapa con marcadores y lista; contacto crea conversación |
| D5 | vie 13-11 | **Integración 2:** flujo completo en Vercel (registro → verificación → búsqueda → contacto → chat). Reseña básica. A las 20:00 se envía el formulario de validación |
| D6 | sáb 14-11 | Respuestas de la validación remota (recordatorio a mediodía); mediciones TNF-01 y TNF-02 |
| D7 | dom 15-11 | Cierre de la validación a las 20:00 y verificación en la base; correcciones de defectos críticos; resultados CI-1 y CI-2 |
| D8 | lun 16-11 | **Congelar código a las 18:00.** Diapositivas, guion de demo, ensayo completo cronometrado |
| E3 | mar 17-11 | Presentación |

Si un hito se atrasa más de un día, se recorta en este orden: RF-5 reseña → mapa (queda la lista) → Realtime (el chat
recarga al enviar). Nunca se recortan las políticas RLS ni el borrado de la cédula.

## Ruta crítica

```
Esquema + RLS (Ignacio, D1–D2) ─┬─> Registro y sesión (Gabriel, D2–D3) ─┬─> Moderación (Diego, D3–D4) ─┐
Supabase + Vercel + CI (Joaquín, D1) ┘                                    │                             ├─> Demo D5
                                Búsqueda PostGIS (Pedro, D2–D4) ──────────┴─> Contacto y chat (Joaquín, D3–D5) ┘
```

## Reparto propuesto de la presentación (12 min)

| Bloque | Tiempo | Quién |
|---|---|---|
| Problema en una frase y respuesta a la PDR, iteraciones (C1) | 2:00 | Diego |
| Demo en vivo del flujo principal (C2) | 3:00 | Joaquín conduce, Pedro narra |
| CI-1 distancia y CI-2 promedio bayesiano (C3) | 2:00 | Pedro y Hugo |
| Pruebas, cobertura, RNF medidos y seguridad RLS (C4) | 2:00 | Hugo e Ignacio |
| Validación con usuarios (C5) | 1:30 | Gabriel |
| Costos, riesgos y replanificación (C6) | 1:30 | Joaquín y Diego |

Es una propuesta: confirmarla en la reunión del martes 10-11 y registrar el acuerdo en el acta.

## Rutina diaria

1. Al empezar: `git switch main && git pull` y luego crear la rama del día.
2. Mensaje en el grupo antes de las 22:00: *qué hice, qué haré mañana, qué me bloquea*.
3. Al menos un commit y un PR (o una revisión de PR) por día.
4. Registrar las horas del día en `docs/gestion/registro_horas.md` (insumo de R3-C6 y R6).
