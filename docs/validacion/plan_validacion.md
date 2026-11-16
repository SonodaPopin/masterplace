# Plan de validación con usuarios (R3-C5)

| | |
|---|---|
| Responsable | Gabriel (diseño, reclutamiento y análisis) |
| Verificación en la base de datos | Hugo |
| Consentimiento y resguardo de datos | Ignacio |
| Cuentas y configuración de la prueba | Joaquín |
| Ventana de respuesta | Del viernes 13 a las 20:00 al domingo 15 a las 20:00 (noviembre de 2026) |
| Base | E1 §10.4, Anexo A (consentimiento y pautas) y Anexo B (tareas y SUS) |

R3-C5 nivel 4 pide: *"Diseña la validación de forma apropiada al objetivo (a quiénes, cuántos, con qué instrumento, qué
se busca establecer), presenta los datos obtenidos, los analiza con un método adecuado y extrae conclusiones que
reconocen los límites del estudio."*

**Cambio respecto de E1:** E1 planteaba sesiones observadas. Se reemplazan por una **prueba remota sin facilitador**:
cada participante recibe el enlace de la página y un Google Form con las tareas, las hace en su celular o computador
cuando le acomode y responde el formulario. Motivo: los maestros no tienen disponibilidad para una sesión presencial
ni para una videollamada de 30 minutos. Costo de este cambio: no se observa a la persona mientras usa la página, así
que los tiempos y las dificultades son autorreportados. Para compensarlo, el éxito de cada tarea se comprueba también
en la base de datos (sección 6). Este cambio de método debe anotarse en la bitácora de iteraciones (R3-C1).

**Cambio del 14-11: el instrumento pasa a estar dentro de la página.** Antes de enviar ningún enlace se reemplazó el
Google Form por un **enlace único por participante** (`https://masterplace.vercel.app/prueba/<token>`). La página guía
paso a paso con los mismos textos del formulario (consentimiento, datos, A1, tareas, T5, SUS y A2 a A4) y, durante
cada tarea, muestra un panel fijo abajo con la instrucción, el correo y el carnet de prueba y la pregunta «¿Pudo
hacerlo?». Motivo: en el celular, ir y volver entre el formulario y la página era la principal barrera para los
maestros. Efectos sobre el estudio:

- Las tareas se hacen en la página real (no es una simulación), así que la verificación en la base (sección 6) sigue
  igual.
- El tiempo de cada tarea se **mide** entre «Comenzar» y «Terminé», en lugar de autorreportarse. Se quita la pregunta
  «¿Cuánto se demoró?».
- Las respuestas quedan en las tablas `validacion_participantes` y `validacion_respuestas` (migración
  `20261114000000_validacion_usuarios.sql`), separadas del producto; solo un admin las lee. Los enlaces se crean con
  [participantes.sql](participantes.sql) y los resultados se obtienen con [resultados.sql](resultados.sql).
- El consentimiento agrega que se guarda cuánto tarda en cada tarea.
- [crear_formulario.gs](crear_formulario.gs) queda como plan B si la página falla.

---

## 1. Qué se busca establecer

| # | Pregunta de validación | Cómo se responde | Requisito |
|---|---|---|---|
| V1 | ¿Un maestro puede registrarse sin ayuda y en ≤ 5 minutos? | Tarea T1: autorreporte más verificación en la base de datos | RF-1, RNF-3 |
| V2 | ¿Un cliente encuentra a un maestro compatible y lo contacta? | Tareas T3 y T4: autorreporte más mensaje registrado en la base | RF-3, RF-4, RF-11 |
| V3 | ¿Distinguen "identidad verificada" y "certificado"? (las reseñas, RF-5, aún no existen: su importancia se mide en A2) | Pregunta T5, respondida con sus palabras | RB-10, riesgo R-05 |
| V4 | ¿Les importa lo que 2x3 no ofrece: certificación verificada, cercanía y cobertura en su comuna? | Preguntas A2 y A3 | Iteración 1 (bitácora) |
| V5 | ¿La usabilidad percibida alcanza la meta? | Cuestionario SUS | RNF-3 (meta SUS ≥ 75) |

