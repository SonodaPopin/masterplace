import { HORAS_ESPERA_REALIZADA, dentroDelPlazoDeResena, puedeMarcarseRealizada } from './reglas'

// Presentación de la solicitud de servicio en el chat (Gabriel, #64). Las reglas las aplica la base;
// aquí solo se decide qué mostrar. Las cifras salen de reglas.ts, que repite las de la migración.

export type EstadoSolicitud = 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada' | 'realizada'
export type RolConversacion = 'cliente' | 'maestro'

type SolicitudVista = {
  estado: EstadoSolicitud
  fechaAcordada: string
  puedeResenar: boolean
}

export const ETIQUETA_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente: 'Esperando respuesta',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
  realizada: 'Realizada',
}

export const MAX_DESCRIPCION = 500
export const MAX_MOTIVO = 300
// Mismos límites que crear_solicitud (FECHA_INVALIDA): hasta 7 días atrás y 60 hacia adelante.
const DIAS_ATRAS = 7
const DIAS_ADELANTE = 60

const MS_POR_HORA = 60 * 60 * 1000
const MS_POR_DIA = 24 * MS_POR_HORA

export type AccionesSolicitud = {
  aceptarORechazar: boolean
  cancelar: boolean
  marcarRealizada: boolean
  resenar: boolean
  /** Aceptada pero todavía sin las 2 h: desde cuándo se podrá marcar como realizada. */
  realizadaDesde: Date | null
}

/** Qué puede hacer quien mira la tarjeta. */
export function accionesSolicitud(
  solicitud: SolicitudVista,
  rol: RolConversacion,
  ahora: Date = new Date(),
): AccionesSolicitud {
  const fecha = new Date(solicitud.fechaAcordada)
  const aceptada = solicitud.estado === 'aceptada'
  const yaSePuedeMarcar = aceptada && puedeMarcarseRealizada(fecha, ahora)

  return {
    aceptarORechazar: rol === 'maestro' && solicitud.estado === 'pendiente',
    cancelar:
      rol === 'cliente' &&
      (solicitud.estado === 'pendiente' || aceptada) &&
      ahora.getTime() < fecha.getTime(),
    marcarRealizada: yaSePuedeMarcar,
    resenar: rol === 'cliente' && solicitud.puedeResenar,
    realizadaDesde:
      aceptada && !yaSePuedeMarcar
        ? new Date(fecha.getTime() + HORAS_ESPERA_REALIZADA * MS_POR_HORA)
        : null,
  }
}

/** Las que ya no piden nada a nadie se agrupan como «anteriores». */
export function esSolicitudActiva(solicitud: SolicitudVista, rol: RolConversacion): boolean {
  if (solicitud.estado === 'pendiente' || solicitud.estado === 'aceptada') return true
  return rol === 'cliente' && solicitud.puedeResenar
}

// ---------------------------------------------------------------------
// Fecha del formulario (<input type="datetime-local">, hora local)
// ---------------------------------------------------------------------
const dosDigitos = (n: number) => String(n).padStart(2, '0')

/** Fecha en el formato de datetime-local, en la hora local del navegador: «2026-11-27T15:30». */
export function aValorLocal(fecha: Date): string {
  return (
    `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
    `T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
  )
}

/** Convierte el valor del campo (hora local) a ISO 8601 con zona, o null si no es una fecha. */
export function desdeValorLocal(valor: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null
  const fecha = new Date(valor) // sin zona: el navegador la interpreta como hora local
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString()
}

export function limitesFecha(ahora: Date = new Date()): { min: string; max: string } {
  return {
    min: aValorLocal(new Date(ahora.getTime() - DIAS_ATRAS * MS_POR_DIA)),
    max: aValorLocal(new Date(ahora.getTime() + DIAS_ADELANTE * MS_POR_DIA)),
  }
}

export type ErroresSolicitud = { descripcion?: string; fecha?: string }

export function validarSolicitud(
  descripcion: string,
  fechaLocal: string,
  ahora: Date = new Date(),
): ErroresSolicitud {
  const errores: ErroresSolicitud = {}
  const texto = descripcion.trim()
  if (!texto) errores.descripcion = 'Cuéntale al maestro qué necesitas.'
  else if (texto.length > MAX_DESCRIPCION) {
    errores.descripcion = `Usa como máximo ${MAX_DESCRIPCION} caracteres.`
  }

  const iso = desdeValorLocal(fechaLocal)
  if (!iso) errores.fecha = 'Elige el día y la hora que acordaron.'
  else {
    const ms = new Date(iso).getTime()
    if (ms < ahora.getTime() - DIAS_ATRAS * MS_POR_DIA) {
      errores.fecha = `La fecha no puede ser de hace más de ${DIAS_ATRAS} días.`
    } else if (ms > ahora.getTime() + DIAS_ADELANTE * MS_POR_DIA) {
      errores.fecha = `La fecha puede estar como máximo ${DIAS_ADELANTE} días hacia adelante.`
    }
  }
  return errores
}

// ---------------------------------------------------------------------
// Aviso de la bandeja de conversaciones
// ---------------------------------------------------------------------
export type FilaAviso = {
  id: string
  estado: EstadoSolicitud
  cliente_id: string
  realizada_en: string | null
}

export type AvisoBandeja = 'resenar' | 'pendiente' | null

export const TEXTO_AVISO: Record<Exclude<AvisoBandeja, null>, string> = {
  resenar: 'Puedes dejar una reseña',
  pendiente: 'Solicitud pendiente',
}

/**
 * Aviso de un contacto. Al cliente le importa más la reseña que una solicitud en espera;
 * «Solicitud pendiente» le sirve al maestro (tiene que responder) y al cliente (espera respuesta).
 */
export function avisoDeContacto(
  filas: FilaAviso[],
  usuarioId: string,
  conResena: Set<string>,
  ahora: Date = new Date(),
): AvisoBandeja {
  const puedeResenar = filas.some(
    (f) =>
      f.estado === 'realizada' &&
      f.cliente_id === usuarioId &&
      !conResena.has(f.id) &&
      dentroDelPlazoDeResena(f.realizada_en, ahora),
  )
  if (puedeResenar) return 'resenar'
  return filas.some((f) => f.estado === 'pendiente') ? 'pendiente' : null
}
