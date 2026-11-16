# Bitácora de iteraciones y respuesta a la PDR

Insumo de R3-C1 (18 %): *"Responde una a una las observaciones de la PDR, indicando qué cambió y qué se mantuvo y por
qué. Documenta al menos dos iteraciones con disparador, alternativas, decisión y efecto verificado."*
Responsable: Diego. Cada integrante agrega aquí las decisiones que tome en su parte.

## 1. Observaciones recibidas y respuesta

### Retroalimentación de E1 (informe escrito)

| # | Observación (resumen) | Qué cambiamos | Evidencia | Estado |
|---|---|---|---|---|
| C1 | El problema no está acreditado con evidencia propia; 2x3 y la SEC muestran que ya hay soluciones | Revisamos 2x3 en detalle (8-11) y acotamos la propuesta de valor (ver Iteración 1); entrevistas pendientes | Documento de correcciones, sección C1 | En curso |
| C2 | Cifras del escenario sin origen | Población del Censo 2024 de las 6 comunas (751.213 hab.); volúmenes del piloto declarados como hipótesis | Documento de correcciones, sección C2 | Hecho en documento |
| C3 | Falta el detalle de RF-11; RF-8 duplica RF-2; criterios sin formato Dado/Cuando/Entonces | RF-11 detallado; RF-8 queda como moderación; criterios reescritos | Documento de correcciones, sección C3 | Hecho en documento |
| C4 | Valores de RNF sin justificación desde el contexto | Referencia de Google (2016) para RNF-2 y cálculo de disponibilidad para RNF-4; se miden en E3 | `docs/pruebas/mediciones_rnf.md` | Medición pendiente |
| C5 | Restricciones con métricas no verificables | Tres celdas de la Tabla 11 reescritas | Documento de correcciones, sección C5 | Hecho en documento |
| C6 | Falta la base de licitud de cada tratamiento | Tabla de bases de licitud por tratamiento | Documento de correcciones, sección C6 | Hecho en documento |
| C7 | Horas inconsistentes (600 frente a 300) | Se unifica en 300 h-persona. **Reemplazado por O1 de E2:** 2.400 h-persona | `docs/gestion/registro_horas.md` | Reemplazado |
| C8 | Trazabilidad sin columna de evidencia | Columna de evidencia en la Tabla 36 | Documento de correcciones, sección C8 | Hecho en documento |

### Observaciones de E2 (presentación oral)

Observaciones orales de la profesora tras el Avance Oral 1, reconstruidas de memoria por el equipo (no hay registro
escrito). [Si alguien recuerda otra, agregarla con el mismo formato.]

| # | Observación (resumen) | Qué cambiamos | Evidencia | Estado |
|---|---|---|---|---|
| O1 | La estimación de esfuerzo no es realista: 5 h semanales por persona (300 h-persona) es muy poco para el proyecto. Pidió estimar con una jornada completa de 40 h semanales | Se reestima con 40 h semanales: 6 × 40 h × 10 semanas = **2.400 h-persona**, valoradas en **$12.000.000** con la misma tarifa de $5.000 por hora. Esto reemplaza la corrección C7 de E1 (300 h). Las horas reales se siguen registrando para comparar estimado con ejecutado en la replanificación | `docs/gestion/registro_horas.md`, `docs/gestion/costos.md`, replanificación post E3 | Por actualizar en registro de horas, costos y Gantt |
| O2 | ¿Cómo se retiene a los maestros? Pueden conseguir contactos a través de la página y después seguir con el cliente por fuera, sin volver a usarla | Lo tratamos como riesgo de desintermediación: ver la respuesta detallada abajo. La reputación solo se acumula dentro de la plataforma, y el modelo se financia con anuncios y no con comisión, así que salirse no le ahorra nada al maestro | Respuesta O2 (abajo); `docs/gestion/riesgos.md`; RB-2, RB-7, RF-5, RF-6 en `docs/requisitos.md` | Hecho; medición en E4 |

#### Respuesta a O1 · Estimación de esfuerzo