**Metas (E1):** al menos 4 de cada 5 participantes completan las tareas esenciales de su perfil, el registro de maestro
toma ≤ 5 minutos y el SUS promedio es ≥ 75. Si no se cumplen, se informa igual.

---

## 2. Participantes

**Meta:** al menos 5 respuestas completas, con un mínimo de 3 maestros y 2 clientes. Como en una prueba remota parte de
los invitados no responde, se invita a **8 a 10 personas** (5 o 6 maestros y 3 o 4 clientes). Cinco participantes
bastan para detectar los problemas de usabilidad más frecuentes; no permiten estimar porcentajes de la población.

**Criterios de inclusión**

- Mayor de 18 años y vive o trabaja en una de las 6 comunas del piloto (Concepción, Talcahuano, Hualpén, San Pedro de
  la Paz, Chiguayante o Penco).
- Maestro: trabaja en gasfitería, albañilería, carpintería, hojalatería o estructuras metálicas.
- Cliente: contrató algún maestro en el último año.
- Tiene celular con internet.

**Criterios de exclusión:** integrantes del equipo, compañeros de la asignatura, estudiantes de informática y personas
que ya vieron el prototipo.

**Reclutamiento:** por contactos personales (familia, vecinos, maestros que hayan trabajado en sus casas).

- **Lunes 9 a jueves 12:** preguntar quién está dispuesto a participar.
- **Viernes 13 en la noche:** enviar el enlace a quienes aceptaron.
- **Sábado 14 a mediodía:** enviar un recordatorio a quienes no han respondido.

Si el sábado en la noche hay menos de 5 respuestas, se activa el riesgo R-03 y se invita a los suplentes.

**Mensaje para invitar (WhatsApp)**

> Hola [nombre], soy Gabriel, estudio Ingeniería Civil Informática en la UdeC. Con mi grupo estamos haciendo una página
> web para encontrar maestros de oficios en el Gran Concepción, como proyecto del ramo. ¿Me ayudarías a probarla? Es
> desde el celular, cuando tú puedas este fin de semana, y toma unos 10 a 15 minutos: haces unas tareas cortas en la
> página y contestas un formulario. No pedimos datos personales reales ni tu carnet. ¿Te puedo mandar el enlace el
> viernes?

**Mensaje con el enlace (viernes 13)**

> ¡Gracias por ayudarnos! Aquí está el formulario: [enlace]. Ahí están las instrucciones y las tareas paso a paso. Tu
> código de participante es **P_** y la imagen de carnet de prueba está en este enlace: [enlace]. Puedes responder
> hasta el domingo a las 20:00. Si algo no te funciona, no te preocupes: anótalo en el formulario, eso también nos
> sirve.

### Registro de invitaciones

Completado el 15-11 con la base de datos (`validacion_participantes`, `validacion_respuestas` y las cuentas creadas).
Horas de Chile (UTC−3). «Respondió» indica si la persona llegó al final de la prueba guiada; si la tarea quedó hecha en
la base se analiza en la sección 9. Los enlaces del equipo (P90 en adelante) no se cuentan.

