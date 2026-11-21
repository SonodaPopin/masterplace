# Diego Oyarzo · Coordinación, iteraciones y denuncias

> Antes de empezar, lee [`COMO_TRABAJAMOS.md`](COMO_TRABAJAMOS.md). El porqué está en
> [`PLAN_FINAL.md`](../PLAN_FINAL.md).

**Objetivo:** que el diseño se pueda defender como iterativo (en E3, C1 fue uno de los criterios más bajos), que el
equipo sepa cada día qué está atrasado, y completar RF-8 (moderación de denuncias), el único Must de E1 que falta.

**Revisa tus PR:** cualquiera del equipo. **Tu trabajo lo usa:** Gabriel (pantallas de denuncia) y Hugo (pruebas).

## Tareas

### 1. Tablero y seguimiento · **sábado 21**, después todos los días

- Comprueba que existe un issue por cada tarea de los seis archivos de esta carpeta, con responsable, fecha límite y
  enlace a la sección del archivo. (Gabriel los crea desde el plan; tú los revisas y mantienes.)
- Cada mañana: revisa el tablero y los comentarios diarios («Hice / Mañana / Me bloquea»). Si una tarea con fecha de
  hoy no avanzó o alguien está bloqueado, avísalo en el grupo y en el issue.
- **Lunes 23, reunión de planificación (30 min):** confirmar que los cinco contratos están fusionados o tienen fecha
  firme; acta en `docs/actas/2026-11-23.md` con la plantilla. Conduce quien no haya conducido ninguna reunión todavía.

### 2. Respuesta a las observaciones de E3 · **domingo 22**

En `docs/gestion/bitacora_iteraciones.md`, agrega la sección «Observaciones de E3 (presentación oral)», con el mismo
formato de la de E2 (número, observación, qué cambiamos, evidencia, estado). Son O3 a O8 de `PLAN_FINAL.md` §2. Al
principio el estado es «En curso»; actualízalo el domingo 29.

Commit: `docs(bitacora): observaciones de E3`.

### 3. Denuncias en la base · contrato el **lunes 23**, terminado el **miércoles 25** · migración aditiva

Migración `20261123000000_denuncias.sql`:

- Tipo `motivo_denuncia` = `ofensiva`, `falsa`, `datos_personales`, `otro`; tipo `estado_denuncia` = `pendiente`,
  `aceptada`, `descartada`.
- Tabla `denuncias`: `id`, `resena_id` (FK), `denunciante_id`, `motivo`, `detalle text` (≤ 500), `estado`,
  `creada_en`, `revisor_id`, `revisada_en`. Una denuncia por reseña y denunciante (`unique (resena_id,
  denunciante_id)`).
- Columna `resenas.oculta boolean not null default false`.
- RLS: el denunciante ve sus denuncias; el admin ve todas. Sin escritura directa.
- Funciones `security definer`:
  - `denunciar_resena(p_resena_id uuid, p_motivo motivo_denuncia, p_detalle text default null) returns uuid`: solo el
    maestro reseñado (errores `SOLO_MAESTRO_RESENADO`, `YA_DENUNCIADA`).
  - `listar_denuncias_pendientes()`: solo admin; devuelve la denuncia con la reseña (calificación, comentario,
    fecha) y el nombre del maestro, sin datos del cliente.
  - `resolver_denuncia(p_id uuid, p_aceptar boolean) returns void`: solo admin; si se acepta, `resenas.oculta =
    true`. Anota en `auditoria`.
- Modifica `obtener_resenas_maestro` y `obtener_estadisticas_reputacion` (`20261114190000_rf5_resenas_publicas.sql`)
  para que no cuenten las reseñas ocultas. Avísale a Pedro, porque su búsqueda también debe excluirlas.

Servicio `src/features/denuncias/servicioDenuncias.ts` (el **contrato**, súbelo el lunes 23 aunque la migración llegue
el miércoles):

```ts
export type MotivoDenuncia = 'ofensiva' | 'falsa' | 'datos_personales' | 'otro'
export type DenunciaPendiente = {
  id: string
  motivo: MotivoDenuncia
  detalle: string | null
  creadaEn: string
  resena: { id: string; calificacion: number; comentario: string | null; creadaEn: string }
  maestroNombre: string
}
export async function denunciarResena(resenaId: string, motivo: MotivoDenuncia, detalle?: string): Promise<void>
export async function listarDenunciasPendientes(): Promise<DenunciaPendiente[]>
export async function resolverDenuncia(id: string, aceptar: boolean): Promise<void>
export function traducirErrorDenuncia(mensaje: string): string
```

Las pantallas (botón «Denunciar» en el perfil y pestaña en el panel de admin) las hace Gabriel.

**Recorte:** la denuncia de «servicio no realizado» (el cliente denuncia una solicitud) queda fuera salvo que sobre
tiempo (`PLAN_FINAL.md` §7 y §5.1).

**Terminado cuando:** en la base local, un tercero no puede denunciar, el maestro denuncia una vez, el admin la acepta
y la reseña deja de verse y de contar en el promedio. Avísale a Joaquín que la aplique. Commits:
`feat(denuncias): contrato del servicio` y `db(denuncias): tabla, funciones y reseñas ocultas [aditiva]`.

### 4. Segunda validación con usuarios · invitaciones hasta el **jueves 26**

Gabriel diseña y analiza la validación del sábado 28; tú consigues a las personas, para que él pueda dedicarse al
frontend.

- Invitar **5 a 7 personas externas**: al menos 3 maestros (lo más importante: el registro falló en E3) y 2 clientes.
  Pueden repetir participantes de E3 (sirve para comparar), pero indícalo.
- Confirmar hora del sábado 28 con cada uno y pasarle la lista a Gabriel el jueves 26.

### 5. Iteraciones 6, 7 y 8 · **domingo 29**

En la bitácora, con el formato de las anteriores (disparador → alternativas → decisión → efecto verificado). El
contenido está en `PLAN_FINAL.md` §3.1, §3.2 y §3.4; el efecto lo aportan:

| Iteración | Tema | Efecto verificado lo aporta |
|---|---|---|
| 6 | Laplace por estrellas | Pedro (orden antes y después, viernes 27) |
| 7 | Solicitud de servicio | Hugo (TA-02 a TA-04) e Ignacio (pruebas en la base) |
| 8 | Cédula: RUT, número oculto, vigencia | Gabriel (validación del sábado 28: ¿los maestros completan el registro?) |

Actualiza también el efecto de la Iteración 5 con los resultados del sábado 28.

## Informe y defensa

- **Informe:** eres el editor. Juntas las secciones que te envían el domingo 29 a las 18:00 y escribes:
  - el resumen ejecutivo (máximo 2 páginas, para alguien no técnico);
  - capítulo 1 (introducción y alcance final), capítulo 2 (problema y contexto) y capítulo 3 (requisitos finales con
    los cambios desde E1 justificados, espacio de soluciones, matriz de decisión, **las iteraciones** e intercambios);
  - capítulo 8 (conclusiones), con aportes de todos;
  - los anexos: bitácora, actas, tabla de correspondencia ABET y declaración de IA de cada integrante.

  Informe listo el **lunes 30**.
- **Defensa:** problema, observaciones e iteración más significativa, como en E3. Controlas el tiempo en los ensayos.

## Si te bloqueas

- SQL, RLS o funciones → Ignacio.
- Aplicar en producción → Joaquín.
