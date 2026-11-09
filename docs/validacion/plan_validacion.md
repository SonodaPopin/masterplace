# Plan de validación con usuarios (R3-C5)

| | |
|---|---|
| Responsable | Gabriel (diseña y facilita) |
| Registro de datos | Hugo (observa y anota) |
| Consentimiento y resguardo de datos | Ignacio |
| Sesiones | Sábado 14 y domingo 15 de noviembre de 2026 |
| Base | E1 §10.4, Anexo A (consentimiento y pautas) y Anexo B (tareas y SUS) |

R3-C5 nivel 4 pide: *"Diseña la validación de forma apropiada al objetivo (a quiénes, cuántos, con qué instrumento, qué
se busca establecer), presenta los datos obtenidos, los analiza con un método adecuado y extrae conclusiones que
reconocen los límites del estudio."* Este documento responde cada una de esas partes.

---

## 1. Qué se busca establecer

| # | Pregunta de validación | Cómo se responde | Requisito |
|---|---|---|---|
| V1 | ¿Un maestro puede registrarse sin ayuda en ≤ 3 pasos y ≤ 5 minutos? | Tarea T1 cronometrada | RF-1, RNF-3 |
| V2 | ¿Un cliente encuentra a un maestro compatible por oficio y comuna y lo contacta sin ayuda? | Tareas T3 y T4 | RF-3, RF-4, RF-11 |
| V3 | ¿Los usuarios distinguen "identidad verificada", "reseñas" y "certificado"? | Tarea T5 (explicar con sus palabras) | RB-10, riesgo R-05 |
| V4 | ¿Les importa lo que 2x3 no ofrece: certificación verificada, cercanía y cobertura en su comuna? | Preguntas abiertas A2 y A3 | Iteración 1 (bitácora) |
| V5 | ¿La usabilidad percibida alcanza la meta? | Cuestionario SUS | RNF-3 (meta SUS ≥ 75) |

**Metas declaradas en E1:** al menos 4 de 5 participantes completan las tareas esenciales de su perfil sin
intervención, el registro de maestro toma ≤ 5 minutos y el SUS promedio es ≥ 75. Si no se cumplen, se informa igual.

---

## 2. Participantes

**Cantidad:** 5 personas, 3 maestros y 2 clientes. Cinco participantes bastan para detectar los problemas de
usabilidad más frecuentes en una prueba exploratoria. No permiten estimar porcentajes de la población, y así se
declara.

**Criterios de inclusión**

- Mayor de 18 años y vive o trabaja en una de las 6 comunas del piloto (Concepción, Talcahuano, Hualpén, San Pedro de
  la Paz, Chiguayante o Penco).
- Maestro: trabaja en gasfitería, albañilería, carpintería, hojalatería o estructuras metálicas. Idealmente, los tres
  maestros son de oficios distintos.
- Cliente: contrató algún maestro en el último año.
- Usa un celular o un computador al menos de forma básica.

**Criterios de exclusión**

- Integrantes del equipo, compañeros de la asignatura o estudiantes de informática: sesgan los resultados de
  usabilidad.
- Personas que ya vieron o probaron el prototipo.

**Reclutamiento:** por contactos personales (familia, vecinos, maestros que hayan trabajado en sus casas). Agendar el
**lunes 9**, con 1 o 2 suplentes por si alguien cancela. Si el viernes 13 hay menos de 5 confirmados, se activa el
riesgo R-03 y se informa como limitación.

**Mensaje para invitar (WhatsApp)**

> Hola [nombre], soy Gabriel, estudio Ingeniería Civil Informática en la UdeC. Con mi grupo estamos haciendo una página
> web para encontrar maestros de oficios en el Gran Concepción, como proyecto del ramo. ¿Me podrías ayudar a probarla
> el sábado 14 o el domingo 15? Son unos 30 minutos: te pido hacer algunas tareas en la página y contestar unas
> preguntas. No hay respuestas buenas ni malas: estamos probando la página, no a ti. No te pediremos datos personales
> reales ni tu carnet. ¿Qué día y hora te acomoda?

