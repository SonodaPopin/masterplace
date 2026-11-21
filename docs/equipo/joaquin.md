# Joaquín Hernández · Operación, despliegue y costos

> Antes de empezar, lee [`COMO_TRABAJAMOS.md`](COMO_TRABAJAMOS.md). El porqué está en
> [`PLAN_FINAL.md`](../PLAN_FINAL.md).

**Objetivo:** que el repositorio público aplique solo las reglas de trabajo, que producción reciba las migraciones en
orden y con registro, y que la demo tenga plan B. Eres el único `admin` del repositorio y el dueño de Vercel, así que
varias de estas tareas solo las puedes hacer tú.

**Revisa tus PR:** Ignacio. **Tú revisas:** los PR de Pedro, el job de Playwright de Hugo y los cambios de CI.

## Tareas

### 1. Seguridad del repositorio público · **sábado 21** (lo más urgente)

Los comandos exactos están en el archivo que te pasó Gabriel por WhatsApp (`Configuracion_repo_publico.md`, fuera del
repositorio). Resumen:

1. **Rotar las credenciales de las cuentas ficticias de la semilla en producción** (paso 0.1 del archivo) y compartir
   la clave nueva por WhatsApp, nunca en el repositorio. **Antes del sábado 28** como máximo.
2. Reglas de ramas (*rulesets*):
   - `main`: solo el admin fusiona, siempre por PR y con la CI `verificar` en verde; sin force-push ni borrado.
   - `premain`: PR obligatorio, 1 aprobación, CI en verde; sin force-push ni borrado.
   - Si GitHub no permite la regla *Restrict updates*, usa `.github/CODEOWNERS` con tu usuario y revisión
     obligatoria del dueño en `main`.
3. Activar escaneo de secretos con bloqueo al hacer push, alertas de Dependabot y CodeQL.
4. Vercel → Settings → Git: comprobar que **Git Fork Protection** está activo.

**Terminado cuando:** un push directo a `premain` es rechazado, un PR a `main` de otro integrante no se puede
fusionar, y la pestaña *Security* muestra los tres análisis activos. Pídele a Gabriel que intente fusionar un PR suyo a
`main` para comprobarlo.

### 2. Contrato de RUT y vigencia · **domingo 22** · migración aditiva

Migración `20261122010000_rut_y_vigencia.sql`:

- **RUT:** `maestros_privado.rut` ya existe (`unique`), pero el formulario nunca lo llenó. Agrega una función
  `rut_valido(text) returns boolean` (formato `12345678-K`: sin puntos, con guion, K mayúscula, dígito verificador por
  módulo 11) y un `check (public.rut_valido(rut))`. El formato lo acuerdas con Hugo, que hace la misma validación en
  TypeScript (`src/lib/rut/rut.ts`). El maestro guarda su RUT con
  `supabase.from('maestros_privado').insert({ id: maestroId, rut })`: la política `maestros_privado_propio` ya lo
  permite. Si el RUT ya existe, la base devuelve el error `23505`; Gabriel lo muestra como «Este RUT ya está
  registrado».
- **Vigencia de la cédula (90 días):** columna `maestros.identidad_vence_en timestamptz`. Modifica `revisar_identidad`
  (`20261113120000_revisar_identidad.sql`; avísale a Ignacio, que la escribió) para que al aprobar guarde
  `now() + interval '90 days'`. A los maestros ya verificados, dales `now() + interval '90 days'` en la misma
  migración.
- Anota en el issue los nombres finales para Gabriel (formulario y aviso al maestro) y Pedro (filtro de la búsqueda).
- Comprueba que, cuando un maestro vencido sube una cédula nueva, aparece en el panel de moderación
  (`src/features/admin/api.ts`, `listarPendientes`). Si no aparece, anótalo en el issue para Gabriel.

**Recorte:** si nos atrasamos, la vigencia se documenta y no se implementa (`PLAN_FINAL.md` §7). El RUT no se recorta.

Commit: `db(cedula): RUT válido y vigencia de 90 días [aditiva]`.

### 3. Registro de migraciones en producción · **domingo 22** y cada vez que apliques una

En `supabase/README.md`, agrega la tabla «Migraciones aplicadas en producción» con: archivo, fecha, quién la aplicó y
comprobación hecha. Complétala con las que ya están aplicadas (hasta `20261114190000`).

- Las **aditivas** las aplicas el mismo día que se fusionan en `premain` (las de Ignacio, Pedro, Diego y la tuya).
- Las **de cambio** (la de Ignacio del martes 24) solo el **viernes 27**.

Commit: `docs(supabase): registro de migraciones aplicadas`.

### 4. CI y `CONTRIBUTING.md` · **martes 24**

- `.github/dependabot.yml` semanal para `npm` y `github-actions`.
- Umbral de cobertura en `vitest.config.ts` (`coverage.thresholds`, por ejemplo 70 % de líneas en `src/lib`) para que
  la CI falle si baja.
- Actualiza `CONTRIBUTING.md`: las reglas de ramas ahora las aplica GitHub; agrega la sección de migraciones aditivas y
  de cambio de `COMO_TRABAJAMOS.md` §2.
- Revisa el job de Playwright de Hugo cuando lo suba.

Commit: `ci: dependabot y umbral de cobertura`.

### 5. Congelamiento · **viernes 27**

1. Aplica la migración de cambio de Ignacio (`20261124000000_resena_exige_solicitud.sql`) y anótala.
2. PR `premain → main`; comprueba que Vercel publica la versión nueva.
3. Recorre el flujo completo en la versión publicada (registro de maestro con RUT, búsqueda, contacto, solicitud,
   reseña, denuncia).
4. Borra la cuenta de prueba «Cliente Prueba Claude» y su contacto vacío con Ricardo Venegas Orellana. Recuerda que
   Supabase no deja borrar un perfil con mensajes enviados: primero sus mensajes y contactos.

### 6. Plan B de la demo · **lunes 30**

- Entorno local probado con datos cargados (Supabase local + `npm run dev`) en el computador que se usará en la
  defensa.
- Video de contingencia del flujo completo (solo se usa si la profesora lo autoriza).
- Sesiones abiertas antes de entrar: admin, cliente y maestro (celular).

## Informe y defensa

- **Informe (borrador el domingo 29 a las 18:00):**
  - Capítulo 6: costo estimado frente a ejecutado con desglose (dinero: planes gratuitos; horas: las de cada PR en
    `docs/gestion/registro_horas.md`), costo de operación proyectado y análisis costo-beneficio.
  - Capítulo 7: plan de operación, manual de instalación (paso a paso para levantar el proyecto desde cero) y deuda
    técnica.
  
  Envíale el texto a Diego.
- **Defensa:** la demo junto con Ignacio y los costos, como en E3.

## Si te bloqueas

- Esquema, RLS o `revisar_identidad` → Ignacio.
- Formato del RUT → Hugo.