| Código | Perfil | Oficio o comuna | Aceptó | Enlace enviado | Respondió |
|---|---|---|---|---|---|
| P1 | Maestro | — | Sí (por eso se le envió el enlace) | Sí | No: el enlace nunca se abrió |
| P2 | Maestro | Comuna del piloto (confirmada en conversación; en la app marcó «Otra») | Sí (consentimiento en la app) | Sí | Sí, terminó el 15-11 a las 09:39 |
| P3 | Maestro | Comuna: Concepción; oficio no registrado | Sí (consentimiento en la app) | Sí | Sí, terminó el 14-11 a las 15:56 |
| P4 | Maestro | — | — | No (código sin usar) | — |
| P5 | Maestro | Comuna: Concepción; oficio no vinculado | Sí (consentimiento en la app) | Sí, como suplente | Sí, terminó el 15-11 a las 21:56 (después del cierre de las 20:00) |
| P6 | Cliente | Comuna: Concepción | Sí (consentimiento en la app) | Sí | Sí, terminó el 14-11 a las 16:20 |
| P7 | Cliente | Comuna: Concepción | Sí (consentimiento en la app) | Sí | Sí, terminó el 14-11 a las 17:32 |
| P8 | Cliente | Comuna: Concepción | Sí (consentimiento en la app) | Sí | Sí, terminó el 14-11 a las 13:34 |
| P9 | Cliente | Comuna del piloto (confirmada en conversación; en la app marcó «Otra») | Sí (consentimiento en la app) | Sí | Sí, terminó el 14-11 a las 15:45 |
| P10 | Cliente | — | — | No (código sin usar) | — |

**Resumen:** Gabriel envió 7 enlaces (P1, P2, P3 y P6 a P9) y luego uno más a P5, como suplente (riesgo R-03: con P1
sin responder faltaba un maestro). P5 respondió completo el 15-11 a las 21:56, después del cierre. En total terminaron
**7 participantes (3 maestros y 4 clientes)**: se cumplen el mínimo de 5 respuestas completas y el de 3 maestros, este
último solo contando a P5 fuera de plazo. P1 nunca abrió su
enlace; P4 y P10 no se usaron. Todos viven en una de las 6 comunas del piloto: P2 y P9 marcaron «Otra» en la app, pero
en la conversación posterior con Gabriel confirmaron que su comuna está dentro del piloto.

**Observaciones de la base y del seguimiento para la sección 9:**

Después del cierre, Gabriel conversó con los participantes para aclarar las diferencias entre sus respuestas y la base.
Lo que confirmaron se usa en el análisis y se marca como «confirmado en conversación».

- **T1:** los maestros crearon su cuenta, excepto P3, que respondió «No pude». Las cuentas de P2 y P5 no aparecen en
  la base, aunque ambos confirmaron haberlas creado. (La cuenta de maestro pendiente creada el 15-11 a las 20:00 resultó
  ser una prueba de Ignacio, «Ignacio Pueba Maestro», según el panel de moderación del 15-11.)
- **T4 (P7):** creó su cuenta, abrió un contacto y envió un mensaje, según confirmó en la conversación. En la base
  quedaron la cuenta y el contacto, pero no el mensaje: P7 explicó que pulsó en otros lugares de la pantalla, así que
  probablemente el envío no llegó a hacerse.

---

## 3. Preparación técnica (antes del viernes 13 a las 18:00)

| Qué | Responsable |
|---|---|
| Versión de la página congelada para la prueba en Vercel; anotar el número del commit | Joaquín |
| Durante la prueba, desactivar "Confirm email" en Supabase Auth, para que los participantes se registren con el correo de prueba que se les asigna (`p1@prueba.masterplace.cl`, etc.) y no tengan que dar su correo real. Reactivarlo el domingo en la noche | Joaquín |
| Tres o más maestros ficticios ya verificados en cada comuna y oficio, para que la búsqueda de los clientes tenga resultados | Ignacio |
| Imagen de carnet ficticio con la marca "DOCUMENTO FICTICIO SIN VALIDEZ" (se descarga desde el panel de la tarea: `public/carnet_prueba.png`) | Gabriel |
| Migración `20261114000000_validacion_usuarios.sql` aplicada y enlaces creados con `participantes.sql` | Gabriel |
| Prueba de punta a punta del equipo con los enlaces P90–P97 (uno por integrante; P90 y P92–P94 maestro, P91 y P95–P97 cliente). Después se borran sus respuestas y cuentas (`participantes.sql`) | Gabriel |
| Consulta SQL para verificar las tareas de cada código (sección 6): [resultados.sql](resultados.sql) | Hugo |

**Asignación de correos:** cada participante usa `p<número>@prueba.masterplace.cl` y una contraseña que elija. Así
sus acciones se ubican en la base por su código, sin datos personales. El panel de la tarea le muestra su correo con
un botón para copiarlo.

