# Replanificación post E3

Insumo de R3-C6 (10 %): *"costo estimado versus ejecutado, riesgos materializados y plan de las semanas restantes"*.
Responsable: Diego, con los costos de Joaquín (`costos.md`) y las horas de todos (`registro_horas.md`).

> BORRADOR del 13-11. Completar las horas el 14-11, cuando todos las hayan registrado, y las fechas de E4 y E5.

## 1. Qué cambió respecto del plan de E1

| Aspecto | Plan de E1 | Real | Causa |
|---|---|---|---|
| Inicio de la implementación | 12-10 (Iteración 1: cuentas y verificación) | 09-11 | [Completar: por qué no se empezó antes] |
| Fecha de E3 | Entre el 23-11 y el 06-12 | 17-11 (adelantada) | Calendario del curso |
| Tiempo para el flujo Must | 4 semanas | 8 días | Las dos causas anteriores (riesgo R-09, materializado) |
| Base de esfuerzo | 300 h-persona (5 h/semana) | 2.400 h-persona (40 h/semana) | Observación O1 de E2 |

## 2. Horas estimadas versus registradas

Base corregida tras E2: 6 personas × 40 h × 10 semanas = 2.400 h-persona, o sea 240 h por semana para el equipo
y 40 h por persona.

| Integrante | Estimado S6 (9 al 15-11) | Registrado | Diferencia | Principal tarea |
|---|---|---|---|---|
| Diego | 40 h | [ ] | [ ] | Bitácora, panel de moderación, replanificación |
| Gabriel | 40 h | [ ] | [ ] | Registro, búsqueda y validación |
| Hugo | 40 h | [ ] | [ ] | Pruebas y CI-2 |
| Ignacio | 40 h | [ ] | [ ] | Esquema, RLS y semilla |
| Joaquín | 40 h | [ ] | [ ] | Supabase, Vercel y chat |
| Pedro | 40 h | [ ] | [ ] | Búsqueda PostGIS y CI-1 |
| **Total** | **240 h** | **[ ]** | **[ ]** | |

Valor a $5.000 por hora: estimado $1.200.000 por semana; ejecutado [horas registradas × $5.000].

**Lectura:** [Completar. Por ejemplo: "registramos X h (Y % de lo estimado). La diferencia se explica porque el
equipo trabaja en paralelo con otras asignaturas: 40 h es la estimación de un proyecto real, no la dedicación de un
curso. Por eso el plan para E4 y E5 se hace con las horas que realmente registramos por semana, no con 240 h."]

## 3. Riesgos materializados

| Riesgo | Qué pasó | Acción aplicada | Efecto |
|---|---|---|---|
| R-09 Calendario | E3 adelantada sin código iniciado | Plan de 8 días con orden de recorte (`PLAN_E3.md`) | Integración 2 incompleta el 13-11 (Iteración 3 de la bitácora) |
| R-01 Técnica | Dependencias en cadena: RLS → registro → moderación → búsqueda → chat | Respaldos para no bloquear: búsqueda sin PostGIS y verificación con función en la base | RF-3 funciona sin `buscar_maestros` |
| R-03 Validación | [Completar el 15-11 con cuántas respuestas llegaron] | | |
| [Otro] | | | |

## 4. Qué se compromete y qué queda fuera

Criterio: primero lo que exige la evaluación y lo que protege datos personales (RLS, borrado de la cédula); después
los Must que faltan; los Should solo si sobra tiempo según las horas reales registradas.

| Hito | Se compromete | Queda fuera y por qué |
|---|---|---|
| E3 (17-11) | Flujo registro → verificación → búsqueda → contacto → chat; TNF-01; validación con ≥5 usuarios; CI-1 y CI-2 | [Según la Iteración 3: reseña, mapa o Realtime si no alcanzan] |
| E4 ([fecha]) | Lo que no alcanzó en E3; RF-6 (Nivel 2 por reseñas); RF-12 y RF-8 (denuncias y su moderación); RF-9 (editar perfil); `buscar_maestros` con PostGIS si no está | RF-13 (notificaciones), por ser el Should de menor valor para la confianza |
| E5 ([fecha]) | RF-7 (certificado, Nivel 3); RF-13; mejoras de la validación; medición de disponibilidad completa (RNF-4) | Pagos y cualquier servicio con costo sobre $30.000 al mes (riesgo R-08) |

## 5. Gantt hasta E5

```
Semana        S6 09-15 nov  S7 16-22 nov  S8 23-29 nov  S9 30 nov-6 dic  S10 [ ]
E3            ████████      █ (17)
Correcciones                ████
RF-6 · RF-9                 ████████      ████
RF-12 · RF-8                              ████████      ████
E4                                                      █ ([fecha])
RF-7 · RF-13                                            ████████         ████
E5                                                                       █ ([fecha])
```

[Ajustar las semanas cuando se confirmen las fechas de E4 y E5, y los bloques según las horas reales por semana.]
