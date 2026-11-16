# Replanificación post E3

Insumo de R3-C6 (10 %): *"costo estimado versus ejecutado, riesgos materializados y plan de las semanas restantes"*.
Responsable: Diego, con los costos de Joaquín (`costos.md`) y las horas de todos (`registro_horas.md`).

> Actualizado el 15-11. Pendiente: horas de Gabriel, Hugo, Joaquín y Pedro (si las registran antes del 17-11) y
> fechas de E4 y E5.

## 1. Qué cambió respecto del plan de E1

| Aspecto | Plan de E1 | Real | Causa |
|---|---|---|---|
| Inicio de la implementación | 12-10 (Iteración 1: cuentas y verificación) | 09-11 | La arquitectura (ALT-2) recién se eligió en E2, después de la fecha de inicio que suponía la Gantt de E1 |
| Fecha de E3 | Entre el 23-11 y el 06-12 | 17-11 (adelantada) | Calendario del curso |
| Tiempo para el flujo Must | 4 semanas | 8 días | Las dos causas anteriores (riesgo R-09, materializado) |
| Base de esfuerzo | 300 h-persona (5 h/semana) | 2.400 h-persona (40 h/semana) | Observación O1 de E2 |

## 2. Horas estimadas versus registradas

Base corregida tras E2: 6 personas × 40 h × 10 semanas = 2.400 h-persona, o sea 240 h por semana para el equipo
y 40 h por persona.

| Integrante | Estimado S6 (9 al 15-11) | Registrado | Diferencia | Principal tarea |
|---|---|---|---|---|
| Diego | 40 h | 9 h | −31 h | Bitácora, panel de moderación, replanificación |
| Gabriel | 40 h | 29 h | −11 h | Registro, búsqueda y validación |
| Hugo | 40 h | 10 h | −30 h | Pruebas y CI-2 |
| Ignacio | 40 h | 11,3 h | −28,7 h | Esquema, RLS y semilla |
| Joaquín | 40 h | 15 h | −25 h | Supabase, Vercel y chat |
| Pedro | 40 h | 8 h | −32 h | Búsqueda PostGIS y CI-1 |
| **Total** | **240 h** | **82,3 h** | **−157,7 h** | |

Valor a $5.000 por hora: estimado $1.200.000 por semana; ejecutado $411.500 (82,3 h, confirmadas por cada
integrante).

**Lectura:** el plan se hace con jornada completa, 40 h semanales por persona (240 h de equipo), tal como pidió
la profesora en la observación O1 de E2: es el esfuerzo que exige un proyecto real de este tamaño. Lo registrado en
S6 (82,3 h, confirmadas por los seis) queda muy por debajo de las 240 h. La causa principal es que la implementación
empezó el 9-11 (R-09), así que fue la primera semana de desarrollo; además, el registro no incluye reuniones ni estudio
sin entregable. **Efecto en el plan:** E4 y E5 se
planifican con 240 h de equipo por semana, y desde el 16-11 cada integrante registra sus horas en cada PR, para que en
E4 la comparación entre estimado y ejecutado sea completa.

## 3. Riesgos materializados

| Riesgo | Qué pasó | Acción aplicada | Efecto |
|---|---|---|---|
| R-09 Calendario | E3 adelantada sin código iniciado | Plan de 8 días con orden de recorte (`PLAN_E3.md`) | Integración 2 incompleta el 13-11 (Iteración 3 de la bitácora) |
| R-01 Técnica | Dependencias en cadena: RLS → registro → moderación → búsqueda → chat | Respaldos para no bloquear: búsqueda sin PostGIS y verificación con función en la base | RF-3 funcionó con el respaldo hasta el 15-11; ese día se aplicaron en producción las migraciones pendientes y la búsqueda usa PostGIS (R-11) |
| R-03 Validación | Un maestro invitado (P1) no respondió y faltaba uno para llegar a 3 | Se envió un enlace suplente (P5) | 7 respuestas completas (3 maestros y 4 clientes): se cumplen ambos mínimos, con P5 fuera de plazo (se informa como límite) |
| R-06 Equipo | Al 15-11, 4 de 6 integrantes no habían registrado sus horas | Se estimaron desde los commits y cada integrante las confirmó el 16-11; desde ahora se registran en cada PR | Ejecutado de S6 medido: 82,3 h |

## 4. Qué se compromete y qué queda fuera

Criterio: primero lo que exige la evaluación y lo que protege datos personales (RLS, borrado de la cédula); después
los Must que faltan; los Should solo si sobra tiempo según las horas reales registradas.

| Hito | Se compromete | Queda fuera y por qué |
|---|---|---|
| E3 (17-11) | Los 7 Must de E3 (en `premain` al 15-11): registro → verificación → búsqueda → contacto → chat → reseña; TNF-01; validación (7 respuestas); TC-01 a TC-05 aprobados; CI-1 (error máximo 0,194 %) y CI-2 | No se recortó nada del flujo. Queda fuera corregir los hallazgos de la validación (H-01 guía de T1, H-03 sellos, H-04 mensaje sin enviar): pasan a E4 |
| E4 ([fecha]) | Corregir los hallazgos de la validación (H-01 a H-04); RF-6 (Nivel 2 por reseñas); RF-12 y RF-8 (denuncias y su moderación); RF-9 (editar perfil) | RF-13 (notificaciones), por ser el Should de menor valor para la confianza |
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