---

## 4. Consentimiento informado

Es la primera sección del formulario. Si la persona responde "No acepto", el formulario termina sin registrar nada
más. Texto adaptado del Anexo A de E1:

> Somos estudiantes de Ingeniería Civil Informática de la Universidad de Concepción y estamos desarrollando MasterPlace
> como proyecto académico. Le pediremos hacer algunas tareas en la página y responder preguntas; toma unos 10 a 15
> minutos. Estamos evaluando la página, no a usted: si algo no resulta, es un problema de la página. Participar es
> voluntario y puede dejar de responder en cualquier momento. Usará un correo y un carnet de prueba que le damos
> nosotros: no le pediremos su carnet, su RUT ni su correo real. Este formulario no registra su correo ni su nombre;
> lo identificamos solo con un código. Revisaremos en la base de datos de la página las acciones hechas con su código
> de prueba. Los resultados se usarán solo para mejorar el proyecto y presentarlo en la asignatura; las respuestas se
> eliminarán al cerrar la evaluación y solo se conservarán resultados anónimos.

---

## 5. Contenido del formulario

El formulario se crea automáticamente con [crear_formulario.gs](crear_formulario.gs) (instrucciones en ese archivo).
Estructura:

| Sección | Contenido | Quién la ve |
|---|---|---|
| 1. Consentimiento | Texto de la sección 4 y "¿Acepta participar?" | Todos |
| 2. Datos | Código de participante, perfil (maestro o cliente), comuna, dispositivo y si conoce o usa 2x3 | Todos |
| 3. Antes de empezar (A1) | Maestro: cómo consigue clientes hoy. Cliente: cómo encontró al último maestro y qué le preocupaba | Todos |
| 4M. Tareas de maestro | T1 Registro y T5 Señales | Maestros |
| 4C. Tareas de cliente | T2 Cuenta, T3 Búsqueda, T4 Contacto y T5 Señales | Clientes |
| 5. SUS | 10 afirmaciones, escala de 1 a 5 | Todos |
| 6. Preguntas finales | A2 a A4 | Todos |

Cada tarea dice qué hacer en la página sin nombrar botones, y luego pregunta:

- **¿Pudo hacerlo?** "Sí, sin problemas", "Sí, pero me costó", "No pude" o "No lo intenté".
- **¿Cuánto se demoró, aproximadamente?** "Menos de 2 min", "2 a 5 min", "5 a 10 min" o "Más de 10 min".
- **¿Dónde se confundió o qué le faltó?** Texto libre y opcional.

### Tareas

| Tarea | Perfil | Instrucción en el formulario | Verificación en la base |
|---|---|---|---|
| T1 Registro | Maestro | "Imagine que quiere ofrecer sus servicios en esta página. Regístrese como maestro con el correo de prueba de su código, su oficio, las comunas donde trabaja y la imagen de carnet de prueba." | Perfil con estado "pendiente", oficio, al menos una cobertura y la cédula subida |
| T2 Cuenta | Cliente | "Cree una cuenta de cliente con el correo de prueba de su código." | Perfil de cliente creado |
| T3 Búsqueda | Cliente | "Imagine que se le rompió una cañería en su casa. Busque un gásfiter que atienda en su comuna. ¿Qué maestro eligió y por qué cree que apareció primero?" | — (se analiza la respuesta) |
| T4 Contacto | Cliente | "Escríbale a ese maestro para preguntarle si puede ir mañana." | Contacto y mensaje registrados por ese cliente |
| T5 Señales | Ambos | "En la página, los perfiles muestran marcas como 'Identidad verificada' y 'Certificado'. Explique con sus palabras qué significa cada una." (cambio del 14-11, antes de enviar enlaces: se quitaron las reseñas porque RF-5 no está implementado y los perfiles no las muestran) | — (se clasifica la respuesta) |

