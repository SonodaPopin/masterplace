# Plan final · Informe (E4) y defensa con demo en vivo (E5)

Actualizado el 20-11-2026. Reemplaza a `docs/PLAN_E3.md` desde hoy.

## 1. Punto de partida

- **Entrega:** por confirmar con la profesora. Puede ser la semana del lunes 30-11 (**martes 1-12 o jueves 3-12**) o
  más tarde, **hasta el jueves 10-12**. **Planificamos para la fecha más temprana (martes 1-12)**: todo lo que exige la
  evaluación queda listo el lunes 30-11 sin depender de días extra. Si se confirma una fecha posterior, el tiempo
  adicional se usa según la §5.1, sin reabrir lo que ya está terminado.
- E4 (informe) y E5 (defensa) valen **35 % cada uno**, y para aprobar se exige: E4 ≥ 4,0, E5 ≥ 4,0, demo en vivo del
  flujo principal completo y los siete artefactos de diseño identificables en el informe (enunciado §7.2).
- En E3 los criterios más bajos fueron **C7 comunicación oral, C1 iteración del diseño, C6 costos y replanificación y
  C3 ciencias de la ingeniería**. Vuelven a evaluarse en E4 (C4, C5, C8) y E5 (C2, C4, C6, C8, C9).
- Al 16-11, 7 de los 8 Must de E1 están en producción. Falta **RF-8 (moderación de denuncias)**.
- Hallazgos de la validación pendientes: H-01 (los maestros no encuentran dónde inscribirse), H-03 (sellos confusos),
  H-04 (mensaje que parece enviado y no se guardó).

## 2. Observaciones de E3 y qué hacemos con cada una

Insumo del cuadro de respuesta a observaciones (bitácora) y de E5-C2.

| # | Observación de la profesora (oral, 17-11) | Qué hacemos | Responsable | Evidencia |
|---|---|---|---|---|
| O3 | Usar la fórmula de Laplace para las reseñas | Se adopta Laplace por estrellas para ordenar; se muestra el promedio real con la cantidad de reseñas (§3.1) | Pedro | `docs/ciencias/CI-2_*.md`, `src/lib/reputacion/` |
| O4 | Validar el código con un bot en GitHub | Repo público con reglas de ramas (CI obligatoria y revisión), CodeQL, Dependabot y escaneo de secretos | Joaquín | Rulesets, pestaña *Security* |
| O5 | Planificar en un kanban y hacer seguimiento | Tablero de GitHub Projects con issues, responsables y horas (§6) | Diego | Tablero del proyecto |
| O6 | Se trabajó «retroactivamente» sobre lo que otro subía a `main` | Contratos primero: migración y tipos se fusionan antes que las pantallas; trabajo en paralelo contra el contrato (§6) | Todos | Historial de PR |
| O7 | Solo pruebas unitarias; faltan pruebas de navegabilidad y de un usuario que intente superar los límites | Playwright extremo a extremo en la CI y pruebas de abuso documentadas (§3.5) | Hugo | `docs/pruebas/`, job de CI |
| O8 | Manejo de la cédula: RUT, número de serie, vigencia como Mercado Público | RUT con dígito verificador y único; número de documento oculto antes de subir; vigencia de 90 días (§3.4) | Gabriel, Hugo, Joaquín | `src/lib/`, migración, registro de maestro |

Además, probando la app el 20-11 se confirmó que **al pulsar «Contactar» el contacto queda como «Servicio confirmado» y
se puede reseñar sin haber escrito un solo mensaje** (decisión provisional de E3 en
`20261114180000_rf5_confirmacion_temporal.sql`). Se corrige con la solicitud de servicio (§3.2).

## 3. Decisiones de diseño

Cada una se documenta en la bitácora como iteración: disparador, alternativas, decisión y efecto verificado.

### 3.1 Reputación: Laplace por estrellas (Iteración 6)

- **Fórmula:** `L = (n·r + 15) / (n + 5)`, es decir, un voto ficticio por cada estrella (1+2+3+4+5 = 15). Es el
  promedio bayesiano actual con C = 3 fijo y m = 5.
