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
| O2 | ¿Cómo se retiene a los maestros? Pueden conseguir contactos a través de la página y después seguir con el cliente por fuera, sin volver a usarla | Lo tratamos como riesgo de desintermediación: ver la respuesta detallada abajo. La reputación solo se acumula dentro de la plataforma, y el modelo es sin comisión, así que salirse no le ahorra nada al maestro | Respuesta O2 (abajo); `docs/gestion/riesgos.md`; RB-2, RB-7, RF-5, RF-6 en `docs/requisitos.md` | En curso: [CONFIRMAR con el equipo] |

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
3. **Sin comisión no hay incentivo económico para salirse.** [CONFIRMAR modelo de E1] Como la plataforma no cobra
   por trabajo, cerrar el trato por fuera no le ahorra nada al maestro. Si en el futuro hubiera cobro, debería ser una
   suscripción o un destaque pagado, nunca una comisión por trabajo, justamente por este riesgo.
4. **El cliente que vuelve, vuelve por la plataforma.** El cliente fiel a un maestro igual puede volver a contactarlo
   desde MasterPlace, y cada contacto nuevo vuelve a dejar una reseña.
5. **Medirlo en lugar de suponerlo.** [PROPUESTA] En la validación con usuarios (C5) preguntamos a los maestros
   qué los haría volver. Para E4 se puede medir la tasa de maestros con más de un contacto por mes.

**Qué se mantiene y por qué:** no se bloquea el intercambio de teléfonos en el chat, porque sería invasivo y fácil
de evadir, y perjudicaría a clientes y maestros que ya se conocen. **Riesgo nuevo** en `docs/gestion/riesgos.md`:
desintermediación, con probabilidad alta, impacto medio y la mitigación anterior. [Agregarlo.]

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
- **Decisión:** [COMPLETAR con lo acordado en la reunión del 9-11 (ver `docs/actas/2026-11-09.md`), idealmente con el resultado de las entrevistas.]
- **Efecto verificado:** [COMPLETAR: por ejemplo, qué opinaron los participantes de la validación sobre la
  certificación y la distancia.]

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
- **Efecto verificado:** [COMPLETAR cuando estén las políticas: (1) un usuario con `rol: 'admin'` en sus metadatos,
  pero cliente en `perfiles`, ve «Esta sección es solo para administración» y la API le devuelve la lista vacía
  (registrar en TNF-01); (2) tras aprobar, el maestro aparece en la búsqueda, `ruta_archivo` es null, el archivo ya
  no está en el bucket y hay una fila en `auditoria`.] Las reglas puras del panel (cédula a revisar, validación del
  motivo, texto de auditoría sin la ruta del archivo) tienen 15 pruebas en `src/lib/moderacion/moderacion.test.ts`.

### Iteración 3 · [título] (opcional para E3, exigida en E4)