Si una función no está lista el viernes 13 (por ejemplo, el chat), esa tarea se quita del formulario y se informa como
**"no aplicable: función no implementada"**. No se simula ni se cuenta como éxito.

### Preguntas finales

- **A2.** "Para elegir a un maestro (o para que lo elijan a usted), ordene de más a menos importante: identidad
  verificada, reseñas, certificado del oficio y cercanía."
- **A3.** "Ya existen páginas como 2x3. ¿Qué tendría que tener esta para que usted la usara?"
- **A4.** "¿Qué fue lo más difícil? ¿Qué cambiaría primero?"

---

## 6. Verificación en la base de datos (Hugo)

El domingo 15 después de las 20:00, para cada código se comprueba en Supabase si la tarea quedó realmente hecha:

| Tarea | Se cuenta como lograda si... |
|---|---|
| T1 | Existe el perfil del maestro `pN@prueba.masterplace.cl` con estado "pendiente", un oficio, al menos una comuna de cobertura y un documento de tipo cédula |
| T2 | Existe el perfil de cliente `pN@prueba.masterplace.cl` |
| T4 | Ese cliente tiene al menos un contacto con un mensaje enviado |

Además, para T1 se registra la diferencia entre la creación de la cuenta y la subida de la cédula como tiempo
aproximado del registro (no incluye el tiempo antes de crear la cuenta).

Cuando el autorreporte y la base no coinciden (por ejemplo, la persona dice "Sí" pero el perfil no tiene cobertura),
**vale lo que dice la base** y la diferencia se anota como hallazgo: indica que la persona creyó terminar sin haberlo
hecho.

---

## 7. Cuestionario SUS (System Usability Scale)

Instrumento de Brooke (1996), 10 ítems, de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo). Se usa la
adaptación al español de Sevilla-González y colaboradores (2020), validada en *JMIR Human Factors*.

> [Antes del viernes: cotejar la redacción de los ítems con el artículo y archivar el PDF o el enlace en esta carpeta.
> No cambiar los ítems después de enviar el formulario.]

| # | Afirmación |
|---|---|
| 1 | Creo que me gustaría usar esta página con frecuencia. |
| 2 | Encontré la página innecesariamente compleja. |
| 3 | Pensé que la página era fácil de usar. |
| 4 | Creo que necesitaría ayuda de una persona con conocimientos técnicos para usar esta página. |
| 5 | Encontré que las distintas funciones de la página estaban bien integradas. |
| 6 | Pensé que había demasiada inconsistencia en la página. |
| 7 | Imagino que la mayoría de las personas aprendería a usar esta página muy rápidamente. |
| 8 | Encontré la página muy difícil de usar. |
| 9 | Me sentí muy seguro(a) usando la página. |
| 10 | Necesité aprender muchas cosas antes de poder usar la página. |

**Cálculo del puntaje (0 a 100)**

- Ítems impares (1, 3, 5, 7 y 9): respuesta − 1.
- Ítems pares (2, 4, 6, 8 y 10): 5 − respuesta.
- SUS = (suma de los 10 valores) × 2,5.

Ejemplo: respuestas 4, 2, 4, 1, 4, 2, 5, 1, 4, 2 → impares (3+3+3+4+3) = 16, pares (3+4+3+4+3) = 17,
SUS = 33 × 2,5 = **82,5**.

**En la hoja de respuestas:** las 10 preguntas del SUS quedan en columnas seguidas. Si van, por ejemplo, de la `X` a
la `AG`, en una columna nueva de la fila 2 se escribe lo siguiente y luego se copia hacia abajo:

```
=ARRAYFORMULA(2,5*SUMA(SI(ES.IMPAR(SECUENCIA(1;10));X2:AG2-1;5-X2:AG2)))
```

(Con la planilla en inglés: `=ARRAYFORMULA(2.5*SUM(IF(ISODD(SEQUENCE(1,10)),X2:AG2-1,5-X2:AG2)))`.)
Comprobarla primero con la respuesta de prueba del ejemplo: debe dar 82,5.

