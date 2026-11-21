# Gabriel Huerta · Experiencia de usuario y frontend

> Antes de empezar, lee [`COMO_TRABAJAMOS.md`](COMO_TRABAJAMOS.md). El porqué está en
> [`PLAN_FINAL.md`](../PLAN_FINAL.md).

**Objetivo:** que un maestro se registre solo y entienda la página (en la validación de E3 uno no encontró dónde
inscribirse y ninguno de los clientes distinguió los sellos), y que las pantallas nuevas (solicitud de servicio,
reseñas, denuncias) se vean y se entiendan. **Todo el frontend es tuyo**; los demás te entregan contratos
(funciones y tipos) para que no tengas que esperar a que terminen la base.

**Revisa tus PR:** Hugo. **Tú revisas:** los PR de Hugo.

## Qué te entrega cada uno

| Necesitas | Te lo entrega | Contrato | Funcionando |
|---|---|---|---|
| `formatearPromedio` y `puntajeLaplace` | Pedro | dom 22 | lun 23 |
| `validarRut`, `normalizarRut`, `formatearRut` | Hugo | dom 22 | lun 23 |
| Formato del RUT, error de RUT duplicado, `identidad_vence_en` | Joaquín | dom 22 | dom 22 |
| `servicioSolicitudes.ts` | Ignacio | dom 22 | dom 22 (aditiva aplicada) |
| `buscar_maestros` con reputación y orden | Pedro | dom 22 | mié 25 |
| `servicioDenuncias.ts` | Diego | lun 23 | mié 25 |

Si un contrato no llegó el día indicado, avanza con la tarea siguiente que no dependa de él y coméntalo en el issue.

## Tareas

### 1. Perfil del maestro y formulario de reseña · **sábado 21 – lunes 23** (no dependen de nadie)

Hoy el perfil (`src/features/maestros/PerfilMaestro.tsx`) y el formulario (`src/features/resenas/NuevaResena.tsx`)
casi no tienen estilos, y el perfil muestra «3.11 ★ Promedio bayesiano» junto a «Promedio bruto: 2.00 ★».

- **Perfil:** encabezado con nombre, oficio y sellos (el de identidad hoy no aparece en el perfil, aunque sí en la
  búsqueda); comunas donde trabaja; experiencia y disponibilidad; botón «Contactar» visible sin desplazarse en el
  celular.
- **Reputación:** solo «★ 4,6 · 12 reseñas» (con `formatearPromedio` de Pedro). Nunca «bayesiano», «bruto» ni el
  puntaje suavizado. Distribución por estrellas (barras de 5 a 1) si cabe.
- **Cada reseña:** estrellas dibujadas, comentario, fecha y, cuando exista, qué servicio fue (descripción de la
  solicitud).
- **Formulario de reseña:** a quién estás evaluando y qué servicio; estrellas grandes que se tocan (no radios); sin 5
  estrellas preseleccionadas; contador de caracteres; confirmación después de publicar.

Commit: `feat(perfil): diseño del perfil y reputación legible`.

### 2. Sellos y mensajes · **domingo 22**

- **H-03:** ayuda en los sellos («Identidad verificada: revisamos su cédula», «Certificado: acreditó su oficio»), en la
  búsqueda y en el perfil. Accesible con teclado y lector de pantalla (no solo al pasar el mouse).
- **H-04:** el mensaje del chat muestra «Enviando…», «Enviado» o «No se envió · Reintentar»
  (`src/features/contacto/Conversacion.tsx`).

Commit: `fix(ux): ayuda en los sellos y estado de los mensajes`.

### 3. Registro de maestro · **lunes 23 – martes 24**

Hallazgo crítico de la validación (H-01). Archivos: `RegistroMaestro.tsx`, `PasoPerfilMaestro.tsx`,
`PasoCedulaMaestro.tsx`, `FormularioCuenta.tsx` en `src/features/cuentas/`.

- **Entrada:** «Soy maestro» visible en el inicio (botón, no solo un enlace del menú) que lleve directo al registro.
- **Antes del paso 1:** qué se necesita (cédula a mano, 5 minutos) y qué pasa después (revisión de identidad).
- **RUT** en el paso donde ya existe la fila del maestro: validación al salir del campo con `validarRut`, se muestra
  con `formatearRut` y se guarda con `normalizarRut`:
  `supabase.from('maestros_privado').insert({ id: maestroId, rut })`. Error `23505` → «Este RUT ya está registrado.
  Si es tuyo, inicia sesión».
- **Lenguaje simple**, botones de al menos 44 px de alto, un solo campo por línea en el celular, el progreso visible
  y que recargar no haga perder lo ya guardado.

Commit: `feat(registro): registro de maestro más claro con RUT`.

### 4. Tapar el número de documento de la cédula · **martes 24 – miércoles 25**

`PasoCedulaMaestro.tsx`. El número no debe llegar nunca al servidor (`PLAN_FINAL.md` §3.4).