- **Alternativas:** (a) bayesiano con el promedio global C (actual); (b) Laplace por estrellas; (c) Laplace binaria,
  `(positivas + 1)/(n + 2)`.
- **Por qué (b):** lo pidió la profesora, no depende del promedio global (una consulta menos y sin caso «sin valor»),
  y conserva el orden de la sensibilidad de E3 (C > B > A).
- **Cómo influye en el sistema:** ordena la búsqueda con la opción «Mejor evaluados» (además de «Más cercanos»).
  En pantalla se muestra **«★ 4,6 · 12 reseñas»** (promedio real), nunca el valor suavizado ni la palabra «bayesiano».
- **Efecto a verificar:** pruebas de la función y orden obtenido con los datos de la semilla.

### 3.2 Solicitud de servicio dentro del chat (Iteración 7)

**Flujo:**

1. En la conversación, el **cliente** pulsa «Solicitar servicio»: qué necesita y fecha y hora acordadas. Aparece como
   tarjeta en el chat.
2. El **maestro** la acepta o la rechaza (motivo opcional). El cliente puede cancelarla antes de la fecha.
3. Desde **2 horas después de la fecha acordada**, el cliente **o** el maestro la marca como «Realizado».
4. Recién entonces el cliente puede dejar **una reseña por solicitud**, hasta 30 días después.

**Decisiones:**

- Basta con que uno de los dos marque «Realizado». Alternativas descartadas: doble confirmación (deja servicios
  trabados si uno no responde) y plazo de objeción (más estados y más tiempo de construcción). Si el maestro marca un
  servicio que no ocurrió, el cliente lo denuncia (§3.3).
- Las reglas las aplica la base de datos, no la pantalla, como `revisar_identidad`.
- El contacto vuelve a nacer como `abierto`. Las reseñas existentes quedan como «previas a E4» (sin solicitud).
- Cambian RB-2 y RB-7: una reseña exige una **solicitud realizada**, y hay una reseña por solicitud (no por contacto).
  Así un cliente que vuelve a contratar al mismo maestro puede reseñar cada trabajo.

**Contrato de datos (lo fusiona Ignacio antes del lunes 23):**

- Tabla `solicitudes_servicio`: `id`, `contacto_id`, `cliente_id`, `maestro_id`, `descripcion` (≤ 500),
  `fecha_acordada`, `estado` (`pendiente`, `aceptada`, `rechazada`, `cancelada`, `realizada`), `motivo_rechazo`,
  `creada_en`, `respondida_en`, `realizada_en`, `realizada_por`.
- Funciones `security definer`: `crear_solicitud`, `responder_solicitud`, `cancelar_solicitud` y `marcar_realizada`
  (esta última comprueba `now() >= fecha_acordada + interval '2 hours'`).
- `resenas.solicitud_id` único; la política de inserción exige solicitud `realizada` del propio cliente y dentro de
  30 días.
- `crear_o_reutilizar_contacto` vuelve a crear contactos `abierto`.
- Tipos de TypeScript y funciones simuladas para que el frontend avance sin esperar.

### 3.3 Denuncias y moderación (RF-12 y RF-8, Must pendiente)

- El maestro denuncia una reseña de su perfil; el cliente puede denunciar un «servicio no realizado».
- Tabla `denuncias` (motivo, detalle ≤ 500, estado `pendiente`/`aceptada`/`descartada`, revisor y fecha);
  `resenas.oculta` excluye la reseña del promedio y de la lista.
- El admin las resuelve en una pestaña nueva del panel; todo queda en `auditoria`.

### 3.4 Cédula: RUT, número oculto y vigencia (Iteración 8)

- **RUT:** se pide en el registro de maestro, se valida con dígito verificador (módulo 11) y es único
  (`maestros_privado.rut`, que hoy existe pero el formulario no llena).
- **Número de documento oculto antes de subir:** en el navegador, el maestro tapa el número con un rectángulo que queda
  grabado en la imagen; el servidor nunca lo recibe. Se pide solo el anverso.
- **Vigencia de 90 días**, como Mercado Público: al aprobar se guarda la fecha de vencimiento (no la imagen); al vencer,
  el sello de identidad caduca y se pide subir la cédula otra vez.
