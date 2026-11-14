// Validación con usuarios dentro de la app (docs/validacion/plan_validacion.md). Responsable: Gabriel.
//
// Guion de la prueba: qué pasos ve cada perfil y en qué orden, con los mismos textos del Google Form que reemplaza
// (docs/validacion/crear_formulario.gs). Son reglas puras: la página y el panel solo las muestran.
//
// Cada paso se guarda con una clave en `validacion_respuestas`. Las tareas guardan además `<id>_inicio` y `<id>_fin`
// (fecha ISO) para medir el tiempo real, en vez del tiempo autorreportado del formulario.

export type Perfil = 'maestro' | 'cliente'
export type Respuestas = Record<string, unknown>
export type IdTarea = 't1' | 't2' | 't3' | 't4'

export const ESCALA_LOGRO = ['Sí, sin problemas', 'Sí, pero me costó', 'No pude', 'No lo intenté'] as const
export type Logro = (typeof ESCALA_LOGRO)[number]

export const COMUNAS = ['Concepción', 'Talcahuano', 'Hualpén', 'San Pedro de la Paz', 'Chiguayante', 'Penco', 'Otra']
export const APARATOS = ['Celular', 'Tablet', 'Computador']
export const USO_2X3 = ['La he usado', 'La conozco, pero no la he usado', 'No la conozco']

export const CONSENTIMIENTO = [
  'Somos estudiantes de Ingeniería Civil Informática de la Universidad de Concepción y estamos desarrollando ' +
    'MasterPlace como proyecto académico. Le pediremos hacer algunas tareas en la página y responder preguntas; toma ' +
    'unos 10 a 15 minutos. Estamos evaluando la página, no a usted: si algo no resulta, es un problema de la página.',
  'Participar es voluntario y puede dejar de responder en cualquier momento. Usará un correo y un carnet de prueba ' +
    'que le damos nosotros: no le pediremos su carnet, su RUT ni su correo real. Esta prueba no registra su nombre ni ' +
    'su correo real; lo identificamos solo con un código. Guardaremos sus respuestas, cuánto tarda en cada tarea y ' +
    'las acciones hechas en la página con su cuenta de prueba.',
  'Los resultados se usarán solo para mejorar el proyecto y presentarlo en la asignatura; las respuestas se ' +
    'eliminarán al cerrar la evaluación y solo se conservarán resultados anónimos.',
]

export const PREGUNTA_ANTES: Record<Perfil, string> = {
  maestro: 'Antes de empezar: ¿cómo consigue clientes nuevos hoy?',
  cliente: 'Antes de empezar: cuéntenos la última vez que buscó un maestro. ¿Cómo lo encontró y qué le preocupaba?',
}

// Solo las marcas que el participante ve: las reseñas (RF-5) aún no existen, así que no se pregunta por ellas aquí.
// Su importancia para elegir se recoge igual en A2.
export const PREGUNTA_SENALES =
  'En la página, los perfiles muestran marcas como "Identidad verificada" y "Certificado". ' +
  'Explique con sus palabras qué significa cada una.'

export const ITEMS_SUS = [
  'Creo que me gustaría usar esta página con frecuencia.',
  'Encontré la página innecesariamente compleja.',
  'Pensé que la página era fácil de usar.',
  'Creo que necesitaría ayuda de una persona con conocimientos técnicos para usar esta página.',
  'Encontré que las distintas funciones de la página estaban bien integradas.',
  'Pensé que había demasiada inconsistencia en la página.',
  'Imagino que la mayoría de las personas aprendería a usar esta página muy rápidamente.',
  'Encontré la página muy difícil de usar.',
  'Me sentí muy seguro(a) usando la página.',
  'Necesité aprender muchas cosas antes de poder usar la página.',
]

export const PREGUNTA_A2 =
  'Para elegir a un maestro (o para que lo elijan a usted), ¿qué tan importante es cada cosa? ' +
  'Use cada número una sola vez: 1 = la más importante.'
export const SENALES_A2 = [
  { clave: 'identidad', texto: 'Identidad verificada' },
  { clave: 'resenas', texto: 'Reseñas de otros clientes' },
  { clave: 'certificado', texto: 'Certificado del oficio' },
  { clave: 'cercania', texto: 'Que esté cerca' },
] as const
export const PREGUNTA_A3 = 'Ya existen páginas como 2x3. ¿Qué tendría que tener esta para que usted la usara?'
export const PREGUNTA_A4 = '¿Qué fue lo más difícil? ¿Qué cambiaría primero?'

export type Tarea = {
  id: IdTarea
  titulo: string
  instruccion: string
  /** Pregunta abierta obligatoria después de la tarea (T3). */
  preguntaExtra?: string
  /** Muestra el enlace al carnet de prueba (T1). */
  carnet?: boolean
}

const TERMINAR = ' Cuando termine, toque «Terminé la tarea».'

