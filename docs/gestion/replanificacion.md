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
| Gabriel | 40 h | ≈ 29 h (estimación propia) | ≈ −11 h | Registro, búsqueda y validación |
| Hugo | 40 h | ≈ 10 h (estimado desde commits, a confirmar) | ≈ −30 h | Pruebas y CI-2 |
| Ignacio | 40 h | 11,3 h | −28,7 h | Esquema, RLS y semilla |
| Joaquín | 40 h | ≈ 15 h (estimado desde commits, a confirmar) | ≈ −25 h | Supabase, Vercel y chat |
| Pedro | 40 h | ≈ 8 h (estimado desde commits, a confirmar) | ≈ −32 h | Búsqueda PostGIS y CI-1 |
| **Total** | **240 h** | **≈ 82 h** | **≈ −158 h** | |

Valor a $5.000 por hora: estimado $1.200.000 por semana; ejecutado ≈ $410.000 (≈ 82 h, de las cuales 20,3 h están
registradas por sus autores y el resto estimadas el 15-11 a partir del repositorio).

**Lectura:** el plan se hace con jornada completa, 40 h semanales por persona (240 h de equipo), tal como pidió
la profesora en la observación O1 de E2: es el esfuerzo que exige un proyecto real de este tamaño. Lo registrado en
S6 (≈ 82 h) es un piso: solo Ignacio y Diego anotaron sus horas, y las demás se estimaron desde los commits, que no
recogen reuniones, estudio ni trabajo sin commit. Aun así, la diferencia con las 240 h es grande y se explica sobre todo
porque la implementación empezó el 9-11 (R-09). **Efecto en el plan:** E4 y E5 se
planifican con 240 h de equipo por semana, y desde el 16-11 cada integrante registra sus horas en cada PR, para que en
E4 la comparación entre estimado y ejecutado sea completa.

## 3. Riesgos materializados

| Riesgo | Qué pasó | Acción aplicada | Efecto |
|---|---|---|---|
| R-09 Calendario | E3 adelantada sin código iniciado | Plan de 8 días con orden de recorte (`PLAN_E3.md`) | Integración 2 incompleta el 13-11 (Iteración 3 de la bitácora) |
| R-01 Técnica | Dependencias en cadena: RLS → registro → moderación → búsqueda → chat | Respaldos para no bloquear: búsqueda sin PostGIS y verificación con función en la base | RF-3 funciona sin `buscar_maestros` |
| R-03 Validación | Se consiguieron 2 maestros de los 3 pedidos y 2 participantes son de fuera del piloto | Enlaces suplentes y aviso al equipo | 6 respuestas completas: se cumple el mínimo de 5, no el de 3 maestros (se informa como límite) |
| R-06 Equipo | 4 de 6 integrantes sin registro de horas | Se exige el registro en cada PR | No se puede medir con precisión el ejecutado de S6 |

## 4. Qué se compromete y qué queda fuera

Criterio: primero lo que exige la evaluación y lo que protege datos personales (RLS, borrado de la cédula); después
los Must que faltan; los Should solo si sobra tiempo según las horas reales registradas.

| Hito | Se compromete | Queda fuera y por qué |
|---|---|---|
| E3 (17-11) | Los 7 Must de E3 (en `premain` al 15-11): registro → verificación → búsqueda → contacto → chat → reseña; TNF-01; validación (6 respuestas); CI-1 (error máximo 0,194 %) y CI-2 | No se recortó nada del flujo. Queda fuera corregir el hallazgo de T1 (los maestros no lograron registrarse): pasa a E4 |
| E4 ([fecha]) | Corregir el registro de maestro según la validación (T1); RF-6 (Nivel 2 por reseñas); RF-12 y RF-8 (denuncias y su moderación); RF-9 (editar perfil); `buscar_maestros` con PostGIS si no está | RF-13 (notificaciones), por ser el Should de menor valor para la confianza |
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