- **Sin OCR:** E1 lo dejó fuera del alcance y sería frágil.
- **Intercambio:** se sacrificó la consulta de vigencia del documento en el Registro Civil, que requiere el número de
  serie, para obtener minimización de datos, en razón de la Ley 21.719 (vigente desde el 01-12-2026).

### 3.5 Pruebas además de las unitarias

- **Extremo a extremo automatizadas** con Playwright sobre el flujo principal, en la CI.
- **Pruebas de abuso:** un cliente que entra a `/admin`; reseñar sin solicitud realizada o dos veces; marcar
  «Realizado» antes de tiempo; un `.exe` renombrado a `.jpg` o un archivo de 50 MB; XSS en la descripción o el chat;
  inyección en la búsqueda; leer el chat de otro por la API con la clave anónima; textos enormes; recargar a mitad del
  registro; botón atrás; sesión expirada; celular de 375 px; solo teclado.
- **Lo que quedó parcial en E3:** seguridad por API como tercero y por la URL directa del archivo; mensajes bajo carga.

## 4. Reparto

**Las instrucciones detalladas de cada integrante, tarea por tarea, están en `docs/equipo/`:**
[`COMO_TRABAJAMOS.md`](equipo/COMO_TRABAJAMOS.md) (léelo primero) y un archivo por persona. Cada uno sigue con el tema
que expuso en E3, para llegar a las preguntas de E5 sabiendo lo que construyó.

| Integrante | Tema | Tareas principales | Archivo |
|---|---|---|---|
| Gabriel | Frontend y UI/UX, validación | Registro de maestro, perfil y reseñas, tarjeta de solicitud, cédula tapada, búsqueda con estrellas, denuncias, segunda validación | [`gabriel.md`](equipo/gabriel.md) |
| Pedro | Ciencias de la ingeniería | Laplace (función y CI-2), `buscar_maestros` con reputación, efecto verificado, mediciones | [`pedro.md`](equipo/pedro.md) |
| Ignacio | Datos y seguridad | Solicitud de servicio en la base (contrato y reglas), pruebas en la base, riesgos | [`ignacio.md`](equipo/ignacio.md) |
| Diego | Coordinación, iteraciones | Tablero y seguimiento, observaciones de E3, denuncias en la base, invitaciones a la validación, iteraciones 6 a 8, edición del informe | [`diego.md`](equipo/diego.md) |
| Hugo | Calidad y pruebas | Validación de RUT, Playwright, pruebas de abuso, seguridad pendiente de E3 | [`hugo.md`](equipo/hugo.md) |
| Joaquín | Operación y despliegue | Seguridad del repo público (credenciales de la semilla, reglas de ramas, análisis), RUT y vigencia en la base, registro de migraciones, congelamiento, plan B | [`joaquin.md`](equipo/joaquin.md) |

### Contratos (se fusionan primero)

| Contrato | Dueño | Fecha | Lo usa |
|---|---|---|---|
| Solicitud de servicio | Ignacio | dom 22 | Gabriel, Hugo |
| RUT y vigencia de la cédula | Joaquín | dom 22 | Gabriel, Pedro, Hugo |
| Validación de RUT en TypeScript | Hugo | dom 22 | Gabriel |
| Búsqueda con reputación | Pedro | dom 22 | Gabriel |
| Denuncias | Diego | lun 23 | Gabriel, Hugo |

### Todos

- Registrar las horas en cada PR (insumo del capítulo 6).
- Revisar los PR ajenos dentro del día.
- Comentario diario en el issue: «Hice / Mañana / Me bloquea».
- Declaración de uso de IA de su parte (anexo del informe).

## 5. Calendario

