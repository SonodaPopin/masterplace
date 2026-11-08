# Ignacio Barría · Datos y seguridad

**Objetivo para el 17-11:** que la base de datos sea la fuente de verdad del flujo y que ningún tercero pueda leer
cédulas ni conversaciones ajenas, con la prueba TNF-01 ejecutada y documentada.

**Eres el primer eslabón:** el esquema y las políticas desbloquean a todos. Prioriza D1 y D2.

| Día | Tarea | Commit esperado |
|---|---|---|
| lun 9 | Revisar el borrador `supabase/migrations/20261109000000_esquema_inicial.sql` contra la Tabla 21 de E1; corregir y aplicarlo en el proyecto Supabase que crea Joaquín | `db(esquema): revisar y aplicar esquema inicial` |
| mar 10 | Semilla: 6 comunas con código y centroide (citar la fuente de las coordenadas), 5 oficios, 15 maestros ficticios (3 por oficio) y 20 clientes. Función `es_admin()` | `db(seed): comunas, oficios y cuentas ficticias` |
| mié 11 | Políticas RLS: perfil público visible solo si `estado_identidad = 'verificada'`; `maestros_privado` y `documentos` solo dueño y admin; contactos y mensajes solo participantes. Buckets privados `cedulas` y `certificados` con políticas de Storage | `db(rls): políticas por rol y participante` |
| jue 12 | Función o trigger que, al aprobar la cédula, borra el archivo y deja `ruta_archivo = null` con registro en `auditoria` (§5.3). Apoyar a Diego con la URL firmada para ver la cédula | `db(cedula): borrar archivo al aprobar` |
| vie 13 | Ejecutar **TNF-01**: intentar leer documentos y mensajes como visitante, como tercero y con rol indebido, vía API y vía URL de archivo. Registrar cada intento y su resultado | `test(seguridad): TNF-01 accesos indebidos` |
| sáb 14 | Corregir lo que falló en TNF-01; consentimiento informado para la validación con usuarios (apoyo a Gabriel) | `fix(rls): ...` / `docs(validacion): consentimiento` |
| dom 15 | Escribir el resultado de TNF-01 en `docs/pruebas/mediciones_rnf.md` (objetivo, método, obtenido, veredicto) | `docs(pruebas): resultado TNF-01` |
| lun 16 | Diapositiva de seguridad (RLS y borrado de cédula) y ensayo | — |

**Dependes de:** Joaquín (proyecto Supabase creado el lunes).
**Entregas a:** todos (esquema), Gabriel (registro), Pedro (búsqueda), Joaquín (chat), Diego (moderación).

**En la presentación (C4, ~1 min):** cómo se probó que un tercero no puede leer el chat ni la cédula, con el
resultado de TNF-01 y el borrado de la cédula al aprobar.

**Terminado cuando:** las migraciones aplican desde cero sin errores, la semilla carga y TNF-01 tiene 100 % de
accesos indebidos rechazados, o los fallos están registrados con su corrección.