### Agenda

| Código | Perfil | Oficio o comuna | Fecha y hora | Lugar o modalidad | Confirmado |
|---|---|---|---|---|---|
| P1 | Maestro | | | | |
| P2 | Maestro | | | | |
| P3 | Maestro | | | | |
| P4 | Cliente | | | | |
| P5 | Cliente | | | | |
| S1 | Suplente | | | | |

---

## 3. Modalidad y materiales

- **Presencial** de preferencia, en el dispositivo que la persona use habitualmente (celular o computador), sobre la
  versión publicada en Vercel. Si es remota, por videollamada compartiendo pantalla.
- Duración: **30 a 35 minutos** por persona.
- Facilitador (Gabriel) y observador (Hugo). El observador no habla durante las tareas.
- Materiales:
  - Enlace al sitio y número del commit desplegado (anotarlo en cada ficha).
  - Cuentas de prueba: para cada cliente, una conversación con un maestro ficticio ya verificado.
  - Imagen de cédula ficticia con la marca "DOCUMENTO FICTICIO SIN VALIDEZ", guardada en el dispositivo de la prueba.
  - Cronómetro.
  - Ficha de registro (sección 7) impresa o en una planilla, una por participante.
  - Cuestionario SUS (sección 6).
- Antes de cada sesión: verificar que el proyecto de Supabase no esté pausado y borrar las cuentas creadas en la
  sesión anterior.

---

## 4. Consentimiento informado

Leerlo en voz alta antes de empezar y registrar la respuesta con la fecha en la ficha. Adaptado del Anexo A de E1.

> Somos estudiantes de Ingeniería Civil Informática de la Universidad de Concepción y estamos desarrollando MasterPlace
> como proyecto académico. Le pediremos hacer algunas tareas en la página y responder un cuestionario breve; dura
> unos 30 minutos. Estamos evaluando la página, no a usted: si algo no resulta, es un problema de la página.
> Participar es voluntario y puede detenerse en cualquier momento sin dar explicaciones. Usaremos datos ficticios: no
> le pediremos su carnet ni su RUT. Registraremos sus respuestas con un código, sin su nombre, y no grabaremos audio ni
> video. Los resultados se usarán solo para mejorar el proyecto y presentarlo en la asignatura; las fichas se
> eliminarán al cerrar la evaluación y solo se conservarán resultados anónimos. ¿Acepta participar bajo estas
> condiciones?

---

## 5. Guion de la sesión

| Momento | Min. | Qué hacer |
|---|---|---|
| Bienvenida y consentimiento | 3 | Leer el consentimiento. Pedir que piense en voz alta: "cuénteme lo que va pensando mientras usa la página". |
| Preguntas iniciales | 4 | A1 (sección 5.2). |
| Tareas | 15 | Leer cada tarea tal como está escrita, una a la vez. Cronometrar. No ayudar (ver la regla de ayuda). |
| SUS | 4 | La persona responde sola el cuestionario. |
| Preguntas finales | 5 | A2 a A4. |
| Cierre | 1 | Agradecer. Si quiere, se le enviará un resumen de los resultados. |

**Regla de ayuda:** si la persona se atasca más de 60 segundos o pide ayuda, primero responder "¿qué haría usted si
estuviera solo?". Si sigue atascada, dar una pista mínima y anotarla como **ayuda**. Una tarea con ayuda cuenta como
*completada con ayuda*, no como éxito sin intervención.

**Frases que no se dicen:** "es fácil", "solo tiene que...", "muy bien" ni nada que indique la respuesta correcta.

### 5.1 Tareas

Leerlas como escenarios, sin nombrar botones ni pantallas.

**Maestros (P1–P3)**

