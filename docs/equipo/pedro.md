# Pedro Gajardo · Arquitectura y ciencias de la ingeniería

> Antes de empezar, lee [`COMO_TRABAJAMOS.md`](COMO_TRABAJAMOS.md). El porqué está en
> [`PLAN_FINAL.md`](../PLAN_FINAL.md) §3.1.

**Objetivo:** que la reputación use la fórmula de Laplace que pidió la profesora y que **influya de verdad en el
sistema**. En E3, C3 quedó bajo en parte porque el promedio solo se mostraba en el perfil; ahora también ordena la
búsqueda.

**La decisión ya está tomada (20-11):** Laplace por estrellas,

```
L = (n·r + 15) / (n + 5)
```

n = reseñas válidas, r = promedio real. Equivale a sumar un voto ficticio a cada estrella (1+2+3+4+5 = 15). Es el
promedio bayesiano de E3 con C = 3 fijo y m = 5. Se usa **solo para ordenar**; al usuario se le muestra el promedio
real y la cantidad («★ 4,6 · 12 reseñas»).

**Revisa tus PR:** Joaquín (y Hugo el de la función, porque él programó CI-2). **Tu trabajo lo usa:** Gabriel.

## Tareas

### 1. Contrato de la búsqueda con reputación · **domingo 22**

Escribe en el issue (y en el PR de la tarea 3) qué va a devolver `buscar_maestros`, para que Gabriel pueda empezar:

- Parámetro nuevo `p_orden text default 'distancia'` (`'distancia'` o `'reputacion'`). Con el valor por defecto la
  llamada actual sigue funcionando igual.
- Columnas nuevas en el resultado: `cantidad_resenas integer`, `promedio_resenas double precision` (null sin reseñas)
  y `puntaje_laplace double precision` (null sin reseñas).
- En TypeScript: `ResultadoBusqueda` (`src/lib/busqueda/resultados.ts`) suma `cantidadResenas`, `promedioResenas` y
  `puntajeLaplace`, y `FiltrosBusqueda` suma `orden: 'distancia' | 'reputacion'`.

### 2. Función y documento de CI-2 · **domingo 22 – lunes 23**

- `src/lib/reputacion/laplace.ts` con `puntajeLaplace(n: number, r: number): number | null` (null si n = 0) y
  `formatearPromedio(r, n)` → `"★ 4,6 · 12 reseñas"` (coma decimal, «1 reseña» en singular). Pruebas en
  `laplace.test.ts`: n = 0, 1, 5 y 50, valores fuera de rango y el ejemplo A/B/C de abajo.
- `promedioBayesiano.ts` se deja como está (sirve para la comparación del documento) pero deja de usarse en pantalla.
- Reescribe `docs/ciencias/CI-2_promedio_bayesiano.md` (o crea `CI-2_reputacion.md` y deja el anterior como historial)
  con esta estructura:
  1. **Disparador:** observación de la profesora en E3.
  2. **Alternativas:** (a) bayesiano con promedio global C (lo de E3); (b) Laplace por estrellas; (c) Laplace binaria
     `(positivas + 1)/(n + 2)`, donde positivas son las reseñas de 4 o más estrellas.
  3. **Formulación y supuestos** de cada una; muestra que (b) es (a) con C = 3 y m = 5.
  4. **Resultados** con los mismos maestros A, B y C de E3:

     | Maestro | n | r | (a) C = 4,3 | (b) Laplace | (c) binaria* |
     |---|---:|---:|---:|---:|---:|
     | A | 1 | 5,0 | 4,42 | 3,33 | 0,67 |
     | B | 5 | 4,6 | 4,45 | 3,80 | 0,86 |
     | C | 40 | 4,8 | 4,74 | 4,60 | 0,98 |

     \*Suponiendo que todas sus reseñas son de 4 o más estrellas. Comprueba tú las cifras.
  5. **Decisión:** (b), porque no depende del promedio global (una consulta menos y sin caso «sin valor»), es la que
     pidió la profesora y mantiene el orden C > B > A.
  6. **Limitación:** con C = 3 un maestro nuevo con 5 estrellas aparece con 3,3; por eso el valor suavizado no se
     muestra, solo ordena.
  7. **Influencia en el sistema:** orden «Mejor evaluados» en la búsqueda (tarea 3).
  8. **Efecto verificado:** orden obtenido con los datos reales de producción (tarea 4).

Commit: `feat(ci2): puntaje de Laplace con pruebas` y `docs(ci2): alternativas y decisión`.

### 3. `buscar_maestros` con reputación · **miércoles 25** · migración aditiva

Migración `20261125000000_buscar_maestros_reputacion.sql` que reemplaza `buscar_maestros` (archivo original:
`20261114120000_buscar_maestros.sql`) con el contrato de la tarea 1:

- Calcula `cantidad_resenas`, `promedio_resenas` y `puntaje_laplace` con las reseñas válidas. Cuando Diego agregue
  `resenas.oculta`, las ocultas no cuentan: coordina con él en el issue.
- Con `p_orden = 'reputacion'`: primero los que tienen reseñas, de mayor a menor `puntaje_laplace`; empate por
  distancia.
- Cuando Joaquín agregue la vigencia de la cédula (`maestros.identidad_vence_en`), filtra también los vencidos. Si su
  columna todavía no está, déjalo para un segundo PR.
- Como cambia el tipo de retorno, hay que hacer `drop function` y crearla de nuevo, con los mismos `grant`.
- Actualiza `src/lib/busqueda/buscarMaestros.ts` y el **respaldo sin PostGIS** (cálculo en el navegador) para que
  devuelvan los campos nuevos.

**Terminado cuando:** la búsqueda actual sigue funcionando sin cambios, con `p_orden = 'reputacion'` el orden coincide
con el puntaje, y hay pruebas del orden en `resultados.test.ts`. Avísale a Joaquín que la aplique y a Gabriel que ya
puede usarla. Commit: `db(busqueda): reputación y orden por Laplace [aditiva]`.

### 4. Efecto verificado y mediciones · **viernes 27**

- Ejecuta la búsqueda con los dos órdenes sobre los datos de producción y anota en el documento de CI-2 cuántos
  maestros cambian de posición y por qué. Eso es el «efecto verificado» de la iteración 6.
- Repite la medición de tiempo de la búsqueda (insumo de RNF-2) con la función nueva y anótala en
  `docs/pruebas/mediciones_rnf.md`.

## Informe y defensa

- **Informe (borrador el domingo 29 a las 18:00):** capítulo 4, las dos aplicaciones de ciencias de la ingeniería
  (CI-1 distancia y CI-2 reputación) con formulación, supuestos, procedimiento, resultados, límites y efecto en el
  sistema. Envíale el texto a Diego.
- **Defensa:** CI-1 y CI-2, como en E3. Prepara la respuesta a «¿por qué Laplace y no el bayesiano?» y «¿por qué C = 3?».

## Si te bloqueas

- Columnas de Diego (`oculta`) o de Joaquín (`identidad_vence_en`) → en su issue.
- Cómo se muestra en pantalla → Gabriel.
