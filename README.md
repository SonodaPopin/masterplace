# MasterPlace

Plataforma web para encontrar maestros de oficios en el Gran Concepción, con verificación de identidad,
búsqueda por comuna y cercanía, mensajería interna y reseñas ligadas a un servicio confirmado.

Proyecto Semestral · Proyecto Informático · Ingeniería Civil Informática, UdeC · 2026 · Grupo 8.

> **Próximo hito: Avance Oral 2 (R3, Revisión Crítica de Diseño), martes 17 de noviembre de 2026.**
> El plan día a día está en [docs/PLAN_E3.md](docs/PLAN_E3.md) y las tareas de cada integrante en [docs/equipo/](docs/equipo/).

## Equipo

| Integrante | Rol | Tareas |
|---|---|---|
| Diego Oyarzo | Coordinación y producto | [docs/equipo/diego.md](docs/equipo/diego.md) |
| Gabriel Huerta | Experiencia de usuario y frontend | [docs/equipo/gabriel.md](docs/equipo/gabriel.md) |
| Hugo Flores | Calidad y pruebas | [docs/equipo/hugo.md](docs/equipo/hugo.md) |
| Pedro Gajardo | Arquitectura y liderazgo técnico | [docs/equipo/pedro.md](docs/equipo/pedro.md) |
| Joaquín Hernández | Operación y despliegue | [docs/equipo/joaquin.md](docs/equipo/joaquin.md) |
| Ignacio Barría | Datos y seguridad | [docs/equipo/ignacio.md](docs/equipo/ignacio.md) |

## Alcance del MVP (requisitos Must de E1)

Flujo principal que se debe poder demostrar en vivo:

1. Un maestro se registra y sube una cédula ficticia (RF-1). Un cliente crea su cuenta (RF-10).
2. Un administrador revisa la cédula y aprueba o rechaza la identidad (RF-2).
3. El cliente busca por oficio, comuna y disponibilidad, en mapa y lista, ordenado por distancia (RF-3, CI-1).
4. El cliente contacta al maestro y conversan por chat interno (RF-4, RF-11).
5. Con el servicio confirmado, el cliente deja una reseña única por contacto (RF-5, CI-2).

Fuera de alcance (Won't): pagos, contratos, app móvil nativa, OCR, seguimiento en tiempo real y expansión nacional.

## Tecnologías (ALT-2, ver [ADR-001](docs/decisiones/ADR-001-arquitectura-alt2.md))

- Frontend: React 19 + TypeScript + Vite, React Router, Leaflet con teselas de OpenStreetMap.
- Backend administrado: Supabase (Auth, PostgreSQL + PostGIS, Storage privado, Realtime) con políticas RLS.
- Pruebas: Vitest con cobertura (v8). Integración continua: GitHub Actions. Publicación: Vercel.

## Instalación local

Requisitos: Node.js 20 o superior y Git.

```bash
git clone <URL-del-repositorio>
cd masterplace
npm ci
cp .env.example .env.local   # completar con la URL y la anon key del proyecto Supabase (Joaquín las comparte por canal privado)
npm run dev                  # http://localhost:5173
```

Base de datos: las migraciones están en `supabase/migrations/` y los datos ficticios en `supabase/seed.sql`
(ver [supabase/README.md](supabase/README.md)).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` | Revisión de estilo (ESLint) |
| `npm run typecheck` | Comprobación de tipos de TypeScript |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run test:coverage` | Pruebas con informe de cobertura (meta RNF-5: 70 % en módulos críticos) |
| `npm run build` | Compilación de producción |

## Estructura

```
src/
  features/        una carpeta por módulo: cuentas, busqueda, admin, contacto, resenas
  lib/geo/         CI-1 distancia Haversine (y su contraste con PostGIS)
  lib/reputacion/  CI-2 promedio bayesiano
  lib/supabase.ts  cliente de Supabase (solo clave pública)
supabase/
  migrations/      esquema, políticas RLS y funciones SQL versionadas
  seed.sql         datos ficticios de desarrollo
docs/
  PLAN_E3.md       plan día a día hasta el 17-11 y reparto de la presentación
  equipo/          tareas diarias por integrante
  decisiones/      ADR: decisiones de arquitectura
  gestion/         bitácora de iteraciones, horas y costos, riesgos
  pruebas/         plan de pruebas, registro de pruebas y defectos, mediciones RNF
  validacion/      plan y resultados de validación con usuarios (SUS)
  ciencias/        desarrollo de CI-1 y CI-2
  actas/           actas de reunión
```

## Cómo trabajamos

Ramas, commits y revisión: [CONTRIBUTING.md](CONTRIBUTING.md). La regla es **un avance pequeño cada día por
persona**, en su rama y con pull request revisado por otro integrante. El historial del repositorio es evidencia para
R3-C2 ("contribución distribuida e integración continua funcionando") y para la coevaluación (R6).

## Datos y privacidad

Solo datos ficticios hasta que la política de §5.3 esté implementada y revisada. Las cédulas de prueba deben decir
«DOCUMENTO FICTICIO SIN VALIDEZ». Nunca subir `.env.local`, claves `service_role` ni datos de personas reales.
