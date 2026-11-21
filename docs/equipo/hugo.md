# Hugo Flores · Calidad y pruebas

> Antes de empezar, lee [`COMO_TRABAJAMOS.md`](COMO_TRABAJAMOS.md). El porqué está en
> [`PLAN_FINAL.md`](../PLAN_FINAL.md) §3.5.

**Objetivo:** responder la observación de la profesora en E3: «¿solo hicieron pruebas unitarias? Faltó algún test de
navegabilidad, un usuario que intente sobrepasar los límites del sistema». Al final tenemos tres capas: unitarias (ya
están), **extremo a extremo automatizadas** con Playwright y **pruebas de abuso** documentadas.

**Revisa tus PR:** Gabriel. **Tú revisas:** los PR de Gabriel (tabla de `CONTRIBUTING.md`) y el de la función de
Laplace de Pedro.

## Tareas

### 1. Validación de RUT · contrato el **domingo 22**, terminada el **lunes 23**

`src/lib/rut/rut.ts`, funciones puras (sin Supabase). El domingo sube el PR con los nombres y tipos; el lunes, la
implementación y las pruebas:

```ts
export function limpiarRut(texto: string): string          // "12.345.678-5" → "123456785"
export function calcularDigitoVerificador(cuerpo: string): string  // módulo 11; devuelve "0"–"9" o "K"
export function validarRut(texto: string): string | undefined    // undefined si es válido; si no, el mensaje de error
export function normalizarRut(texto: string): string        // "12.345.678-k" → "12345678-K" (formato que se guarda)
export function formatearRut(texto: string): string         // "123456785" → "12.345.678-5" (para mostrar)
```

- Mensajes de `validarRut`: «Escribe tu RUT.», «El RUT no es válido: revisa el número y el dígito verificador.»
- Pruebas en `rut.test.ts`: RUT válidos con y sin puntos, con guion y sin guion, con K mayúscula y minúscula; dígito
  incorrecto; vacío; letras; demasiado corto; con espacios.
- El formato que se guarda en la base (`normalizarRut`) lo acordaste con Joaquín: sin puntos, con guion y K
  mayúscula. Confírmalo en su issue.

Commit: `feat(rut): validación con dígito verificador`.

### 2. Playwright del flujo principal · **jueves 26**

- Instala Playwright (`npm i -D @playwright/test`, `npx playwright install chromium`) y crea `e2e/` y
  `playwright.config.ts`. Script `npm run e2e`.
- Las pruebas corren contra una **base local** (`npx supabase@latest start` + `db reset`, que carga la semilla) y
  `npm run dev` apuntando a ella. Así no se tocan datos de producción ni se usan contraseñas reales.
- Casos (uno por archivo):
  1. `registro-cliente.spec.ts`: crear cuenta de cliente e iniciar sesión.
  2. `busqueda.spec.ts`: buscar Gasfitería en Hualpén y ver resultados verificados.
  3. `contacto-solicitud-resena.spec.ts`: contactar, enviar un mensaje, crear una solicitud con fecha de hace 3 horas,
     aceptarla como maestro, marcarla realizada y dejar la reseña. Este caso depende de las pantallas de Gabriel;
     escríbelo cuando estén en `premain` (miércoles 25 o jueves 26).
  4. `movil.spec.ts`: el caso 2 con viewport de 375 px.
- Job nuevo `e2e` en `.github/workflows/ci.yml` (pídele a Joaquín que lo revise): levanta Supabase local en el runner,
  carga la semilla y corre Playwright. Si no alcanza a quedar en la CI, corre las pruebas en tu computador y registra
  el resultado; se declara como límite.

Commit: `test(e2e): flujo principal con Playwright`.

### 3. Pruebas de abuso · **viernes 27**

Un usuario que intenta superar los límites. Regístralas en `docs/pruebas/registro_pruebas.md` con ID (TA-01, TA-02…),
qué se intentó, cómo, resultado esperado, resultado obtenido y veredicto. Las que se puedan automatizar, en Playwright;
las demás, a mano sobre la versión local o la publicada (con las cuentas de prueba).

| ID | Intento | Esperado |
|---|---|---|
| TA-01 | Un cliente entra a `/admin` | No ve el panel |
| TA-02 | Reseñar sin solicitud realizada (desde la pantalla y llamando a la API con `supabase-js`) | Rechazado |
| TA-03 | Reseñar dos veces la misma solicitud | Rechazado |
| TA-04 | Marcar realizada antes de 2 h | Rechazado |
| TA-05 | Un tercero lee el chat o una solicitud ajena por la API con la clave anónima y su propia sesión | Sin datos |
| TA-06 | Abrir la URL de una cédula sin ser admin, o una URL firmada vencida | Sin acceso |
| TA-07 | Subir un `.exe` renombrado a `.jpg` y un archivo de 50 MB como cédula | Rechazado |
| TA-08 | `<script>alert(1)</script>` en la descripción del maestro, el chat y la reseña | Se muestra como texto |
| TA-09 | `' or 1=1 --` y textos de 10.000 caracteres en la búsqueda y los formularios | Sin error ni datos extra |
| TA-10 | Recargar a mitad del registro de maestro, botón «atrás», sesión expirada | El usuario puede seguir o se le explica |
| TA-11 | Navegar todo el flujo solo con teclado | Se puede completar |
| TA-12 | RUT de otra persona ya registrado | Rechazado con mensaje claro |

Lo que quedó **parcial en E3**: TA-05 y TA-06 completan TNF-01 (seguridad por API como tercero y por la URL del
archivo). Si alcanzas, repite la carga de TNF-02 sumando mensajes (RNF-6). Actualiza los veredictos en
`docs/pruebas/mediciones_rnf.md`.

Cada falla es un defecto en `registro_pruebas.md` con severidad y responsable, y un issue para quien deba corregirlo.

Commit: `test(abuso): TA-01 a TA-12`.

## Informe y defensa

- **Informe (borrador el domingo 29 a las 18:00):** capítulo 5, verificación: estrategia en tres capas, cobertura
  (`npm run test:coverage`), resultados de Playwright y de las pruebas de abuso, cada RNF con meta, método, valor y
  veredicto, defectos con su estado y la matriz de trazabilidad requisito ↔ prueba. Envíale el texto a Diego.
- **Defensa:** pruebas y RNF, como en E3.

## Si te bloqueas

- Supabase local o la CI → Joaquín.
- Una pantalla que todavía no existe → Gabriel, en el issue; mientras, avanza con las pruebas de abuso por API.