| Día | Qué pasa |
|---|---|
| **vie 20 – dom 22** | Reglas del repo, tablero, contratos fusionados en `premain` (§4: solicitud de servicio, RUT y vigencia, validación de RUT, búsqueda con reputación; denuncias el lunes 23), CI-2 reescrita |
| **lun 23 – jue 26** | Desarrollo en paralelo contra los contratos. El informe se redacta desde el lunes |
| **vie 27** | **Congelar el código**: `premain → main`, migraciones en producción, credenciales rotadas |
| **sáb 28** | Segunda validación con usuarios, sobre todo maestros registrándose |
| **dom 29** | Análisis de la validación, iteraciones con efecto verificado, informe completo y primer ensayo cronometrado de 15 min |
| **lun 30** | **Informe listo para entregar.** Segundo ensayo. Demo preparada (datos, sesiones, plan B, video) |
| **mar 1-12** | Primera fecha posible de entrega y defensa |

### 5.1 Si la entrega se confirma más tarde

| Entrega | Uso de los días extra |
|---|---|
| **jue 3-12** | Martes y miércoles: solo ensayos y errores críticos. Sin funciones nuevas |
| **lun 7-12 a jue 10-12** | Una segunda vuelta corta (abajo), con su propio congelamiento |

Segunda vuelta (solo si la fecha se confirma en la semana del 7-12):

| Día | Qué pasa |
|---|---|
| **mar 1 – jue 3** | Lo recortado en la §7, en orden inverso: «Mejor evaluados», denuncia de servicio no realizado y vigencia de 90 días. Después, los Should pendientes: RF-6 (Nivel 2 por reseñas) y RF-9 (editar perfil). Correcciones de la segunda validación |
| **vie 4** | **Segundo congelamiento** del código: `premain → main` y migraciones en producción |
| **sáb 5** | Tercera validación corta con el mismo instrumento, para verificar el efecto de los cambios (cierra las iteraciones con evidencia) |
| **dom 6 – lun 7** | Actualizar el informe con los resultados nuevos |
| **desde el mar 8** | Ensayos cronometrados hasta la fecha de la defensa; solo errores críticos |

Reglas para los días extra:

- El informe del lunes 30-11 queda **completo y entregable**. Los días extra lo mejoran, no lo terminan.
- Nada entra a `main` después del segundo congelamiento salvo errores críticos.
- RF-7 (certificado, Nivel 3) y RF-13 (notificaciones) siguen fuera aunque haya más tiempo: son los de menor valor para
  la confianza y agregarían riesgo a la demo.

## 6. Cómo trabajamos

- **Tablero:** cada tarea es un issue con responsable, horas estimadas, horas reales y fecha. Columnas: Backlog →
  Lista → En curso (máximo 2 por persona) → En revisión (PR abierto) → Hecho (fusionado en `premain`). El PR cierra
  su issue con `Closes #n`.
- **Contratos primero:** si una tarea depende de otra (base ↔ pantalla), primero se fusiona un PR chico con la
  migración aditiva y el archivo de servicio con sus tipos; después cada uno trabaja en paralelo contra ese contrato.
  Nadie espera a que otro termine para empezar. Explicación con ejemplo en
  [`equipo/COMO_TRABAJAMOS.md`](equipo/COMO_TRABAJAMOS.md) §1.
- **Migraciones:** las aditivas se aplican en producción el día que se fusionan; las de cambio, solo el viernes 27
  (`COMO_TRABAJAMOS.md` §2).
- **Ritmo:** planificación el lunes 23 (acta, conduce quien no haya conducido); aviso diario escrito en el issue: qué
  hice, qué haré, qué me bloquea.
- **Ramas:** como en `CONTRIBUTING.md`, ahora con las reglas aplicadas por GitHub.

## 7. Si nos atrasamos

Se recorta en este orden:

1. Vigencia de 90 días de la cédula: se documenta, no se implementa.
2. Denuncia de «servicio no realizado»: quedan solo las denuncias de reseñas.
3. Orden «Mejor evaluados»: se muestran las estrellas, pero la búsqueda sigue ordenando por distancia.

**No se recortan:** la solicitud de servicio, el rediseño del registro de maestro, las reglas de RLS ni el borrado de
la cédula.

## 8. Por confirmar

- Día exacto de la entrega del informe y de la defensa: entre el martes 1-12 y el jueves 10-12. Pueden ser días
  distintos.
- Que la regla «Restrict updates» esté disponible en el repo; si no, se usa `CODEOWNERS` con revisión obligatoria de
  Joaquín en `main`.
