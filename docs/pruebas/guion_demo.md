# Guion de la demostración en vivo (E3, 3 minutos)

Responsable: Joaquín (conduce) y Pedro (narra). Ensayarlo al menos dos veces cronometrado.

## Preparación (antes de entrar a la sala)

- [ ] Pestaña 1: cuenta de cliente con la sesión iniciada. Pestaña 2: cuenta de maestro. Pestaña 3: administrador.
- [ ] Un maestro ficticio "pendiente" listo para aprobar, con una cédula marcada "DOCUMENTO FICTICIO SIN VALIDEZ".
- [ ] Comprobar que el proyecto Supabase no esté pausado y que la URL de Vercel cargue.
- [ ] Plan B: `npm run dev` local con los mismos datos si falla internet.

## Pasos

| # | Acción | Qué se dice | Requisito |
|---|---|---|---|
| 1 | Administrador abre el panel y aprueba al maestro pendiente | "La identidad la revisa una persona; al aprobar, la cédula se borra" | RF-2, RF-8 |
| 2 | Cliente busca "Gasfitería" en Hualpén con un punto manual | "Solo aparecen maestros verificados con cobertura en esa comuna, ordenados por distancia (CI-1)" | RF-3 |
| 3 | Cliente abre el perfil y pulsa Contactar | — | RF-4 |
| 4 | Cliente y maestro se escriben; el mensaje aparece sin recargar | "Un tercero no puede leer esta conversación; lo probamos en TNF-01" | RF-11 |
| 5 | Cliente confirma el servicio y deja una reseña | "Una reseña por contacto; el orden usa el promedio bayesiano (CI-2)" | RF-5 |
