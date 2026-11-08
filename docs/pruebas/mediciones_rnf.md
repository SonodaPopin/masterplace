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
| RNF-7 Accesibilidad | Teclado, foco, etiquetas, contraste ≥ 4,5:1 y lista equivalente al mapa | TNF-06 | Revisión manual y Lighthouse en registro y búsqueda | | | Gabriel |
| RNF-3 Usabilidad | Registro de maestro ≤ 3 pasos y ≤ 5 min; SUS ≥ 75 | TNF-03 | Sesiones de validación | | | Gabriel |

## Interpretación de desviaciones

- [Si un valor no se cumple: causa probable, qué se decidió y si genera una iteración en la bitácora.]