| Tarea | Escenario que se lee | Éxito si... | Tiempo máx. |
|---|---|---|---|
| T1 Registro | "Usted quiere ofrecer sus servicios en esta página. Regístrese como maestro con su oficio, las comunas donde trabaja y la foto de carnet que está en el teléfono." | Su perfil queda "pendiente de verificación" sin ayuda. Se mide el tiempo y se cuentan los pasos. | 8 min |
| T5 Señales | (Mostrar un perfil ya verificado) "¿Qué significa cada una de estas marcas del perfil?" | Distingue con sus palabras identidad, reseñas y certificado. | 2 min |

**Clientes (P4–P5)**

| Tarea | Escenario que se lee | Éxito si... | Tiempo máx. |
|---|---|---|---|
| T2 Cuenta | "Cree una cuenta para poder contactar maestros." | Inicia sesión sin ayuda. | 4 min |
| T3 Búsqueda | "Se le rompió una cañería en su casa en [su comuna]. Busque un gásfiter que atienda ahí." | Llega a un maestro compatible y explica por qué aparece primero. | 4 min |
| T4 Contacto | "Escríbale para preguntarle si puede ir mañana." | El mensaje queda enviado en la conversación. | 3 min |
| T5 Señales | "¿Qué significa cada una de las marcas de este perfil?" | Distingue identidad, reseñas y certificado. | 2 min |

Si una función no está lista el viernes 13 (por ejemplo, el chat), la tarea se registra como **"no aplicable: función
no implementada"**. No se simula ni se cuenta como éxito.

### 5.2 Preguntas abiertas

- **A1 (al inicio).** Clientes: "Cuénteme la última vez que buscó un maestro: ¿cómo lo encontró y qué le preocupaba?"
  Maestros: "¿Cómo consigue clientes nuevos hoy?" A ambos: "¿Conoce o ha usado 2x3 u otra página parecida?"
- **A2.** "Para elegir a un maestro (o para que lo elijan), ¿qué le da más confianza: que su identidad esté
  verificada, las reseñas, un certificado del oficio o que esté cerca? Ordénelas."
- **A3.** "Si una página como 2x3 ya existe, ¿qué tendría que tener esta para que usted la usara?"
- **A4.** "¿Qué fue lo más difícil? ¿Qué cambiaría primero?"

Anotar las frases textuales más relevantes entre comillas.

---

## 6. Cuestionario SUS (System Usability Scale)

Instrumento de Brooke (1996), 10 ítems, de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo). Se usa la
adaptación al español de Sevilla-González y colaboradores (2020), validada en *JMIR Human Factors*.

> [Antes del sábado: cotejar la redacción de los ítems con el artículo y archivar el PDF o el enlace en esta carpeta.
> No cambiar los ítems entre participantes.]

| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| 1 | Creo que me gustaría usar esta página con frecuencia. | | | | | |
| 2 | Encontré la página innecesariamente compleja. | | | | | |
| 3 | Pensé que la página era fácil de usar. | | | | | |
| 4 | Creo que necesitaría ayuda de una persona con conocimientos técnicos para usar esta página. | | | | | |
| 5 | Encontré que las distintas funciones de la página estaban bien integradas. | | | | | |
| 6 | Pensé que había demasiada inconsistencia en la página. | | | | | |
| 7 | Imagino que la mayoría de las personas aprendería a usar esta página muy rápidamente. | | | | | |
| 8 | Encontré la página muy difícil de usar. | | | | | |
| 9 | Me sentí muy seguro(a) usando la página. | | | | | |
| 10 | Necesité aprender muchas cosas antes de poder usar la página. | | | | | |

**Cálculo del puntaje (0 a 100)**

- Ítems impares (1, 3, 5, 7 y 9): respuesta − 1.
- Ítems pares (2, 4, 6, 8 y 10): 5 − respuesta.
- SUS = (suma de los 10 valores) × 2,5.

Ejemplo: respuestas 4, 2, 4, 1, 4, 2, 5, 1, 4, 2 → impares (3+3+3+4+3) = 16, pares (3+4+3+4+3) = 17,
SUS = 33 × 2,5 = **82,5**.

