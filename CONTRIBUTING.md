# Cómo contribuir

## Ramas

- `premain` es la rama de integración: todos los PR de los integrantes deben dirigirse a `premain`.
- `main` es la rama estable y la única que se publica automáticamente en Vercel.
- Solo Joaquín (`SonodaPopin`), administrador del repositorio, puede integrar cambios en `main`, mediante un PR desde `premain`, una vez que la integración esté probada.
- Nadie debe realizar push directo a `premain` ni a `main`. Esta restricción está aplicada mediante GitHub Rulesets.
- Cada integrante trabaja en ramas cortas que parten de `premain` actualizado, utilizando el formato `nombre/tema`.

Ejemplos:
- `pedro/busqueda-postgis`
- `ignacio/rls-mensajes`
- `hugo/ci2-bayes`
- `joaquin/ci-dependabot-cobertura`

Una rama debería durar uno o dos días. Si crece más, se divide.

## Protección de ramas (GitHub Rulesets)

Las siguientes reglas están configuradas y aplicadas por GitHub:

### Rama `main`

Rulesets:
- `main: PR y CI obligatorios`
- `main: solo admin actualiza`

Requisitos:
- Todos los cambios deben ingresar mediante Pull Request.
- La CI debe finalizar correctamente, especialmente el job obligatorio `verificar`.
- Se bloquea la eliminación de la rama y los force pushes.
- Solo el rol administrador del repositorio puede actualizar `main`, y únicamente mediante PR.
- En este repositorio, el administrador es `SonodaPopin` (Joaquín).

### Rama `premain`

Ruleset:
- `premain: PR con revisión y CI`

Requisitos:
- Todos los cambios deben ingresar mediante Pull Request.
- Se requiere al menos una aprobación de otro integrante.
- La CI debe finalizar correctamente, especialmente el job obligatorio `verificar`.
- Se bloquea la eliminación de la rama y los force pushes.
- El administrador tiene una excepción de emergencia mediante PR. Debe utilizarse únicamente cuando sea necesario y de forma coordinada con el equipo.

## Convención de ramas

Cada integrante debe trabajar en una rama propia, creada desde `premain` actualizado.

```bash
git fetch origin
git switch premain
git pull origin premain
git switch -c nombre/tema
```

Si todavía no tienes `premain` local:

```bash
git fetch origin
git switch -c premain --track origin/premain
git switch -c nombre/tema
```

## Commits

Formato:

`tipo(área): descripción en español, en presente`

| Tipo | Uso |
|---|---|
| `feat` | Funcionalidad nueva |
| `fix` | Corrección de errores |
| `test` | Incorporación o modificación de pruebas |
| `db` | Migraciones, políticas o semilla |
| `docs` | Documentación, actas y bitácoras |
| `ci` | Integración continua y despliegue |

Ejemplos:
- `feat(busqueda): filtrar por comuna de cobertura`
- `fix(chat): evitar mensajes duplicados al reconectar`
- `test(ci2): agregar casos de validación`
- `db(rls): restringir acceso a mensajes`
- `docs(acta): actualizar registro de reunión`
- `ci: agregar cobertura y actualizaciones de dependencias`

Se deben realizar commits pequeños y frecuentes, al menos uno por día de trabajo. Un commit de documentación también cuenta como trabajo registrado.

## Pull Requests

1. Actualizar `premain` y crear una rama de trabajo.
2. Implementar los cambios y ejecutar las pruebas correspondientes.
3. Hacer commit y subir la rama:

   ```bash
   git push -u origin nombre/tema
   ```

4. Crear un Pull Request hacia `premain`:

   ```bash
   gh pr create --base premain --fill
   ```

5. Solicitar revisión a una persona distinta de quien escribió el código.

   Asignación sugerida de revisores:

   | Autor | Revisa |
   |---|---|
   | Pedro | Joaquín |
   | Ignacio | Pedro |
   | Gabriel | Hugo |
   | Joaquín | Ignacio |
   | Hugo | Gabriel |
   | Diego | Cualquier integrante disponible |

6. Esperar una aprobación y que la CI `verificar` termine correctamente.
7. Fusionar mediante **Squash and merge**.

Los Rulesets de GitHub bloquean la fusión cuando no se cumplen las condiciones configuradas. No se deben intentar eludir estas restricciones.

Para cerrar el Issue asociado, incluir en la descripción del PR la referencia correspondiente, por ejemplo `Closes #84`.

## Integración a producción

- Los cambios se integran primero en `premain`.
- Joaquín realiza el PR de promoción `premain → main` cuando la integración está probada y lista para publicarse.
- La CI debe finalizar correctamente antes de fusionar.
- Los despliegues automáticos de Vercel están habilitados únicamente para `main`.
- Los cambios realizados en otras ramas no actualizan directamente la versión de producción.

## Integración continua

El workflow se encuentra en `.github/workflows/ci.yml`.

Se ejecuta en los Pull Requests y en los push a `main` y `premain`.

El job obligatorio es `verificar`, que ejecuta:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

La cobertura mínima exigida por Vitest es:

| Métrica | Umbral |
|---|---:|
| Statements | 75% |
| Branches | 75% |
| Functions | 70% |
| Lines | 75% |

Los reportes de cobertura se generan en formato JSON y se utilizan para publicar comentarios automáticos en los Pull Requests cuando los permisos del evento lo permiten.

## Dependencias y seguridad

- Dependabot revisa semanalmente las dependencias de npm y GitHub Actions.
- Dependabot Security Updates está habilitado para alertas y actualizaciones de seguridad.
- Secret Scanning y Push Protection están habilitados.
- CodeQL está configurado para analizar JavaScript, TypeScript y GitHub Actions.
- Los workflows de Pull Requests de colaboradores externos pueden requerir aprobación antes de ejecutarse.
- Vercel mantiene activada la protección de Pull Requests provenientes de forks.

## Seguridad y secretos

- Nunca subir `.env.local`, claves `service_role`, contraseñas ni datos personales reales.
- No incluir credenciales de producción en archivos de documentación, semillas o ejemplos públicos.
- Las cuentas ficticias deben utilizar datos de prueba.
- Si se publica un secreto por error, avisar inmediatamente a Joaquín e Ignacio para revocar o rotar la credencial. Borrar el commit no es suficiente.
- Los cambios de base de datos deben registrarse mediante una nueva migración en `supabase/migrations/` y anotarse en `supabase/README.md` cuando se apliquen en producción.

## Registro del trabajo

- Registrar las horas invertidas en la descripción del Pull Request.
- Documentar cómo se probaron los cambios.
- Si hay una migración aditiva, indicar su aplicación en producción y dejar registro en `supabase/README.md`.
- Los PR deben cumplir sus condiciones de finalización antes de considerarse terminados.

## Pruebas antes de abrir un PR

Ejecutar localmente:

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

Se deben revisar también los cambios pendientes antes de crear el commit:

```bash
git diff --check
git status
```

Las pruebas de extremo a extremo con Playwright se incorporarán cuando estén disponibles los casos de prueba correspondientes.

