# Cómo contribuir

## Ramas

- `main` siempre compila y pasa la CI. Nadie hace push directo a `main`.
- Cada integrante trabaja en ramas cortas con este formato: `nombre/tema`.
  Ejemplos: `pedro/busqueda-postgis`, `ignacio/rls-mensajes`, `hugo/ci2-bayes`.
- Una rama dura uno o dos días. Si crece más, se divide.

## Commits

Formato: `tipo(área): descripción en español, en presente`.

| Tipo | Uso |
|---|---|
| `feat` | Funcionalidad nueva (`feat(busqueda): filtrar por comuna de cobertura`) |
| `fix` | Corrección (`fix(chat): evitar mensajes duplicados al reconectar`) |
| `test` | Pruebas (`test(ci2): casos n = 0, 1, 5 y 50`) |
| `db` | Migraciones, políticas o semilla (`db(rls): solo participantes leen mensajes`) |
| `docs` | Documentación, actas, bitácoras (`docs(acta): reunión 10-11`) |
| `ci` | Integración continua y despliegue |

Haz commits pequeños y frecuentes, **al menos uno por día de trabajo**. Un commit de documentación (acta, registro de
pruebas, bitácora) cuenta igual que uno de código.

## Pull requests

1. `git switch main && git pull`, luego `git switch -c nombre/tema`.
2. Trabaja, haz commits y luego `git push -u origin nombre/tema`.
3. Abre el PR con la plantilla y pide revisión a **una persona distinta**. Revisor por defecto:

   | Autor | Revisa |
   |---|---|
   | Pedro | Joaquín |
   | Ignacio | Pedro |
   | Gabriel | Hugo |
   | Joaquín | Ignacio |
   | Hugo | Gabriel |
   | Diego | cualquiera |

4. Se fusiona con "Squash and merge" cuando la CI está en verde y hay una aprobación.
5. Revisar PR ajenos dentro del mismo día también es parte del trabajo.

## Antes de abrir un PR

```bash
npm run lint
npm run typecheck
npm test
```

## Seguridad

- Nunca commitear `.env.local`, claves `service_role`, contraseñas ni datos de personas reales.
- Si se sube un secreto por error, avisar de inmediato a Joaquín e Ignacio para rotar la clave. Borrar el commit no basta.
- Los cambios de base de datos van siempre como migración nueva en `supabase/migrations/` y nunca se editan a mano en el
  panel de producción sin registrarlos.