const TAREAS: Record<Perfil, Tarea[]> = {
  maestro: [
    {
      id: 't1',
      titulo: 'Registrarse',
      instruccion:
        'Imagine que quiere ofrecer sus servicios en esta página. Regístrese como maestro con su correo de prueba, ' +
        'su oficio, las comunas donde trabaja y la imagen del carnet de prueba.' +
        TERMINAR,
      carnet: true,
    },
  ],
  cliente: [
    { id: 't2', titulo: 'Crear su cuenta', instruccion: 'Cree una cuenta de cliente con su correo de prueba.' + TERMINAR },
    {
      id: 't3',
      titulo: 'Buscar un maestro',
      instruccion:
        'Imagine que se le rompió una cañería en su casa. Busque un gásfiter que atienda en su comuna.' + TERMINAR,
      preguntaExtra: '¿Qué maestro eligió y por qué cree que apareció primero?',
    },
    {
      id: 't4',
      titulo: 'Contactar al maestro',
      instruccion: 'Escríbale a ese maestro para preguntarle si puede ir mañana.' + TERMINAR,
    },
  ],
}

export type Paso =
  | { tipo: 'consentimiento'; clave: 'consentimiento' }
  | { tipo: 'datos'; clave: 'datos' }
  | { tipo: 'antes'; clave: 'a1' }
  | { tipo: 'tarea'; clave: IdTarea; tarea: Tarea; numero: number; total: number }
  | { tipo: 'senales'; clave: 't5' }
  | { tipo: 'sus'; clave: 'sus' }
  | { tipo: 'finales'; clave: 'finales' }
  | { tipo: 'fin'; clave: 'fin'; rechazo: boolean }

export function tareasDe(perfil: Perfil): Tarea[] {
  return TAREAS[perfil]
}

/** Todos los pasos del perfil, en orden. */
export function guion(perfil: Perfil): Paso[] {
  const tareas = TAREAS[perfil]
  return [
    { tipo: 'consentimiento', clave: 'consentimiento' },
    { tipo: 'datos', clave: 'datos' },
    { tipo: 'antes', clave: 'a1' },
    ...tareas.map((tarea, i) => ({
      tipo: 'tarea' as const,
      clave: tarea.id,
      tarea,
      numero: i + 1,
      total: tareas.length,
    })),
    { tipo: 'senales', clave: 't5' },
    { tipo: 'sus', clave: 'sus' },
    { tipo: 'finales', clave: 'finales' },
    { tipo: 'fin', clave: 'fin', rechazo: false },
  ]
}

function aceptoParticipar(respuestas: Respuestas): boolean | null {
  const c = respuestas.consentimiento as { acepta?: unknown } | undefined
  return typeof c?.acepta === 'boolean' ? c.acepta : null
}

/** El primer paso sin responder. Si no aceptó participar, la prueba termina ahí. */
export function pasoActual(perfil: Perfil, respuestas: Respuestas): Paso {
  if (aceptoParticipar(respuestas) === false) return { tipo: 'fin', clave: 'fin', rechazo: true }
  const pasos = guion(perfil)
  return pasos.find((p) => p.tipo !== 'fin' && !(p.clave in respuestas)) ?? pasos[pasos.length - 1]
}

/** Posición del paso para la barra de progreso (el paso final no cuenta). */
export function progreso(perfil: Perfil, paso: Paso): { numero: number; total: number } {
  const pasos = guion(perfil).filter((p) => p.tipo !== 'fin')
  const i = pasos.findIndex((p) => p.clave === paso.clave)
  return { numero: i < 0 ? pasos.length : i + 1, total: pasos.length }
}

export type EstadoTarea = 'por_comenzar' | 'en_curso' | 'por_evaluar' | 'evaluada'

export function estadoTarea(id: IdTarea, respuestas: Respuestas): EstadoTarea {
  if (id in respuestas) return 'evaluada'
  if (`${id}_fin` in respuestas) return 'por_evaluar'
  if (`${id}_inicio` in respuestas) return 'en_curso'
  return 'por_comenzar'
}

/** Segundos entre «Comenzar» y «Terminé», o null si falta alguna marca o no son fechas válidas. */
export function segundosTarea(id: IdTarea, respuestas: Respuestas): number | null {
  const inicio = Date.parse(String(respuestas[`${id}_inicio`] ?? ''))
  const fin = Date.parse(String(respuestas[`${id}_fin`] ?? ''))
  if (Number.isNaN(inicio) || Number.isNaN(fin) || fin < inicio) return null
  return Math.round((fin - inicio) / 1000)
}

/**
 * Puntaje SUS (Brooke, 1996) de 0 a 100. Ítems impares: respuesta − 1; pares: 5 − respuesta; suma × 2,5.
 * Ejemplo del plan: 4, 2, 4, 1, 4, 2, 5, 1, 4, 2 → 82,5.
 */
export function puntajeSus(respuestas: readonly number[]): number {
  if (respuestas.length !== 10 || respuestas.some((r) => !Number.isInteger(r) || r < 1 || r > 5)) {
    throw new Error('El SUS necesita 10 respuestas enteras de 1 a 5')
  }
  const suma = respuestas.reduce((total, r, i) => total + (i % 2 === 0 ? r - 1 : 5 - r), 0)
  return suma * 2.5
}

/** A2: cada señal con un número del 1 al 4, sin repetir. Devuelve el error a mostrar o null. */
export function validarOrdenSenales(orden: Partial<Record<string, number>>): string | null {
  const valores = SENALES_A2.map((s) => orden[s.clave])
  if (valores.some((v) => v == null)) return 'Asigne un número a cada una.'
  if (new Set(valores).size !== valores.length) return 'Use cada número una sola vez.'
  return null
}

/** Correo de prueba del participante: P3 → p3@prueba.masterplace.cl. */
export function correoPrueba(codigo: string): string {
  return `${codigo.toLowerCase()}@prueba.masterplace.cl`
}
