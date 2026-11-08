# Joaquín Hernández · Operación y despliegue

**Objetivo para el 17-11:** la aplicación publicada en Vercel, con la CI en verde en cada PR, y el contacto y el chat
(RF-4, RF-11) funcionando entre dos cuentas.

| Día | Tarea | Commit esperado |
|---|---|---|
| lun 9 | **Primero:** crear el proyecto Supabase (región São Paulo), activar PostGIS y compartir la URL y la anon key por canal privado (nunca por el repositorio). Conectar el repo a Vercel con las variables `VITE_SUPABASE_*`. Comprobar que la CI corre en el primer PR | `ci: publicar en Vercel y documentar variables` |
| mar 10 | Monitor de disponibilidad cada 5 min (por ejemplo, UptimeRobot gratuito) para iniciar **TNF-04**. Configurar `vercel.json` con reescritura a `index.html` para que las rutas de React funcionen al recargar | `ci(vercel): rutas SPA y monitor` |
| mié 11 | **RF-4 Contacto:** botón Contactar en el perfil del maestro que crea (o reutiliza) un contacto cliente–maestro y lleva a `/contactos/:id` | `feat(contacto): crear contacto desde perfil` |
| jue 12 | **RF-11 Chat:** `src/features/contacto/Conversacion.tsx` carga los mensajes en orden y envía mensajes nuevos | `feat(chat): enviar y listar mensajes` |
| vie 13 | Supabase Realtime: el otro participante ve el mensaje sin recargar; sin duplicados al reconectar. Integración 2 en Vercel | `feat(chat): mensajes en tiempo real` |
| sáb 14 | Medir cuotas usadas (base de datos, Storage, ancho de banda) y llenar el costo ejecutado en `docs/gestion/costos.md` | `docs(costos): cuotas y gasto ejecutado` |
| dom 15 | Actualizar riesgos materializados (R-01, R-07, R-08) en `docs/gestion/riesgos.md`. Preparar las cuentas de la demo | `docs(riesgos): estado al 15-11` |
| lun 16 | Guion de la demo en `docs/pruebas/guion_demo.md` y dos ensayos de la demo cronometrados; plan B si falla internet (local con datos de prueba) | `docs(demo): guion y plan B` |

**Dependes de:** Ignacio (tablas `contactos` y `mensajes` con RLS), Gabriel (sesión iniciada).
**Entregas a:** todos (entorno y despliegue), Hugo (reseña que depende del contacto).

**En la presentación:** conduces la demo (C2, 3 min junto a Pedro) y presentas los costos (C6, ~45 s).

**Terminado cuando:** dos navegadores con cuentas distintas conversan en la URL pública, y un tercero no ve la
conversación.