Referencia de interpretación: 68 es el promedio habitual del SUS en estudios publicados; la meta del proyecto (75)
está por sobre ese promedio. El SUS mide usabilidad percibida, no si la persona completó las tareas.

---

## 8. Análisis

1. **Efectividad:** por tarea, cuántos la lograron según la base de datos, y cuántos de ellos reportaron que les costó
   (por ejemplo, "T1: 3 de 4 lograda; 1 de esas 3 con dificultad"). Se informa como conteo, no como porcentaje de la
   población.
2. **Eficiencia:** distribución del tiempo autorreportado de T1 y el tiempo aproximado según la base, comparados con
   la meta de 5 minutos.
3. **Satisfacción:** SUS por participante, promedio, mínimo y máximo, comparados con la meta de 75.
4. **Comprensión de señales (V3):** clasificar cada respuesta de T5 como "distingue las dos", "distingue una" o
   "las confunde". Dos integrantes clasifican por separado y, si no coinciden, lo resuelven juntos.
5. **Preguntas abiertas:** agrupar las respuestas por tema (confianza, búsqueda y cobertura, contacto, barreras
   digitales y comparación con 2x3); contar coincidencias y citar frases textuales. En A2, contar cuántas veces cada
   señal quedó en primer lugar.
6. **Problemas:** lista con código (H-01, H-02...), tarea, evidencia, severidad, requisito afectado y cambio decidido.

| Severidad | Criterio | Qué se hace |
|---|---|---|
| Crítico | Impide completar una tarea esencial | Se corrige antes de E3 si es posible; si no, se informa |
| Mayor | Se completa con dificultad o con mucha demora | Entra a la planificación para E4 |
| Menor | Molestia o confusión que no afecta el resultado | Se registra |

7. **Decisiones:** cada hallazgo que cambie el diseño se lleva a `docs/gestion/bitacora_iteraciones.md` como
   iteración, con este estudio como disparador. La respuesta a V4 completa la decisión de la Iteración 1.

---

## 9. Resultados (15-11-2026)

**Fuente:** tablas `validacion_participantes` y `validacion_respuestas` y las tablas del producto (cuentas, maestros,
cédulas, contactos y mensajes), consultadas en el SQL Editor de Supabase el 15-11 en la noche. Participantes: P2, P3,
P5 (maestros) y P6 a P9 (clientes). Se excluyen los enlaces del equipo (P90 en adelante).

**Seguimiento con los participantes:** cuando la respuesta y la base no coincidían, Gabriel conversó con la persona.
Con eso, P2 y P5 se cuentan como registrados en T1, y P7 como logrado en T4. En la base están la cuenta y el contacto
de P7; no están las cuentas de P2 y P5 ni el mensaje de P7. Esto se aparta de la regla de la sección 6 («vale lo que dice la base») y se declara en los
límites.

### Resultados por participante

| Código | Perfil | T1 | T2 | T3 | T4 | T5 | Tiempo T1 | SUS |
|---|---|---|---|---|---|---|---|---|
| P2 | Maestro | Sí, sin problemas ¹ | — | — | — | Distingue las dos | 5:28 | 90 |
| P3 | Maestro | No pude | — | — | — | Distingue las dos | 1:30 (abandonó) | 70 |
| P5 | Maestro | Sí, sin problemas ² | — | — | — | Distingue las dos | 0:47 ³ | 72,5 |
| P6 | Cliente | — | Sí ✓ | Sí | Sí ✓ | No las distingue | — | 100 |
| P7 | Cliente | — | Sí ✓ | Sí | Sí ⁴ | No las distingue | — | 95 |
| P8 | Cliente | — | Sí, con ayuda ✓ ⁵ | Sí | Sí ✓ | Distingue una (certificado) | — | 100 |
| P9 | Cliente | — | Sí ✓ | Sí | Sí ✓ | Distingue una (certificado) ⁶ | — | 95 |
| **Resumen** | | **2/3** | **4/4** | **4/4** (declarado) | **4/4** | **3/7** distinguen las dos | — | **88,9** (70–100) |

