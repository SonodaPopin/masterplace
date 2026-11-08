# Requisitos vigentes (E1 con las correcciones aplicadas)

Fuente: E1 §3–§4 más el documento "MasterPlace · Correcciones a la Entrega 1". Cambios respecto de E1: RF-2 queda con
la revisión de identidad y RF-8 pasa a ser solo moderación de denuncias; RF-11 queda detallado; todos los criterios
usan el formato Dado/Cuando/Entonces.

## Requisitos funcionales

| ID | Título | Prior. | Criterio de aceptación | Responsable E3 |
|---|---|---|---|---|
| RF-1 | Registro de maestro | M | Dado un maestro sin cuenta, cuando completa el registro y sube su cédula, entonces su perfil queda "pendiente de verificación" y no aparece en búsquedas | Gabriel |
| RF-2 | Verificación de identidad (Nivel 1) | M | Dado un perfil pendiente, cuando el administrador lo aprueba, entonces pasa a "identidad verificada", se hace visible y la cédula se elimina | Diego e Ignacio |
| RF-3 | Búsqueda y filtro | M | Dado un punto manual o autorizado y filtros de oficio y comuna, cuando el cliente busca, entonces obtiene solo maestros verificados con esa cobertura, ordenados por distancia; si deniega la ubicación o falla el mapa, conserva la lista | Pedro y Gabriel |
| RF-4 | Contacto cliente–maestro | M | Dado un maestro con Nivel 1 y disponible, cuando un cliente autenticado pulsa Contactar, entonces se crea un contacto único entre ambos y se abre su conversación | Joaquín |
| RF-5 | Reseña post-servicio | M | Dado un contacto con servicio confirmado, cuando el cliente califica de 1 a 5 y comenta, entonces se guarda una sola reseña para ese contacto | Hugo |
| RF-8 | Moderación de denuncias | M | Dado un administrador y una denuncia pendiente, cuando la resuelve como procedente, entonces se oculta la reseña o el perfil y se registran la fecha y el revisor | Diego (E4) |
| RF-10 | Registro y autenticación de cliente | M | Dado un usuario sin cuenta, cuando ingresa datos válidos y confirma su correo, entonces se crea su perfil de cliente y puede iniciar sesión | Gabriel |
| RF-11 | Mensajería interna | M | Dado un contacto abierto, cuando un participante envía un mensaje, entonces el otro lo ve sin recargar; un tercero no puede leerlo | Joaquín |
| RF-6 | Ascenso a Nivel 2 | S | Dado un maestro Nivel 1, cuando alcanza 5 reseñas válidas con promedio ≥ 4, entonces asciende a Nivel 2 | E4 |
| RF-7 | Certificación (Nivel 3) | S | Dado un maestro Nivel 1 o 2, cuando sube un certificado, entonces queda en revisión manual | E4 |
| RF-9 | Edición de perfil y disponibilidad | S | Dado un maestro autenticado, cuando cambia su cobertura o disponibilidad, entonces se refleja de inmediato en las búsquedas | E4 |
| RF-12 | Denuncia de reseñas o perfiles | S | Dado un usuario que ve una reseña, cuando la denuncia con un motivo, entonces la denuncia queda pendiente en la cola de RF-8 | E4 |
| RF-13 | Notificaciones | S | Dado un usuario con un nivel aprobado o un mensaje nuevo, cuando ocurre ese evento, entonces ve una alerta solo él | E4 |

Nota: RF-8 en la versión corregida es moderación de denuncias, que depende de RF-12 (Should). Para E3, la revisión de
identidad del panel de administración corresponde a RF-2.

## Requisitos no funcionales que se miden en E3

Ver objetivos y método en [pruebas/mediciones_rnf.md](pruebas/mediciones_rnf.md): RNF-1 seguridad, RNF-2 y RNF-6
rendimiento y carga, RNF-3 usabilidad, RNF-4 disponibilidad (parcial), RNF-5 cobertura y RNF-7 accesibilidad.

## Reglas de negocio clave para el código

- RB-6: solo los maestros con identidad verificada aparecen en búsquedas y pueden ser contactados.
- RB-7: como máximo una reseña por contacto.
- RB-9: un maestro aparece en una comuna solo si la tiene en su cobertura declarada.
- RB-10: identidad, reseñas y certificado se muestran por separado; nunca se publica la cédula.