La cifra de 300 h-persona salía de suponer 5 h semanales por persona, que es la carga de la asignatura y no el
esfuerzo real que exige un sistema de este tamaño. Siguiendo la indicación de la profesora, la base pasa a ser una
jornada completa:

| Concepto | E1 (corregido en C7) | Tras E2 |
|---|---|---|
| Horas semanales por persona | 5 | 40 |
| Integrantes × semanas | 6 × 10 | 6 × 10 |
| Total horas-persona | 300 | 2.400 |
| Valor a $5.000 por hora | $1.500.000 | $12.000.000 |

**Qué se mantiene y por qué:** la tarifa de $5.000 por hora y el horizonte de 10 semanas, porque no fueron
observados. **Efecto:** en la replanificación (C6) comparamos estas 2.400 h estimadas con las horas registradas en
`registro_horas.md`. La diferencia explica qué alcance se compromete para E4 y E5.

#### Respuesta a O2 · Retención de maestros (desintermediación)

El riesgo es real: en cualquier plataforma que conecta a clientes con proveedores, una vez hecho el contacto, las
dos partes pueden seguir por teléfono. Nuestra respuesta es que al maestro le convenga más quedarse que irse:

1. **La reputación solo crece dentro de la plataforma.** Una reseña exige un contacto creado en MasterPlace y con el
   servicio confirmado (RB-2), y hay una sola reseña por contacto (RB-7). Un trabajo cerrado por fuera no le suma
   reseñas ni lo acerca al Nivel 2 (RF-6: 5 reseñas válidas con promedio ≥ 4). Las reseñas y los niveles son lo que
   lo hace aparecer mejor frente a clientes nuevos.
2. **Los niveles de verificación son un activo que no se lleva.** La identidad verificada (Nivel 1), la reputación
   (Nivel 2) y el certificado del oficio (Nivel 3) solo se muestran en MasterPlace.
3. **El ingreso viene de anuncios, no de cada trabajo.** El modelo de E1 se financia con anuncios, sin comisión por
   servicio. Cerrar el trato por fuera no le ahorra nada al maestro, y a la plataforma no le afecta en lo económico que
   un cliente y un maestro sigan por su cuenta: le importa que vuelvan a la página, y eso lo logran los puntos 1, 2 y 4.
   Si en el futuro se cobrara a los maestros, debería ser por suscripción o destaque, nunca por comisión, justamente por
   este riesgo.
4. **El cliente que vuelve, vuelve por la plataforma.** El cliente fiel a un maestro igual puede volver a contactarlo
   desde MasterPlace, y cada contacto nuevo vuelve a dejar una reseña.
5. **Medirlo en lugar de suponerlo.** Para E4 se mide la tasa de maestros con más de un contacto al mes y cuántos
   reciben reseñas, como indicador de que siguen usando la plataforma (disparador del riesgo R-10).

**Qué se mantiene y por qué:** no se bloquea el intercambio de teléfonos en el chat, porque sería invasivo y fácil
de evadir, y perjudicaría a clientes y maestros que ya se conocen. **Riesgo nuevo** en `docs/gestion/riesgos.md`:
desintermediación, con probabilidad alta, impacto medio y la mitigación anterior.

## 2. Iteraciones de diseño

Formato de cada iteración: **disparador** (medición, prueba, retroalimentación o riesgo materializado) →
**alternativas consideradas** → **decisión** → **efecto verificado** (con evidencia, no opinión).

### Iteración 1 · Propuesta de valor frente a 2x3 (8-11-2026)

- **Disparador:** observación C1 de E1 y revisión de 2x3.cl el 8-11-2026. 2x3 ya ofrece páginas por comuna del Gran
  Concepción, identidad y antecedentes verificados como señales separadas, reseñas, chat y pago protegido. No verifica la
  certificación del oficio (la SEC aparece solo en el texto que escribe el maestro), no tiene búsqueda por distancia y su
  oferta es escasa en Hualpén, Chiguayante y Penco.
