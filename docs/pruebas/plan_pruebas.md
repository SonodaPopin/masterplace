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
| TC-02 | RF-2, RF-8 | Sí | Hugo |
| TC-03 | RF-3, RF-9 | Sí (sin RF-9) | Hugo |
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
