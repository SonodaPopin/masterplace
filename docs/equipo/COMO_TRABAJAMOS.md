# Cómo trabajamos hasta la entrega final

Léelo una vez antes de empezar (10 minutos). Tu lista de tareas está en tu archivo de esta carpeta
(`diego.md`, `gabriel.md`, `hugo.md`, `ignacio.md`, `joaquin.md`, `pedro.md`). El porqué de cada decisión está en
[`docs/PLAN_FINAL.md`](../PLAN_FINAL.md).

**Regla principal:** cada archivo trae lo necesario para trabajar sin preguntarle a nadie. Si algo no está claro, la
duda se escribe **en el issue de la tarea** y se etiqueta al dueño de lo que necesitas (ver §5), no se resuelve por
WhatsApp privado. Así la respuesta queda para todos.

## 1. Qué es un «contrato» y por qué lo hacemos primero

En E3 trabajamos en cadena: uno subía su parte a `main` y recién ahí el siguiente podía empezar la suya. La profesora lo
llamó trabajo «retroactivo». El contrato evita eso.

**Un contrato es el acuerdo, escrito en código, de cómo se conectan dos partes**: qué funciones existen, cómo se
llaman, qué reciben y qué devuelven. Es como acordar la forma de un enchufe antes de fabricar el aparato y la pared:
cada uno fabrica su lado al mismo tiempo, y al final encajan.

Ejemplo real de este plan. Gabriel necesita mostrar en el chat una tarjeta de «Solicitud de servicio», e Ignacio tiene
que crear la tabla y las reglas en la base. Sin contrato, Gabriel espera a que Ignacio termine. Con contrato:

1. **Ignacio, primero (domingo 22),** sube un PR chico con:
   - la **migración aditiva**: la tabla `solicitudes_servicio` y las funciones `crear_solicitud`,
     `responder_solicitud`, `cancelar_solicitud` y `marcar_realizada`, ya funcionando con sus reglas básicas;
   - el **archivo de servicio en TypeScript** (`src/features/solicitudes/servicioSolicitudes.ts`) con los tipos y una
     función por cada llamada a la base:

     ```ts
     export type EstadoSolicitud = 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada' | 'realizada'
     export type Solicitud = {
       id: string
       contactoId: string
       descripcion: string
       fechaAcordada: string        // ISO 8601
       estado: EstadoSolicitud
       puedeMarcarRealizada: boolean
       puedeResenar: boolean
     }
     export async function crearSolicitud(contactoId: string, descripcion: string, fechaAcordada: string): Promise<string>
     export async function listarSolicitudes(contactoId: string): Promise<Solicitud[]>
     export async function responderSolicitud(id: string, aceptar: boolean, motivo?: string): Promise<void>
     export async function cancelarSolicitud(id: string): Promise<void>
     export async function marcarRealizada(id: string): Promise<void>
     ```

2. Ese PR se fusiona en `premain` y Joaquín aplica la migración en Supabase el mismo día.
3. **Desde el lunes 23, en paralelo:** Gabriel construye la tarjeta llamando a esas funciones, sin saber cómo están
   hechas por dentro, e Ignacio sigue con el resto (las reglas que cambian el comportamiento actual, las pruebas). Si
   Ignacio necesita cambiar algo por dentro, puede hacerlo sin romper la pantalla mientras no cambie los nombres ni los
   tipos.

**Cambiar un contrato** (renombrar una función, agregar un parámetro obligatorio, cambiar un tipo) solo se hace
avisando en el issue a quien lo usa. Agregar algo opcional no rompe nada.

### Contratos de este plan

| Contrato | Dueño | Fecha | Lo usa |
|---|---|---|---|
| Solicitud de servicio (tabla, funciones y `servicioSolicitudes.ts`) | Ignacio | dom 22 | Gabriel, Hugo |
| RUT y vigencia de la cédula (columnas, formato del RUT, errores) | Joaquín | dom 22 | Gabriel, Pedro, Hugo |
| Validación de RUT (`src/lib/rut/rut.ts`: nombres de funciones) | Hugo | dom 22 | Gabriel |
| Búsqueda con reputación (columnas nuevas y parámetro de orden de `buscar_maestros`) | Pedro | dom 22 | Gabriel |
| Denuncias (tabla, funciones y `servicioDenuncias.ts`) | Diego | lun 23 | Gabriel, Hugo |

## 2. Migraciones: cuáles se aplican altiro y cuáles el viernes 27

Tenemos una sola base de datos (la de producción, la misma de la demo). Por eso las migraciones se separan en dos
tipos:

