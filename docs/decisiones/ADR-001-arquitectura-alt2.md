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

### Criterios, pesos y puntajes de E2

| Criterio | Peso | ALT-1 (Django) | ALT-2 (Supabase) | ALT-3 (Node) | Justificación |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Factibilidad de calendario** | 25% | 3 | **4** | 2 | Recurso más escaso (300 h-persona); Supabase ahorra tiempo al no construir backend desde cero[cite: 10, 11]. |
| **Cobertura del flujo Must** | 20% | 4 | **4** | 3 | Demostración en vivo como condición de aprobación del piloto[cite: 10, 11]. |
| **Privacidad y seguridad** | 20% | 3 | **4** | 3 | Manejo de cédulas, chat, RNF-1 y cumplimiento Ley 19.628 (RLS y buckets privados)[cite: 10, 11]. |
| **Costo y operación** | 15% | 4 | **5** | 3 | Respeto estricto del techo presupuestario de $30.000/mes (aprovechando el plan gratuito)[cite: 10, 11]. |
| **Mantenibilidad y despliegue** | 10% | 3 | **4** | 3 | Cumplimiento de los requisitos no funcionales RNF-5 y RNF-9[cite: 10, 11]. |
| **Rendimiento y continuidad** | 10% | 3 | **3** | 4 | Soporte adecuado para la carga baja estimada de 50 usuarios concurrentes[cite: 10, 11]. |
| **Total Ponderado / 5** | **100%** | **3,35** | **4,05** | **2,85** | **ALT-2 gana por calendario, costo y privacidad**[cite: 10, 11]. |

## Consecuencias y trade-off

- Se sacrificó control sobre el backend (dependemos de las cuotas y la disponibilidad de Supabase) para obtener
  autenticación, almacenamiento privado y tiempo real ya resueltos, por la restricción de calendario.
- La seguridad queda en las políticas RLS de la base de datos: un error en una política expone datos. Se mitiga con
  TNF-01.
- El plan gratuito puede pausarse por inactividad y no incluye respaldos automáticos (RNF-10 queda a cargo del equipo).

## Verificación

- Integración 2 (13-11) con el flujo completo en la URL pública.
- TNF-01 (accesos indebidos rechazados) y TNF-02 (p95 de búsqueda ≤ 3 s con 50 usuarios).