- **Alternativas:** (a) mantener la propuesta original de E1; (b) acotar el aporte a la certificación verificada como
  señal separada y a la búsqueda por cercanía; (c) presentar MasterPlace como prototipo académico que replica parte del
  flujo de 2x3.
- **Decisión:** (a) mantener la propuesta de E1. La comparación muestra que lo que diferencia a MasterPlace de 2x3 ya
  estaba en E1: la certificación del oficio verificada y mostrada como señal aparte de la identidad (Nivel 3, RB-10),
  la búsqueda ordenada por distancia (RF-3, CI-1) y la cobertura en comunas donde 2x3 tiene poca oferta. Cambiar la
  propuesta no aportaba nada; sí cambia cómo se presenta: en E3 se explica frente a 2x3 en lugar de frente a "no hay
  alternativas".
- **Efecto verificado:** la búsqueda por distancia funciona en `main` (con PostGIS o con el cálculo de respaldo) y
  la tarea T3 de la validación pide justamente buscar un gásfiter en la comuna de cada participante; la pregunta T5
  mide si distinguen identidad y certificado. Resultado de la validación (15-11): los 4 clientes completaron T3, y los
  que explicaron su elección citaron la cercanía; en T5, los 3 maestros distinguieron identidad y certificado, pero
  ningún cliente (H-03). En A2, las reseñas y la identidad verificada quedaron primeras y la cercanía última
  (`docs/validacion/plan_validacion.md`, sección 9; Iteración 5).

### Iteración 2 · Cómo decide el sistema quién es administrador y cómo se aprueba la cédula (10-11-2026)

- **Disparador:** al construir el panel de moderación (RF-2, RF-8) vimos dos riesgos. (1) La sesión del frontend
  lee el rol desde `user_metadata`, y el propio usuario puede editar sus metadatos con `supabase.auth.updateUser()`,
  así que alguien podría darse el rol «admin» en el navegador. (2) El esquema exige que una cédula aprobada no
  conserve su archivo (`documentos_cedula_aprobada_sin_archivo`), y aprobar significa cambiar `documentos`, cambiar
  `maestros`, borrar el archivo del bucket y registrar en `auditoria`. Si esos pasos quedan a medias, puede haber
  un maestro verificado que conserva su cédula, o lo contrario.
- **Alternativas:**
  - Rol: (a) confiar en `user_metadata.rol`; (b) leer el rol desde `perfiles`, que el usuario no puede modificar, y
    exigirlo en RLS con `es_admin()`.
  - Aprobación: (a) varios pasos desde el cliente; (b) una función `revisar_identidad()` en la base, que lo hace todo
    en una transacción; (c) un trigger que borra el archivo cuando el documento pasa a «aprobado».
- **Decisión:** para el rol, (b): el panel consulta `perfiles.rol` y la protección real queda en RLS con
  `es_admin()`. Los metadatos solo sirven para mostrar el menú. Para la aprobación, (a) por ahora: el cliente
  actualiza el documento solo si sigue «pendiente», para que dos revisores no choquen, y guarda `ruta_archivo = null`
  en el mismo paso, así el check nunca falla. La capa de datos (`src/features/admin/api.ts`) queda aislada, de modo
  que se pueda cambiar a (b) o (c) cuando Ignacio publique la función, sin tocar la pantalla. El motivo del rechazo
  se guarda en `auditoria` porque `documentos` no tiene esa columna.
- **Efecto verificado:** la función `revisar_identidad` se probó primero en una base local con las migraciones y
  políticas del equipo: un cliente no puede aprobar, el admin sí, un documento no se revisa dos veces y un rechazo sin
  motivo se bloquea. En Supabase, la aprobación de una cédula quedó registrada en `auditoria` con el revisor, sin la
  ruta del archivo (13-11). La comprobación de que un usuario no puede darse el rol de admin queda dentro de TNF-01
  (Ignacio, `docs/pruebas/mediciones_rnf.md`). Las reglas puras del panel tienen 15 pruebas en
  `src/lib/moderacion/moderacion.test.ts`.

