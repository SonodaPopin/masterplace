# Gabriel Huerta · Experiencia de usuario y frontend

**Objetivo para el 17-11:** registro de cliente y de maestro e inicio de sesión funcionando (RF-1, RF-10), el mapa de
la búsqueda, y la validación con 5 usuarios externos realizada y analizada (R3-C5).

**Ojo:** la validación con usuarios necesita personas reales. **Agenda a los 5 participantes el lunes 9**
(3 maestros y 2 clientes, externos al equipo) para el sábado 14 o el domingo 15.

| Día | Tarea | Commit esperado |
|---|---|---|
| lun 9 | Agendar 5 participantes. Adaptar el Anexo A/B de E1 en `docs/validacion/plan_validacion.md`: tareas, SUS y consentimiento | `docs(validacion): plan e instrumento` |
| mar 10 | `RegistroCliente` e `IniciarSesion` con Supabase Auth (correo y contraseña); cerrar sesión; mostrar quién está conectado | `feat(cuentas): registro de cliente e inicio de sesión` |
| mié 11 | `RegistroMaestro` en ≤3 pasos (RNF-3): datos; oficio, comunas y punto de referencia; cédula ficticia al bucket privado `cedulas`. Mensaje "pendiente de verificación" | `feat(cuentas): registro de maestro en 3 pasos` |
| jue 12 | Mapa con Leaflet en la búsqueda: marcadores de los resultados de Pedro, selección de punto manual y permiso de ubicación con alternativa; lista equivalente al mapa (RNF-7) | `feat(busqueda): mapa Leaflet y punto manual` |
| vie 13 | Revisión de accesibilidad: teclado, foco, etiquetas y contraste (TNF-06) en registro y búsqueda; corregir | `fix(a11y): etiquetas y foco` |
| sáb 14 | **Sesiones de validación** (facilitas; Hugo registra). Tareas cronometradas y SUS | `docs(validacion): registro de sesiones` |
| dom 15 | Resto de las sesiones. Análisis: tasa de tareas completadas, tiempos, SUS promedio y dispersión, problemas por severidad, límites de la muestra | `docs(validacion): análisis y resultados` |
| lun 16 | Diapositiva de validación; corregir el defecto de usabilidad más grave si cabe antes de las 18:00; ensayo | — |

**Dependes de:** Ignacio (perfiles y bucket), Pedro (datos de búsqueda), Joaquín (despliegue para las sesiones).
**Entregas a:** Diego (sesión de admin), Joaquín (sesión para el chat), Hugo (pantallas para probar).

**En la presentación (C5, 1:30):** a quiénes, cuántos, con qué instrumento, qué buscabas, resultados y qué cambió por
ellos.

**Terminado cuando:** un maestro nuevo queda "pendiente" en la base de datos con su cédula en el bucket privado, y hay
5 sesiones registradas con su análisis.
