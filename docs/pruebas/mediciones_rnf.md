# Mediciones de requisitos no funcionales

R3-C4 pide, para cada RNF crítico: valor objetivo, método de medición reproducible, valor obtenido y veredicto, e
interpretar las desviaciones.

| RNF | Objetivo (E1) | Prueba | Método y condiciones | Valor obtenido | Veredicto | Responsable |
|---|---|---|---|---|---|---|
| RNF-1 Seguridad | 100 % de accesos indebidos a documentos y conversaciones rechazados | TNF-01 | Intentos como visitante, tercero y rol indebido, por API y por URL de archivo | Interfaz: 2 de 2 intentos de lectura indebida bloqueados como cliente (documentos y conversaciones). API visitante: 2 consultas realizadas (documentos y mensajes), ambas devolvieron HTTP 200 con respuesta vacía ([]). API cliente, tercero y URL de archivo: pendientes | Parcialmente comprobado | Ignacio |
| RNF-2 Rendimiento | p95 de búsqueda ≤ 3 s y errores ≤ 1 % | TNF-02 | 50 usuarios virtuales durante 15 min, mezcla 60/20/20; registrar red, equipo y volumen de datos | Script de Node equivalente a k6 (`docs/pruebas/carga_tnf02.mjs`), 15-11 a las 23:11, desde un PC con Ryzen 5 7600 y 32 GB, en red doméstica, contra la API de producción (46 maestros verificados). 50 usuarios virtuales durante 15 min, con 1 a 3 s de pausa entre acciones; búsqueda (`buscar_maestros`) y perfil (maestro, reseñas y reputación) en proporción 60:20. El 20 % de chat no se incluyó porque necesita sesiones de cliente. Búsqueda: 15.476 peticiones, 0 errores, p50 163 ms, **p95 187 ms**, p99 227 ms, máximo 585 ms. Perfil: 5.134 operaciones, 0 errores, p95 215 ms, máximo 702 ms | Cumple (p95 187 ms frente a 3 s; 0 % de errores). Parcial respecto de la mezcla: sin el 20 % de chat | Hugo |
| RNF-6 Capacidad | 50 concurrentes sin caída ni pérdida de mensajes | TNF-02 | Contar los mensajes enviados y los persistidos al terminar | En la misma prueba, 50 usuarios concurrentes durante 15 min: 20.610 operaciones sin errores ni caída. La pérdida de mensajes no se midió bajo carga (necesita sesiones de cliente); en TC-04 los mensajes enviados quedaron guardados y llegaron por Realtime | Parcial: sin caída con 50 concurrentes; falta medir la persistencia de mensajes bajo carga | Hugo |
| RNF-4 Disponibilidad | ≥ 95 % de comprobaciones correctas en 7 días | TNF-04 | Monitor HTTP/S de UptimeRobot sobre https://masterplace.vercel.app cada 5 min, desde el 10-11 a las 21:12. Lectura del panel el 15-11 en la noche. Monitor cada 5 min desde el 10-11 (en E3 se informa el periodo parcial) | 100 % en los últimos 7 días y en los últimos 30 días; 0 incidentes; 0 min caído. Al leerlo: arriba sin interrupción hace 5 d 1 h 32 min (periodo medido ≈ 5 días, no 7) | Cumple en el periodo medido; parcial respecto de los 7 días completos, que se cumplen el 17-11 a las 21:12 | Joaquín |
| RNF-5 Mantenibilidad | Cobertura ≥ 70 % en módulos críticos; TypeScript sin errores | TNF-05 | `npm run test:coverage` y `npm run typecheck` en la CI. Ejecutado el 15-11 sobre `premain` (`70f07eb`), local, Vitest con v8, cobertura de `src/lib` | 96 pruebas aprobadas; TypeScript sin errores. Cobertura de líneas en módulos críticos: `haversine.ts` 100 %, `promedioBayesiano.ts` 70,4 %, `maestros/validacion.ts` 100 %, `auth/validacion.ts` 100 %, `moderacion.ts` 100 %, `busqueda/resultados.ts` 100 %. Global de `src/lib`: 74,2 % de líneas y 89,5 % de ramas | Cumple (`promedioBayesiano.ts` justo sobre el 70 %). Sin pruebas: `buscarMaestros.ts`, `oficios.ts`, `ProveedorSesion.tsx` y `contexto.ts`, que dependen de Supabase o de React | Hugo |
| RNF-7 Accesibilidad | Teclado, foco, etiquetas, contraste ≥ 4,5:1 y lista equivalente al mapa | TNF-06 | Revisión manual y Lighthouse en registro y búsqueda. Ejecutado el 13-11 con axe-core 4.10.2 (el motor de las auditorías de accesibilidad de Lighthouse), reglas WCAG 2 A/AA y buenas prácticas, más revisión con teclado (ver detalle abajo) | 0 infracciones automáticas en 4 páginas (incluido contraste); 2 defectos manuales encontrados y corregidos | Cumple, con límites: falta Lighthouse completo y probar en navegador los pasos 2 y 3 del registro de maestro | Gabriel |
| RNF-3 Usabilidad | Registro de maestro ≤ 3 pasos y ≤ 5 min; SUS ≥ 75 | TNF-03 | Prueba remota guiada dentro de la app, 14 y 15-11, 7 participantes (3 maestros y 4 clientes); SUS estándar de 10 ítems; tiempo entre «Comenzar» y «Terminé» (`plan_validacion.md`, sección 9) | Registro en 3 pasos (por diseño). Tiempo de T1: 5:28 (P2); P5, 0:47, no representativo; P3 no terminó. SUS promedio 88,9 (70–100): maestros 77,5 y clientes 97,5 | SUS: cumple. Tiempo ≤ 5 min: no se cumple (único dato válido: 5:28) | Gabriel |

