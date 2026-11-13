# Mediciones de requisitos no funcionales

R3-C4 pide, para cada RNF crítico: valor objetivo, método de medición reproducible, valor obtenido y veredicto, e
interpretar las desviaciones.

| RNF | Objetivo (E1) | Prueba | Método y condiciones | Valor obtenido | Veredicto | Responsable |
|---|---|---|---|---|---|---|
| RNF-1 Seguridad | 100 % de accesos indebidos a documentos y conversaciones rechazados | TNF-01 | Intentos como visitante, tercero y rol indebido, por API y por URL de archivo | | | Ignacio |
| RNF-2 Rendimiento | p95 de búsqueda ≤ 3 s y errores ≤ 1 % | TNF-02 | 50 usuarios virtuales durante 15 min, mezcla 60/20/20; registrar red, equipo y volumen de datos | | | Hugo |
| RNF-6 Capacidad | 50 concurrentes sin caída ni pérdida de mensajes | TNF-02 | Contar los mensajes enviados y los persistidos al terminar | | | Hugo |
| RNF-4 Disponibilidad | ≥ 95 % de comprobaciones correctas en 7 días | TNF-04 | Monitor cada 5 min desde el 10-11 (en E3 se informa el periodo parcial) | | | Joaquín |
| RNF-5 Mantenibilidad | Cobertura ≥ 70 % en módulos críticos; TypeScript sin errores | TNF-05 | `npm run test:coverage` y `npm run typecheck` en la CI | | | Hugo |
| RNF-7 Accesibilidad | Teclado, foco, etiquetas, contraste ≥ 4,5:1 y lista equivalente al mapa | TNF-06 | Revisión manual y Lighthouse en registro y búsqueda. Ejecutado el 13-11 con axe-core 4.10.2 (el motor de las auditorías de accesibilidad de Lighthouse), reglas WCAG 2 A/AA y buenas prácticas, más revisión con teclado (ver detalle abajo) | 0 infracciones automáticas en 4 páginas (incluido contraste); 2 defectos manuales encontrados y corregidos | Cumple, con límites: falta Lighthouse completo y probar en navegador los pasos 2 y 3 del registro de maestro | Gabriel |
| RNF-3 Usabilidad | Registro de maestro ≤ 3 pasos y ≤ 5 min; SUS ≥ 75 | TNF-03 | Sesiones de validación | | | Gabriel |

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

