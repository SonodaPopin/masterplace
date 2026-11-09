# Gabriel Huerta · Experiencia de usuario y frontend

**Objetivo para el 17-11:** registro de cliente y de maestro e inicio de sesión funcionando (RF-1, RF-10), el mapa de
la búsqueda, y la validación con 5 usuarios externos realizada y analizada (R3-C5).

**Ojo:** la validación con usuarios necesita personas reales. Es remota, con un Google Form (ver
[plan_validacion.md](../validacion/plan_validacion.md)). **Entre el lunes 9 y el jueves 12 consigue de 8 a 10
voluntarios** (5 o 6 maestros y 3 o 4 clientes, externos al equipo) para tener al menos 5 respuestas.

| Día | Tarea | Commit esperado |
|---|---|---|
| lun 9 | Invitar participantes. Plan de validación remota y script del Google Form en `docs/validacion/` | `docs(validacion): plan e instrumento` |
| mar 10 | `RegistroCliente` e `IniciarSesion` con Supabase Auth (correo y contraseña); cerrar sesión; mostrar quién está conectado | `feat(cuentas): registro de cliente e inicio de sesión` |
| mié 11 | `RegistroMaestro` en ≤3 pasos (RNF-3): datos; oficio, comunas y punto de referencia; cédula ficticia al bucket privado `cedulas`. Mensaje "pendiente de verificación" | `feat(cuentas): registro de maestro en 3 pasos` |
| jue 12 | Mapa con Leaflet en la búsqueda: marcadores de los resultados de Pedro, selección de punto manual y permiso de ubicación con alternativa; lista equivalente al mapa (RNF-7) | `feat(busqueda): mapa Leaflet y punto manual` |
| vie 13 | Revisión de accesibilidad (TNF-06) en registro y búsqueda. Crear el Google Form con el script, probarlo de principio a fin y **enviar el enlace a las 20:00** | `fix(a11y): etiquetas y foco` |
| sáb 14 | Recordatorio a mediodía a quienes no han respondido; invitar suplentes si en la noche hay menos de 5 respuestas | `docs(validacion): registro de invitaciones` |
| dom 15 | Cierre a las 20:00. Con la verificación de Hugo en la base: tareas logradas, tiempos, SUS promedio y rango, señales, problemas por severidad y límites | `docs(validacion): análisis y resultados` |
| lun 16 | Diapositiva de validación; corregir el defecto de usabilidad más grave si cabe antes de las 18:00; ensayo | — |

**Dependes de:** Ignacio (perfiles y bucket), Pedro (datos de búsqueda), Joaquín (despliegue para las sesiones).
**Entregas a:** Diego (sesión de admin), Joaquín (sesión para el chat), Hugo (pantallas para probar).

**En la presentación (C5, 1:30):** a quiénes, cuántos, con qué instrumento, qué buscabas, resultados y qué cambió por
ellos.

**Terminado cuando:** un maestro nuevo queda "pendiente" en la base de datos con su cédula en el bucket privado, y hay
al menos 5 respuestas del formulario con su análisis.
