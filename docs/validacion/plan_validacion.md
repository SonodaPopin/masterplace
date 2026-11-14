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
| V3 | ¿Distinguen "identidad verificada", "reseñas" y "certificado"? | Pregunta T5, respondida con sus palabras | RB-10, riesgo R-05 |
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

| Código | Perfil | Oficio o comuna | Aceptó | Enlace enviado | Respondió |
|---|---|---|---|---|---|
| P1 | Maestro | | | | |
| P2 | Maestro | | | | |
| P3 | Maestro | | | | |
| P4 | Maestro | | | | |
| P5 | Maestro | | | | |
| P6 | Cliente | | | | |
| P7 | Cliente | | | | |
| P8 | Cliente | | | | |

---

## 3. Preparación técnica (antes del viernes 13 a las 18:00)

| Qué | Responsable |
|---|---|
| Versión de la página congelada para la prueba en Vercel; anotar el número del commit | Joaquín |
| Durante la prueba, desactivar "Confirm email" en Supabase Auth, para que los participantes se registren con el correo de prueba que se les asigna (`p1@prueba.masterplace.cl`, etc.) y no tengan que dar su correo real. Reactivarlo el domingo en la noche | Joaquín |
| Tres o más maestros ficticios ya verificados en cada comuna y oficio, para que la búsqueda de los clientes tenga resultados | Ignacio |
| Imagen de carnet ficticio con la marca "DOCUMENTO FICTICIO SIN VALIDEZ" (se descarga desde el panel de la tarea: `public/carnet_prueba.png`) | Gabriel |
| Migración `20261114000000_validacion_usuarios.sql` aplicada y enlaces creados con `participantes.sql` | Gabriel |
| Prueba de punta a punta con los enlaces del equipo P90 (maestro) y P91 (cliente); después se borran sus respuestas | Gabriel |
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
| T5 Señales | Ambos | "En la página, los perfiles muestran marcas como 'Identidad verificada', las reseñas y 'Certificado'. Explique con sus palabras qué significa cada una." | — (se clasifica la respuesta) |

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
4. **Comprensión de señales (V3):** clasificar cada respuesta de T5 como "distingue las tres", "distingue algunas" o
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

## 9. Resultados (completar el 15-11)

| Código | Perfil | T1 | T2 | T3 | T4 | T5 | Tiempo T1 | SUS |
|---|---|---|---|---|---|---|---|---|
| P1 | Maestro | | — | — | — | | | |
| | | | | | | | | |
| **Resumen** | | _/_ | _/_ | _/_ | _/_ | _/_ | | promedio: |

### Hallazgos

| Código | Tarea | Evidencia | Severidad | Requisito | Cambio decidido | Responsable |
|---|---|---|---|---|---|---|
| H-01 | | | | | | |

### Conclusiones

[Responder V1 a V5 con los datos, indicando qué metas se cumplieron y cuáles no.]

### Límites del estudio

- Muestra pequeña y por conveniencia: los resultados orientan el diseño, pero no representan a todos los maestros y
  clientes del Gran Concepción.
- Prueba sin observación: los tiempos y las dificultades son autorreportados; la base de datos confirma si la tarea
  quedó hecha, pero no cómo se hizo ni dónde se confundió la persona.
- Quienes no terminaron el formulario no aportan datos, y sus dificultades pueden quedar fuera (sesgo de abandono).
- Los participantes son conocidos del equipo, lo que puede inflar las respuestas positivas (sesgo de complacencia).
- Prototipo incompleto (las tareas no aplicables se informan) y datos ficticios.
