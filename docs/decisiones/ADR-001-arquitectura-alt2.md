# ADR-001 · Arquitectura ALT-2: React + TypeScript + Supabase

- Estado: Aceptado
- Fecha: Avance Oral 1 (E2)
- Autor: Pedro (arquitectura). Completar con la versión final de la matriz de E2.

## Contexto

Seis estudiantes, 10 semanas, 300 horas-persona y un techo de $30.000 CLP al mes. El flujo Must exige autenticación,
archivos privados (cédulas), consultas geográficas (cobertura y distancia) y mensajería entre participantes, con
seguridad que no dependa solo de la interfaz (RNF-1).

## Alternativas (E1 §8.1)

1. **ALT-1:** monolito Django + PostgreSQL en un VPS.
2. **ALT-2:** React + TypeScript + Vite con Supabase (Auth, PostgreSQL/PostGIS, Storage, Realtime) y Leaflet.
3. **ALT-3:** React + API propia en Node.js + PostgreSQL administrado.

## Decisión

ALT-2. Puntaje ponderado de la matriz de E2: ALT-1 3,35, **ALT-2 4,05**, ALT-3 2,85. En el escenario de sensibilidad B:
3,35 / **3,90** / 3,15. ALT-2 gana en ambos escenarios.

> [Pedro: copiar aquí los criterios, los pesos y los puntajes por criterio desde la diapositiva de E2.]

## Consecuencias y trade-off

- Se sacrificó control sobre el backend (dependemos de las cuotas y la disponibilidad de Supabase) para obtener
  autenticación, almacenamiento privado y tiempo real ya resueltos, por la restricción de calendario.
- La seguridad queda en las políticas RLS de la base de datos: un error en una política expone datos. Se mitiga con
  TNF-01.
- El plan gratuito puede pausarse por inactividad y no incluye respaldos automáticos (RNF-10 queda a cargo del equipo).

## Verificación

- Integración 2 (13-11) con el flujo completo en la URL pública.
- TNF-01 (accesos indebidos rechazados) y TNF-02 (p95 de búsqueda ≤ 3 s con 50 usuarios).