✓ = confirmado en la base. T3 no deja rastro en la base: vale lo declarado y la respuesta escrita.

1. Confirmado en conversación; su cuenta no aparece en la base. 2. Confirmado en conversación; su cuenta no aparece en
la base. 3. Muy por debajo de lo posible
para 3 pasos: es probable que se registrara antes de pulsar «Comenzar»; el tiempo no es representativo. 4. Confirmado en
conversación: creó la cuenta, abrió el contacto y envió el mensaje; en la base están la cuenta y el contacto, pero no el
mensaje. 5. Comentó «Me ayudaron». 6. Interpretó «Identidad verificada» como «se filtró
su información».

**Tiempos de los clientes:** T2 entre 0:09 y 4:23; T3 entre 0:06 y 3:27. En T4, tres de cuatro registran 0 a 2 s entre
«Comenzar» y «Terminé», y P9 creó su cuenta después de marcar T2 como terminada: los participantes no siempre usaron los
botones mientras hacían la tarea, así que los tiempos de cliente solo orientan.

**SUS:** maestros 77,5 de promedio (90; 72,5; 70) y clientes 97,5 (100; 95; 100; 95). P6 y P8 marcaron 5 en todas las
afirmaciones positivas y 1 en todas las negativas, un patrón que puede indicar respuestas de cortesía. P5 marcó 1 en «Me
sentí muy seguro usando el sistema».

**T3, a quién eligieron y por qué:** tres de cuatro clientes eligieron al primer resultado (Juan González Silva, el más
cercano), y dos lo justificaron por la distancia («porque estaba más cerca», «por la distancia»). P8 no nombró a nadie.

**A2, qué señal pusieron primero (7 participantes):** reseñas 4 (P3, P6, P7, P8) e identidad verificada 3 (P2, P5, P9);
certificado y cercanía, ninguna vez. Cercanía quedó **última para 6 de 7**.

**A1 y comparación con 2x3:** los maestros consiguen clientes por recomendación, boca a boca, WhatsApp y Facebook
(Marketplace y avisos); los clientes encuentran maestros por conocidos y referencias. 6 de 7 no conocen 2x3 (P5 la
conoce y no la ha usado).

**A3 y A4 (agrupadas por tema):** confianza y facilidad de uso (P2, P3); calificación con estrellas y buen formato de
reseñas (P3, P6); cercanía (P5); app móvil (P7); alcance regional o comunal (P8); foto de perfil del maestro (P3, A4).

**Clasificación de T5:** «distingue las dos» si explica identidad (quién es) y certificado (qué sabe hacer) por separado;
«distingue una» si explica bien solo una; «no las distingue» si responde en general. Es una clasificación preliminar de
Gabriel: falta la segunda clasificación independiente que pide la sección 8 (propuesta: Hugo).

### Hallazgos

| Código | Tarea | Evidencia | Severidad | Requisito | Cambio decidido | Responsable |
|---|---|---|---|---|---|---|
| H-01 | T1 | P3 no encontró dónde inscribirse: «¿Dónde me inscribo? ¿O era imaginario…? […] no supe dónde debía inscribirme». Abandonó a los 90 s | Crítico | RF-1, RNF-3 | En la guía de T1, un botón que lleve directo a «Soy maestro» y una frase que diga que el registro es real | Gabriel |
| H-02 | T1 | Las cuentas de P2 y P5 no aparecen en la base, aunque ambos confirmaron haberlas creado | Mayor | RF-1 | Vincular la cuenta al enlace aunque use otro correo, y mostrar en la guía «Tu registro quedó pendiente de verificación» solo cuando exista | Gabriel |
| H-03 | T5 | Ningún cliente distinguió las dos señales; P9 entendió «Identidad verificada» como una filtración de datos | Mayor | RB-10, R-05 | Texto de ayuda en cada sello: «Revisamos su cédula; no la publicamos» y «Acreditó su oficio con un certificado» | Gabriel |
| H-04 | T4 | P7 escribió su mensaje, pero no quedó guardado: pulsó en otros lugares de la pantalla y creyó haberlo enviado | Mayor | RF-4, RF-11 | Al crear el contacto, poner el foco en la caja de mensaje, confirmar «Mensaje enviado» y avisar si se sale con un mensaje sin enviar | Joaquín |
| H-05 | T2 | P8 completó el registro con ayuda de otra persona | Menor | RF-10 | Se registra; observar en la próxima validación | Gabriel |
| H-06 | Instrumento | Tiempos de T4 de 0 a 2 s y T1 de P5 de 47 s: los botones «Comenzar» y «Terminé» no se usaron durante la tarea | Menor | RNF-3 | Medir el tiempo de T1 en la base (creación de la cuenta → subida de la cédula) | Gabriel |
| H-07 | A3/A4 | Piden calificación con estrellas, reseñas y foto de perfil | Menor | RF-5 | Las reseñas (RF-5) ya están implementadas; la foto de perfil entra a la planificación de E4 | Diego |