Referencia de interpretación: 68 es el promedio habitual del SUS en estudios publicados; la meta del proyecto (75)
está por sobre ese promedio. El SUS mide usabilidad percibida, no si la persona completó las tareas.

---

## 7. Ficha de registro por participante

```
Código: P_    Perfil: maestro / cliente    Oficio o comuna:
Fecha y hora:            Modalidad: presencial / remota    Dispositivo y navegador:
Versión probada (commit):            Facilitador:            Observador:
Consentimiento leído y aceptado: sí / no    Hora:

Tarea | Resultado (éxito / con ayuda / no completada / no aplicable) | Tiempo | Errores | Ayudas | Observación textual
T1    |                                                              |        |         |        |
T2    |                                                              |        |         |        |
T3    |                                                              |        |         |        |
T4    |                                                              |        |         |        |
T5    |                                                              |        |         |        |

Pasos usados en T1 (si es maestro):
SUS (10 respuestas):                Puntaje:
A1:
A2 (orden de confianza):
A3:
A4:
```

### Severidad de los problemas observados

| Nivel | Criterio | Qué se hace |
|---|---|---|
| Crítico | Impide completar una tarea esencial | Se corrige antes de E3 si es posible; si no, se informa |
| Mayor | Se completa con ayuda o con mucha demora | Entra a la planificación para E4 |
| Menor | Molestia o confusión que no afecta el resultado | Se registra |

---

## 8. Análisis

1. **Efectividad:** por tarea, cuántos de los participantes que la intentaron la completaron sin ayuda (por ejemplo,
   "T3: 2 de 2"). Se informa como conteo, no como porcentaje de la población.
2. **Eficiencia:** tiempo de T1 por participante, mediana y máximo, comparados con la meta de 5 minutos.
3. **Satisfacción:** SUS por participante, promedio, mínimo y máximo, comparados con la meta de 75.
4. **Comprensión de señales (V3):** cuántos distinguen identidad, reseñas y certificado.
5. **Preguntas abiertas:** agrupar respuestas por tema (confianza, búsqueda y cobertura, contacto, barreras
   digitales, comparación con 2x3). Contar coincidencias y citar frases textuales.
6. **Problemas:** lista con código (H-01, H-02...), tarea, evidencia, severidad, requisito afectado y cambio decidido.
7. **Decisiones:** cada hallazgo que cambie el diseño se lleva a `docs/gestion/bitacora_iteraciones.md` como
   iteración, con este estudio como disparador. La respuesta a V4 completa la decisión de la Iteración 1.

---

## 9. Resultados (completar el 15-11)

| Código | Perfil | T1 | T2 | T3 | T4 | T5 | Tiempo T1 | SUS |
|---|---|---|---|---|---|---|---|---|
| P1 | Maestro | | — | — | — | | | |
| P2 | Maestro | | — | — | — | | | |
| P3 | Maestro | | — | — | — | | | |
| P4 | Cliente | — | | | | | — | |
| P5 | Cliente | — | | | | | — | |
| **Resumen** | | _/3 | _/2 | _/2 | _/2 | _/5 | mediana: | promedio: |

### Hallazgos

| Código | Tarea | Evidencia | Severidad | Requisito | Cambio decidido | Responsable |
|---|---|---|---|---|---|---|
| H-01 | | | | | | |

### Conclusiones

[Responder V1 a V5 con los datos, indicando qué metas se cumplieron y cuáles no.]

### Límites del estudio

- Muestra pequeña (5) y por conveniencia: los resultados orientan el diseño, pero no representan a todos los maestros
  y clientes del Gran Concepción.
- El prototipo está incompleto; las tareas no aplicables se informan.
- El propio equipo facilita las sesiones, lo que puede inflar las respuestas positivas (sesgo de complacencia).
- Datos y documentos ficticios: no se observa el comportamiento con información real.