| Tipo | Qué hace | Ejemplo | Cuándo se aplica en producción |
|---|---|---|---|
| **Aditiva** | Solo agrega: tablas nuevas, columnas nuevas que aceptan `null`, funciones nuevas | `solicitudes_servicio`, `resenas.solicitud_id`, `denuncias` | **El mismo día que se fusiona en `premain`.** La app publicada no la usa todavía, así que no la afecta |
| **De cambio** | Cambia cómo funciona algo que ya existe | El contacto vuelve a nacer `abierto`; la reseña exige solicitud realizada | **Solo el viernes 27**, junto con el frontend que la usa |

- Cada migración es un archivo nuevo en `supabase/migrations/` (nunca se edita una ya aplicada).
- En el título del PR se marca el tipo: `db(solicitudes): tabla y funciones [aditiva]` o `[de cambio]`.
- Las aplica **Joaquín** (o Ignacio, si tiene acceso al panel) y las anota en la tabla «Migraciones aplicadas en
  producción» de `supabase/README.md`, con fecha y quién. Así evitamos lo que pasó con R-11 en E3.
- Antes de pedir que se aplique, la migración se prueba en una base local
  (`npx supabase@latest start` y `npx supabase@latest db reset`, que aplica todas las migraciones y la semilla; requiere
  Docker) o, si no tienes Docker, se le pide a Ignacio que la pruebe.

## 3. Flujo de cada tarea, paso a paso

1. **Toma tu issue** en el tablero: muévelo a «En curso» (máximo 2 a la vez).
2. **Crea tu rama desde `premain` actualizado:**

   ```bash
   git switch premain
   git pull
   git switch -c tunombre/tema
   ```

3. **Trabaja y haz commits pequeños** (`tipo(área): descripción`, ver `CONTRIBUTING.md`). Antes de subir:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

4. **Sube la rama y abre el PR hacia `premain`:**

   ```bash
   git push -u origin tunombre/tema
   gh pr create --base premain --fill
   ```

   En la descripción del PR escribe `Closes #número-del-issue` y `Horas: X` (las horas reales de la tarea).
5. **Pide revisión** a la persona que indica la tabla de `CONTRIBUTING.md` y mueve el issue a «En revisión».
6. **Se fusiona** con «Squash and merge» cuando la CI está en verde y hay una aprobación. GitHub no deja hacerlo antes.
   El issue se cierra solo.
7. **Revisa los PR que te asignen dentro del mismo día.** Un PR esperando revisión bloquea a otro integrante.

`main` solo la actualiza Joaquín (PR `premain → main`), y es lo único que publica Vercel. Durante la semana se prueba en
local con `npm run dev` (que usa la base de producción a través de `.env.local`).

## 4. Tablero

- Tablero de GitHub Projects del repositorio, con una tarjeta por cada issue: Backlog → Lista → En curso → En
  revisión → Hecho.
- Cada issue tiene responsable, fecha límite y horas estimadas, y enlaza a la sección de tu archivo donde está el
  detalle.
- **Cada día**, antes de las 22:00, deja un comentario corto en el issue en el que estás trabajando:
  «Hice: … / Mañana: … / Me bloquea: …». Reemplaza las reuniones diarias.
- Diego revisa el tablero cada mañana y avisa en el grupo si algo está atrasado o bloqueado.

## 5. Si te bloqueas

| Te bloquea | Pregúntale a |
|---|---|
| Algo de la base de datos, RLS o migraciones | Ignacio |
| Supabase en producción, Vercel, la CI o las reglas del repo | Joaquín |
| La búsqueda, PostGIS, Laplace o la arquitectura | Pedro |
| Las pruebas, Playwright o la validación del RUT | Hugo |
| Pantallas, estilos o experiencia de usuario | Gabriel |
| El plan, las fechas, el tablero o el informe | Diego |

Escríbelo en el issue y etiquétalo (`@usuario`). Si en 3 horas no hay respuesta y te impide avanzar, avísalo en el grupo
y pasa a otra tarea tuya que no dependa de eso.

**Las decisiones del plan no se discuten de nuevo en cada tarea.** Si crees que una está mal, propón el cambio con un
PR a `docs/PLAN_FINAL.md` explicando por qué: si se acepta, eso mismo se documenta como iteración.

## 6. Qué significa «terminado»

Una tarea está terminada cuando:

- [ ] cumple lo que dice «Terminado cuando» en tu archivo;
- [ ] tiene pruebas, si es lógica (funciones de `src/lib`, funciones SQL);
- [ ] la CI está en verde y el PR está fusionado en `premain`;
- [ ] si es una migración aditiva, está aplicada en producción y anotada en `supabase/README.md`;
- [ ] las horas están registradas en el PR.

## 7. Cada uno, además

- **Informe (E4):** cada uno escribe la sección de su tema, como indica su archivo. Borrador el domingo 29 a las 18:00.
- **Defensa (E5):** cada uno expone el tema que construyó. Ensayos el domingo 29 y el lunes 30.
- **Declaración de IA:** una línea por persona en el anexo del informe (qué herramienta, en qué y para qué).