### Revisión de la Integración 2 frente al MVP de E1 §9.1 (13-11-2026, actualizada el 16-11)

Estado de cada Must de E1 (Tabla 28: RF-1, 2, 3, 4, 5, 8, 10 y 11). El 13-11 a las 17:00 había 2 de 7 completos, 4
parciales o en revisión y 1 pendiente: la Integración 2 no se cumplió ese día (disparador del riesgo R-09). Al 16-11:

| Must | 13-11 | 16-11 | Evidencia |
|---|---|---|---|
| RF-10 Registro de cliente e inicio de sesión | Listo | Listo | TC-01 |
| RF-1 Registro de maestro con cédula | Listo | Listo | TC-01 |
| RF-2 Verificación de identidad | En revisión | Listo: el admin aprueba, la cédula se borra y queda en `auditoria` | TC-02 |
| RF-3 Búsqueda y filtro | Funciona con respaldo | Listo, con PostGIS (`buscar_maestros` aplicada en producción el 15-11) | TC-03, CI-1 |
| RF-4 Contacto | Parcial | Listo: «Contactar» en la búsqueda y en el perfil, contacto único | TC-04 |
| RF-11 Mensajería | Parcial | Listo, con Realtime | TC-04 |
| RF-5 Reseña | Pendiente | Listo: una reseña por contacto y promedio bayesiano en el perfil | TC-05, CI-2 |
| RF-8 Moderación de denuncias | Fuera de E3 | Fuera de E3: depende de RF-12 (Should); queda para E4 | — |

**Resultado al 16-11:** 7 de los 8 Must de E1 implementados y probados de extremo a extremo; RF-8 pasa a E4.

### Iteración 3 · Alcance de la demo de E3 tras la Integración 2 (13-11-2026)

- **Disparador:** la revisión anterior. Al 13-11 el flujo completo (registro → verificación → búsqueda → contacto →
  chat → reseña) no corre en Vercel: `main` todavía no tiene la búsqueda, faltan el botón "Contactar", la reseña y la
  función PostGIS, y la verificación espera revisión. Quedan 3 días y la validación con usuarios empieza hoy a las
  20:00.
- **Alternativas:**
  - (a) Mantener los 7 Must y trabajar hasta el lunes 16 a las 18:00.
  - (b) Aplicar el orden de recorte de `docs/PLAN_E3.md`: primero la reseña (RF-5), luego el mapa (queda la lista) y
    luego Realtime (el chat se actualiza al enviar o recargar). Nunca se recortan las políticas RLS ni el borrado de la
    cédula.
  - (c) Mostrar en la demo solo lo que funciona y explicar el resto con capturas.
- **Decisión:** (b), con prioridad en lo que necesita la validación (búsqueda y contacto).
  Ya se aplicó un recorte de este tipo sin perder funcionalidad: la búsqueda consulta las tablas y calcula la
  distancia con Haversine en el navegador cuando `buscar_maestros` no existe (`src/lib/busqueda/buscarMaestros.ts`),
  así que RF-3 funciona sin esperar a PostGIS. Esto también sirve para CI-1: se pueden comparar los dos cálculos. Lo
  mismo se hizo con la verificación: como las políticas impiden que la app cambie el estado del maestro, se resolvió
  con una función en la base (Iteración 2) en lugar de relajar las políticas.
- **Efecto verificado:** al 15-11 los 7 Must de E3 están en `premain`, así que el recorte (b) no hizo falta: la
  búsqueda usa `buscar_maestros` con PostGIS (migración 20261114120000) y conserva el respaldo; el botón "Contactar"
  abre la conversación; el chat se actualiza con Realtime (20261113173000), y la reseña tiene confirmación del servicio
  y lectura pública (20261114180000 y 20261114190000). Esas migraciones quedaron aplicadas en la base de producción el
  15-11 en la noche; hasta entonces la búsqueda usaba el respaldo en el navegador (riesgo R-11). En la validación terminaron 7 participantes (3 maestros y 4
  clientes): los 4 clientes contactaron a un maestro (T4) y 2 de 3 maestros se registraron (T1), en ambos casos con
  datos confirmados en conversación con los participantes. El hallazgo principal de T1 es que la guía no dejaba claro
  dónde inscribirse (H-01; `docs/validacion/plan_validacion.md`, sección 9).
  [Agregar el 16-11: si el flujo completo corrió en el ensayo y el tiempo cronometrado.]

