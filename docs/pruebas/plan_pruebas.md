# Plan de pruebas para E3

Responsable: Hugo. Base: E1 §10.2 (Tabla 34) y §10.3 (Tabla 35).

## Tipos de prueba

| Tipo | Herramienta | Qué cubre | Dónde |
|---|---|---|---|
| Unitarias | Vitest | CI-1 (Haversine), CI-2 (promedio bayesiano), validaciones de formularios | `src/**/*.test.ts` |
| Integración (base de datos) | Consultas SQL con distintos roles, o pruebas con el cliente de Supabase | RLS, `buscar_maestros`, reseña única por contacto | `docs/pruebas/registro_pruebas.md` |
| Extremo a extremo (manual con guion) | Navegador y guion de la demo | TC-01 a TC-05 | `registro_pruebas.md` |
| No funcionales | k6 o Artillery, monitor, Lighthouse | TNF-01, TNF-02, TNF-04, TNF-06 | `mediciones_rnf.md` |

## Alcance para el 17-11

| Caso | Requisitos | Entra en E3 | Responsable de ejecutar |
|---|---|---|---|
| TC-01 | RF-1, RF-10 | Sí | Hugo |
| TC-02 | RF-2 | Sí | Hugo |
| TC-03 | RF-3 | Sí | Hugo |
| TC-04 | RF-4, RF-11 | Sí | Hugo |
| TC-05 | RF-5, RB-2, RB-7 | Sí, si RF-5 está listo | Hugo |
| TC-06 a TC-08 | Should | No (E4) | — |
| TNF-01 | RNF-1 seguridad | Sí | Ignacio |
| TNF-02 | RNF-2, RNF-6 carga | Sí | Hugo |
| TNF-04 | RNF-4 disponibilidad | Parcial (desde el 10-11) | Joaquín |
| TNF-05 | RNF-5 cobertura | Sí (cobertura de `src/lib`) | Hugo |
| TNF-06 | RNF-7 accesibilidad | Sí (revisión manual) | Gabriel |
| TNF-03 | RNF-3 usabilidad | Sí, con la validación de usuarios | Gabriel |

## Gestión de defectos

Cada defecto se registra en `registro_pruebas.md` con ID, severidad (crítico, mayor o menor), responsable y estado
(abierto, corregido o verificado). Un defecto crítico abierto el lunes 16 se menciona en la presentación.

## Preparación y datos de prueba

Las pruebas se realizarán en el entorno de E3, identificando
la versión del código mediante el hash del commit y
registrando si se utiliza el despliegue o el entorno local.

Se prepararán los siguientes datos ficticios:

| Dato | Propósito |
|---|---|
| Cuenta de cliente | Búsqueda, contacto, conversación y reseña |
| Cuenta de maestro | Recepción de contactos y mensajes |
| Cuenta de administrador | Revisión y aprobación de maestros |
| Cuenta de tercero | Comprobar restricciones de acceso |
| Maestro pendiente | Probar la aprobación administrativa |
| Documento ficticio | Comprobar la eliminación posterior a la aprobación |
| Maestro verificado con cobertura en Hualpén | Comprobar la búsqueda geográfica |
| Maestro no verificado | Comprobar su exclusión de resultados |
| Contacto con servicio confirmado | Habilitar una reseña válida |
| Contacto sin servicio confirmado | Comprobar restricciones para reseñar |

Los documentos de identidad utilizados serán ficticios y
estarán identificados como "DOCUMENTO FICTICIO SIN VALIDEZ".

Se registrarán los datos necesarios para reproducir cada
prueba sin publicar contraseñas, documentos personales
ni otras credenciales.

## Procedimientos de pruebas funcionales

| Caso | Preparación y procedimiento | Resultado esperado | Evidencia |
|---|---|---|---|
| TC-01 | Registrar un maestro nuevo con datos válidos y documento ficticio. Comprobar su estado y visibilidad. Registrar también un cliente y confirmar su correo. | El maestro queda pendiente de verificación y no aparece en búsquedas. El cliente puede iniciar sesión después de confirmar su correo. | `registro_pruebas.md` |
| TC-02 | Iniciar sesión como administrador y aprobar un maestro pendiente con documento ficticio. Comprobar su estado, visibilidad y eliminación del documento. | El maestro pasa a identidad verificada, aparece en las búsquedas correspondientes y su documento se elimina. | `registro_pruebas.md` |
| TC-03 | Buscar Gasfitería en Hualpén desde un punto manual. Comparar maestros verificados, cobertura y distancia. Repetir sin permiso de ubicación o con el mapa no disponible. | Solo aparecen maestros verificados con cobertura en la comuna, ordenados por distancia. La lista sigue disponible sin ubicación o mapa. | `registro_pruebas.md` |
| TC-04 | Iniciar sesión como cliente, abrir el perfil de un maestro verificado y disponible, pulsar Contactar e intercambiar mensajes. Intentar acceder a la conversación desde una cuenta ajena. | Se crea un contacto único, se abre la conversación, los mensajes aparecen sin recargar y un tercero no puede leerlos. | `registro_pruebas.md` |
| TC-05 | Confirmar un servicio, registrar una reseña de 1 a 5 estrellas con comentario e intentar repetirla para el mismo contacto. | Se guarda una sola reseña válida por contacto y se rechaza la duplicación. | `registro_pruebas.md` |

