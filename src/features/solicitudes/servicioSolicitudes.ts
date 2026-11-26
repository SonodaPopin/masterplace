import { supabase } from '../../lib/supabase'
import {
  dentroDelPlazoDeResena,
  puedeMarcarseRealizada,
} from '../../lib/solicitudes/reglas.ts'

// ---------------------------------------------------------------------
// Contrato (COMO_TRABAJAMOS.md §1): no cambiar nombres ni tipos sin
// avisar en el issue a Gabriel y Hugo. Agregar algo opcional sí se puede.
// ---------------------------------------------------------------------
export type EstadoSolicitud =
  | 'pendiente'
  | 'aceptada'
  | 'rechazada'
  | 'cancelada'
  | 'realizada'

export type Solicitud = {
  id: string
  contactoId: string
  descripcion: string
  fechaAcordada: string // ISO 8601
  estado: EstadoSolicitud
  /** Aceptada y ya pasaron 2 h desde la fecha acordada. */
  puedeMarcarRealizada: boolean
  /** Realizada, quien mira es el cliente, sin reseña y dentro de 30 días. */
  puedeResenar: boolean
}

// Fila tal como viene de la base (solo lo que hace falta para calcular el tipo).
type FilaSolicitud = {
  id: string
  contacto_id: string
  cliente_id: string
  descripcion: string
  fecha_acordada: string
  estado: EstadoSolicitud
  realizada_en: string | null
}

const COLUMNAS =
  'id, contacto_id, cliente_id, descripcion, fecha_acordada, estado, realizada_en'

// ---------------------------------------------------------------------
// Traducción de errores (códigos que lanzan las funciones de la base)
// ---------------------------------------------------------------------
const TEXTOS_ERROR: Record<string, string> = {
  SOLO_CLIENTE: 'Solo el cliente puede hacer esto.',
  SOLO_MAESTRO: 'Solo el maestro puede responder esta solicitud.',
  NO_PARTICIPANTE: 'No participas en esta solicitud.',
  CONTACTO_CERRADO: 'Esta conversación está cerrada, no se pueden crear solicitudes.',
  FECHA_INVALIDA:
    'La fecha no es válida: debe estar entre 7 días atrás y 60 días hacia adelante.',
  DESCRIPCION_INVALIDA: 'Describe lo que necesitas en un máximo de 500 caracteres.',
  MOTIVO_INVALIDO: 'El motivo del rechazo puede tener hasta 300 caracteres.',
  ESTADO_INVALIDO: 'La solicitud ya no está en un estado que permita esta acción.',
  FUERA_DE_PLAZO: 'Ya pasó la fecha acordada, la solicitud no se puede cancelar.',
  AUN_NO:
    'Todavía no puedes marcarla como realizada: espera 2 horas desde la fecha acordada.',
}

const TEXTO_SIN_PERMISO = 'No tienes permiso para realizar esta acción.'
const TEXTO_ERROR_GENERICO = 'No fue posible completar la acción. Inténtalo nuevamente.'

/** Convierte los errores controlados por las funciones de solicitudes en mensajes para la interfaz. */
export function traducirErrorSolicitud(mensaje: string): string {
  for (const [codigo, texto] of Object.entries(TEXTOS_ERROR)) {
    if (mensaje.includes(codigo)) return texto
  }
  if (mensaje.includes('row-level security') || mensaje.includes('permission denied')) {
    return TEXTO_SIN_PERMISO
  }
  return TEXTO_ERROR_GENERICO
}

// ---------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------
async function idsConResena(solicitudIds: string[]): Promise<Set<string>> {
  if (solicitudIds.length === 0) return new Set()

  const { data, error } = await supabase
    .from('resenas')
    .select('solicitud_id')
    .in('solicitud_id', solicitudIds)

  if (error) throw new Error(traducirErrorSolicitud(error.message))

  return new Set(
    (data ?? [])
      .map((fila: { solicitud_id: string | null }) => fila.solicitud_id)
      .filter((id: string | null): id is string => id !== null),
  )
}

/**
 * Solicitudes de un contacto, de la más reciente a la más antigua.
 * Las políticas RLS ya filtran: solo ven las suyas el cliente, el maestro y el admin.
 */
export async function listarSolicitudes(contactoId: string): Promise<Solicitud[]> {
  const { data: sesion } = await supabase.auth.getUser()
  const usuarioId = sesion.user?.id ?? null

  const { data, error } = await supabase
    .from('solicitudes_servicio')
    .select(COLUMNAS)
    .eq('contacto_id', contactoId)
    .order('creada_en', { ascending: false })

  if (error) throw new Error(traducirErrorSolicitud(error.message))

  const filas = (data ?? []) as FilaSolicitud[]
  const conResena = await idsConResena(
    filas.filter((f) => f.estado === 'realizada').map((f) => f.id),
  )
  const ahora = new Date()

  return filas.map((f) => ({
    id: f.id,
    contactoId: f.contacto_id,
    descripcion: f.descripcion,
    fechaAcordada: f.fecha_acordada,
    estado: f.estado,
    puedeMarcarRealizada:
      f.estado === 'aceptada' && puedeMarcarseRealizada(f.fecha_acordada, ahora),
    puedeResenar:
      f.estado === 'realizada' &&
      usuarioId !== null &&
      usuarioId === f.cliente_id &&
      !conResena.has(f.id) &&
      dentroDelPlazoDeResena(f.realizada_en, ahora),
  }))
}

// ---------------------------------------------------------------------
// Acciones (todas pasan por funciones de la base)
// ---------------------------------------------------------------------
export async function crearSolicitud(
  contactoId: string,
  descripcion: string,
  fechaAcordada: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('crear_solicitud', {
    p_contacto_id: contactoId,
    p_descripcion: descripcion,
    p_fecha_acordada: fechaAcordada,
  })
  if (error) throw new Error(traducirErrorSolicitud(error.message))
  if (typeof data !== 'string' || data.length === 0) {
    throw new Error('Supabase no devolvió un identificador de solicitud válido.')
  }

  return data
}

export async function responderSolicitud(
  id: string,
  aceptar: boolean,
  motivo?: string,
): Promise<void> {
  const { error } = await supabase.rpc('responder_solicitud', {
    p_id: id,
    p_aceptar: aceptar,
    p_motivo: motivo ?? null,
  })
  if (error) throw new Error(traducirErrorSolicitud(error.message))
}

export async function cancelarSolicitud(id: string): Promise<void> {
  const { error } = await supabase.rpc('cancelar_solicitud', { p_id: id })
  if (error) throw new Error(traducirErrorSolicitud(error.message))
}

export async function marcarRealizada(id: string): Promise<void> {
  const { error } = await supabase.rpc('marcar_realizada', { p_id: id })
  if (error) throw new Error(traducirErrorSolicitud(error.message))
}