## Interpretación de desviaciones

- [Si un valor no se cumple: causa probable, qué se decidió y si genera una iteración en la bitácora.]

## TNF-06 · Detalle de la revisión de accesibilidad (13-11-2026)

**Páginas:** búsqueda (`/`, con 9 resultados en el mapa y la lista), registro de cliente, registro de maestro (paso 1)
e ingreso. Servidor local (`npm run dev`) contra el Supabase del proyecto, rama `gabriel/a11y-validacion`.

**Automático (axe-core 4.10.2, WCAG 2 A/AA y buenas prácticas):** 0 infracciones en las 4 páginas; en la búsqueda,
42 reglas aprobadas, contraste incluido.

**Manual:**

| Comprobación | Resultado |
|---|---|
| Etiquetas en todos los campos y filtros | Cumple |
| Errores del formulario: `aria-invalid`, mensaje asociado y foco en el primer error | Cumple (registro de cliente enviado vacío: 4 campos marcados, foco en «nombre») |
| Foco visible y enlace «Saltar al contenido» | Cumple |
| Lista equivalente al mapa, con la misma numeración | Cumple (RNF-7) |
| Marcadores del mapa alcanzables con Tab y con nombre («1. Nombre, a 800 m») | Cumple (10 de 10) |
| Cambiar un filtro no mueve el foco | Cumple |
| **D-A11Y-1** Título de la pestaña distinto por página (WCAG 2.4.2) | Fallaba: todas decían lo mismo. **Corregido** |
| **D-A11Y-2** Al cambiar de página, el foco pasa al contenido nuevo | Fallaba: el foco caía al `body` y el lector de pantalla no anunciaba la página. **Corregido**: el foco va al `h1` |

**Límites:**
- No se ejecutó Lighthouse completo, solo su motor de accesibilidad.
- Los pasos 2 y 3 del registro de maestro (oficio, comunas, punto y cédula) requieren una sesión de maestro; se
  revisaron en el código (etiquetas, `aria-describedby`, foco en el primer error), no en el navegador.
- El punto de búsqueda se mueve con el ratón o el dedo; con teclado, la alternativa es elegir la comuna o usar la
  ubicación.
- No se probó con un lector de pantalla real (NVDA o VoiceOver).