### Iteración 4 · Instrumento de la validación con usuarios dentro de la página (14-11-2026)

- **Disparador:** al preparar el envío, el equipo vio que la prueba remota obligaba a los participantes a ir y volver
  entre el Google Form y la página. En el celular, que es lo que usan los maestros, eso es lento y confuso, y arriesga
  que abandonen. Además, el plan reconocía como límite que los tiempos de las tareas eran autorreportados.
- **Alternativas:**
  - (a) Mantener el Google Form y pedir que hagan primero todas las tareas y respondan el formulario al final.
  - (b) Un formulario dentro de la página que simule la navegación de las tareas.
  - (c) Un enlace único por participante que lo guía paso a paso sobre la página real, con un panel fijo durante cada
    tarea, y guarda respuestas y tiempos en tablas solo para la validación.
- **Decisión:** (c). Se descartó (b) porque mediría una simulación y no MasterPlace: V1 y V2 perderían validez y no se
  podría verificar en la base. (a) reduce el ir y venir, pero mantiene los tiempos autorreportados. Se decidió antes de
  enviar el primer enlace, así que todos los participantes usan el mismo instrumento. Se conservan los textos del
  formulario (consentimiento, tareas, SUS y preguntas) para no cambiar lo que se mide. Implementación: migración
  `20261114000000_validacion_usuarios.sql` y `src/features/validacion/`.
- **Efecto verificado (15-11):** de 8 invitados terminaron 7 (3 maestros y 4 clientes), más de lo esperado (5 de 8 a
  10). El tiempo de T1 se midió en la página, pero solo un dato es válido: 5:28 (P2), sobre la meta de 5 minutos. Los
  botones «Comenzar» y «Terminé» no siempre se pulsaron durante la tarea (H-06), así que la medición automática no
  reemplazó del todo a la verificación en la base. Detalle en `docs/validacion/plan_validacion.md`, sección 9.

### Iteración 5 · Cambios a partir de la validación con usuarios (15-11-2026)

- **Disparador:** resultados de la validación (14 y 15-11, 7 participantes). Un maestro no encontró dónde inscribirse
  (H-01, crítico), ningún cliente distinguió «Identidad verificada» de «Certificado» (H-03) y un cliente creyó haber
  enviado un mensaje que no se guardó (H-04). En A2, las reseñas y la identidad verificada quedaron primeras y la
  cercanía última.
- **Alternativas:**
  - (a) Informar los hallazgos en E3 y dejar todos los cambios para E4.
  - (b) Corregir antes del congelamiento del 16-11 los cambios pequeños y de bajo riesgo, y planificar el resto para E4.
  - (c) Rediseñar el registro de maestro y los sellos antes de E3.
- **Decisión (propuesta de Gabriel, a confirmar en el ensayo del 16-11):** (b). Se descarta (c) porque arriesga la demo
  a un día de congelar el código. Entran antes de E3, si caben: el acceso directo a «Soy maestro» en la guía de T1 (H-01)
  y el texto de ayuda en los sellos (H-03). Quedan para E4: la confirmación de «Mensaje enviado» (H-04), la vinculación
  de la cuenta al enlace (H-02) y la foto de perfil (H-07). La propuesta de valor frente a 2x3 (Iteración 1) se apoya en
  las reseñas y la identidad verificada más que en la cercanía.
- **Efecto verificado:** pendiente; se medirá en la validación de E4 con el mismo instrumento.

### Iteración 6 · [título] (opcional para E3, exigida en E4)