TC-05 se ejecutará cuando RF-5 esté disponible. Si no está
implementado, se registrará como bloqueado o no ejecutado,
sin considerarlo una prueba aprobada.

TC-06 a TC-08 quedan fuera del alcance de E3 y se
considerarán para E4.

## Procedimientos de pruebas no funcionales

| Caso | Herramienta o método | Procedimiento | Criterio de aceptación | Responsable |
|---|---|---|---|---|
| TNF-01 | API, navegador y consultas con distintos roles | Intentar acceder a documentos y conversaciones como visitante, tercero y rol indebido. | 100 % de accesos indebidos rechazados. | Ignacio |
| TNF-02 | k6 o Artillery | Simular 50 usuarios virtuales durante 15 minutos con mezcla de operaciones 60/20/20. Registrar condiciones y comparar mensajes enviados y persistidos. | p95 de búsqueda ≤ 3 s, errores ≤ 1 %, sin caída ni pérdida de mensajes. | Hugo |
| TNF-03 | Sesiones de validación y cuestionario SUS | Medir los pasos y el tiempo del registro de maestro y recopilar respuestas SUS. | Registro ≤ 3 pasos y ≤ 5 min; SUS ≥ 75. | Gabriel |
| TNF-04 | Monitor de disponibilidad | Realizar comprobaciones cada 5 minutos y registrar el periodo observado. | ≥ 95 % de comprobaciones correctas en 7 días. | Joaquín |
| TNF-05 | Vitest y TypeScript | Ejecutar `npm run test:coverage` y `npm run typecheck`. | Cobertura ≥ 70 % en módulos críticos y TypeScript sin errores. | Hugo |
| TNF-06 | Lighthouse y revisión manual | Comprobar navegación por teclado, foco, etiquetas, contraste y alternativa de lista al mapa. | Contraste ≥ 4,5:1 y cumplimiento de las comprobaciones funcionales de accesibilidad. | Gabriel |

Para TNF-02 se registrarán la configuración del equipo,
la red, el volumen de datos y los resultados de la carga.

Para TNF-04 se informará el periodo efectivamente medido.
Si todavía no se dispone de siete días completos, el
resultado será parcial y no se afirmará que cumple el
objetivo de siete días.

Para TNF-05 se identificará qué archivos pertenecen a los
módulos críticos y se registrará su cobertura individual.
La cobertura global no sustituye este criterio.

## Registro de resultados y evidencias

Cada ejecución funcional o de integración se documentará
en `docs/pruebas/registro_pruebas.md`, incluyendo fecha,
caso, commit, entorno, resultado, defectos y ejecutor.

Los resultados no funcionales se registrarán en
`docs/pruebas/mediciones_rnf.md`, incluyendo objetivo,
método, valor obtenido, veredicto y desviaciones.

Los resultados se clasificarán como:

- Aprobado: se cumplen los criterios de aceptación.
- Fallido: se ejecutó la prueba y no se cumplen.
- Bloqueado: una dependencia impide ejecutarla.
- No ejecutado: todavía no se ha realizado.
- Parcial: solo se completó una parte del procedimiento.

No se considerará aprobada una prueba sin evidencia
suficiente de su ejecución.

## Criterios de cierre de E3

Antes de cerrar el plan se revisará que:

1. Cada TC y TNF incluido tenga un resultado registrado
   o una justificación de por qué no se ejecutó.
2. Los defectos detectados estén documentados con
   severidad, responsable y estado.
3. Las mediciones no funcionales incluyan valores
   obtenidos y comparación con sus objetivos.
4. Los resultados parciales y las funcionalidades
   pendientes se declaren explícitamente.
5. La evidencia corresponda a una versión identificable
   del sistema.

## Requisitos aplazados para E4

| Requisito | Funcionalidad | Estado |
|---|---|---|
| RF-8 | Moderación de denuncias | Fuera del alcance de E3; previsto para E4 |
| RF-9 | Edición de perfil y disponibilidad | Fuera del alcance de E3; previsto para E4 |