- Al elegir la foto, se muestra en un `<canvas>` con un rectángulo negro que el maestro arrastra y ajusta sobre el
  número de documento. Muestra antes un ejemplo con `public/carnet_prueba.png` marcando dónde está el número.
- Se sube la imagen del canvas (`canvas.toBlob(..., 'image/jpeg', 0.85)`), no el archivo original. Volver a codificar
  la imagen además borra los metadatos (por ejemplo, la ubicación GPS de la foto): menciónalo en el informe.
- Solo anverso y solo JPG o PNG: el PDF no se puede tapar en el navegador (cambia `TIPOS_CEDULA` en
  `src/lib/maestros/validacion.ts` y su prueba).
- Si alcanza: aviso al maestro cuando `identidad_vence_en` esté a menos de 15 días o vencida, con enlace para subir la
  cédula otra vez. **Esto es lo primero que se recorta** si nos atrasamos.

Commit: `feat(cedula): tapar el número de documento antes de subir`.

### 5. Solicitud de servicio en el chat · **martes 24 – miércoles 25**

Con `servicioSolicitudes.ts` de Ignacio (tipos en `COMO_TRABAJAMOS.md` §1).

- **Cliente:** botón «Solicitar servicio» en la conversación → formulario corto: qué necesitas y fecha y hora acordadas.
- **Tarjeta en el chat** con descripción, fecha y estado, y las acciones que correspondan:
  - maestro: «Aceptar» / «Rechazar» (motivo opcional) mientras esté pendiente;
  - cliente: «Cancelar» mientras esté pendiente o aceptada y antes de la fecha;
  - ambos: «Marcar como realizado» cuando `puedeMarcarRealizada` (antes, el texto «Podrás marcarlo como realizado
    desde las 17:30»);
  - cliente: «Dejar reseña» cuando `puedeResenar`, que lleva a `NuevaResena` con el `solicitud_id`.
- Se actualiza sola con Realtime, como los mensajes.
- **Bandeja** (`BandejaContactos.tsx`): aviso «Solicitud pendiente» o «Puedes dejar una reseña».
- **Quitar** el botón «Dejar reseña» y la etiqueta «Servicio confirmado» del encabezado de la conversación.
- Errores con `traducirErrorSolicitud`.

Commit: `feat(solicitudes): tarjeta de solicitud en el chat`.

### 6. Reputación en la búsqueda · **miércoles 25 – jueves 26**

Con los campos nuevos de `buscar_maestros` (Pedro).

- En cada resultado: «★ 4,6 · 12 reseñas» o «Sin reseñas todavía».
- Selector de orden: «Más cercanos» / «Mejor evaluados» (`orden: 'distancia' | 'reputacion'`).
- Arreglos menores vistos el 20-11: la «A» suelta que el lector de pantalla lee antes de la distancia, y que el maestro
  con nombre vacío no muestre su correo.

Commit: `feat(busqueda): reputación y orden por mejor evaluados`.

### 7. Denuncias · **jueves 26**

Con `servicioDenuncias.ts` de Diego.

- Perfil del maestro (solo lo ve el maestro dueño, en sus propias reseñas): «Denunciar» → motivo y detalle opcional.
- Panel de moderación (`src/features/admin/PanelModeracion.tsx`): pestaña «Denuncias» con la reseña denunciada,
  «Ocultar reseña» o «Descartar».

Commit: `feat(denuncias): denunciar reseñas y moderarlas`.

### 8. Congelamiento · **viernes 27**

Solo correcciones. Recorre el flujo completo en local con Joaquín antes de que pase `premain` a `main`.

### 9. Segunda validación · **sábado 28 – domingo 29**

Diego te entrega el jueves 26 la lista de participantes (al menos 3 maestros y 2 clientes).

- Mismo instrumento de E3 (`src/features/validacion/`, `docs/validacion/participantes.sql` con códigos nuevos), para
  comparar. Ajusta solo lo necesario en `src/lib/validacion/guion.ts`: T1 (registro de maestro con RUT y cédula
  tapada) y una tarea nueva de solicitud y reseña.
- Lo que más importa medir: **¿los maestros completan el registro solos y en cuánto tiempo?** (H-01, meta de 5 min) y
  **¿los clientes distinguen los sellos?** (H-03). Es el efecto verificado de las iteraciones 5 y 8.
- Análisis en `docs/validacion/plan_validacion.md`, sección nueva «Segunda validación», con los mismos límites
  declarados que en E3.

## Informe y defensa

- **Informe (borrador el domingo 29 a las 18:00):** en el capítulo 5, el diseño, los resultados y el análisis de las
  dos validaciones; en el capítulo 7, el manual de usuario (cliente y maestro, con capturas). Envíale el texto a Diego.
- **Defensa:** validación con usuarios, como en E3, y la parte de la demo que muestra el registro del maestro.

## Si te bloqueas

- Un contrato que no llegó → coméntalo en el issue del dueño y pasa a otra tarea tuya.
- Datos que no aparecen o permisos → Ignacio.