### Conclusiones

- **V1 (registro de maestro sin ayuda y en ≤ 5 min): no se cumple.** 2 de 3 maestros se registraron (meta: 4 de 5),
  confirmado en conversación; ninguna de las dos cuentas aparece en la base. El único tiempo válido, el de P2, fue 5:28, por encima de
  la meta. La causa principal (H-01) no es el formulario de registro, sino que la guía no deja claro dónde empieza.
- **V2 (el cliente encuentra y contacta a un maestro): se cumple.** 4 de 4 crearon su cuenta, encontraron un maestro y
  le escribieron (meta: 4 de 5); en la base hay 3 mensajes, y el de P7 se confirmó en conversación (H-04). El orden por distancia se entendió: los que
  explicaron su elección citaron la cercanía.
- **V3 (distinguen identidad y certificado): no se cumple para los clientes.** 3 de 3 maestros las distinguen, pero
  0 de 4 clientes. El riesgo R-05 (confundir identidad con calidad garantizada) se observa y se agrega el caso de leer
  «verificada» como exposición de datos.
- **V4 (lo que 2x3 no ofrece): respuesta mixta.** 2x3 casi no se conoce, y hoy todos se apoyan en recomendaciones. Lo
  que más pesa al elegir son las reseñas y la identidad verificada. La cercanía queda última en A2, aunque en la práctica
  los clientes eligieron al más cercano: funciona como filtro, no como razón para preferir la plataforma. Esto completa
  la Iteración 1: la propuesta de valor debe apoyarse en reseñas e identidad verificada, más que en la cercanía.
- **V5 (SUS ≥ 75): se cumple en promedio (88,9),** pero los maestros (77,5) quedan muy por debajo de los clientes
  (97,5), y 2 de 3 maestros están bajo 75.

### Límites del estudio

- Muestra pequeña y por conveniencia (7 personas): los resultados orientan el diseño, pero no representan a todos los
  maestros y clientes del Gran Concepción.
- **Tres datos se corrigieron por conversación con los participantes**, porque la base no los refleja: las cuentas de
  P2 y P5 (T1), el mensaje de P7 (T4) y la comuna de P2 y P9. Se marcan en cada caso (sección 6).
- P5, el suplente, respondió después del cierre de las 20:00; sin P5 habría solo 2 maestros.
- Prueba sin observación: los tiempos dependen de que el participante pulse «Comenzar» y «Terminé» en el momento justo
  (H-06), y la base confirma si la tarea quedó hecha, pero no cómo.
- La clasificación de T5 la hizo una sola persona.
- Los participantes son conocidos del equipo, lo que puede inflar las respuestas positivas (sesgo de complacencia);
  dos SUS de 100 con el mismo patrón de respuesta lo sugieren.
- Quienes no respondieron (P1) no aportan datos, y sus dificultades pueden quedar fuera (sesgo de abandono).
- Las reseñas (RF-5) no estaban visibles en la prueba: su importancia solo se conoce por A2 y A3.
