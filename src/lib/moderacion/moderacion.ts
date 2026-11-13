// Reglas puras del panel de moderación (RF-2, RF-8). Sin Supabase, para poder probarlas con Vitest.
// Responsable: Diego.

export type EstadoRevision = 'pendiente' | 'aprobado' | 'rechazado'
export type TipoDocumento = 'cedula' | 'certificado'

export type DocumentoResumen = {
  id: string
  tipo: TipoDocumento
  estado: EstadoRevision
  ruta_archivo: string | null
  creado_en: string
}

/** Duración de la URL firmada para ver la cédula: corta, solo para revisarla (§5.3). */
export const SEGUNDOS_URL_FIRMADA = 60

export const MOTIVO_MIN = 10
export const MOTIVO_MAX = 300

/**
 * Cédula que el admin debe revisar: la más reciente que sigue pendiente y todavía tiene archivo.
 * Devuelve null si el maestro no ha subido cédula (o si ya se borró).
 */
export function cedulaPorRevisar(documentos: readonly DocumentoResumen[]): DocumentoResumen | null {
  const candidatas = documentos.filter((d) => d.tipo === 'cedula' && d.estado === 'pendiente' && d.ruta_archivo)
  if (candidatas.length === 0) return null
  return candidatas.reduce((a, b) => (Date.parse(b.creado_en) > Date.parse(a.creado_en) ? b : a))
}

/** Limpia el motivo: quita espacios al borde y colapsa espacios y saltos repetidos. */
export function normalizarMotivo(motivo: string): string {
  return motivo.replace(/\s+/g, ' ').trim()
}

/** El rechazo siempre lleva un motivo que el maestro pueda entender. */
export function validarMotivo(motivo: string): string | undefined {
  const limpio = normalizarMotivo(motivo)
  if (!limpio) return 'Escribe el motivo del rechazo.'
  if (limpio.length < MOTIVO_MIN) return `El motivo debe tener al menos ${MOTIVO_MIN} caracteres.`
  if (limpio.length > MOTIVO_MAX) return `El motivo no puede superar los ${MOTIVO_MAX} caracteres.`
  return undefined
}

/**
 * Texto para `auditoria.objeto`. Identifica el documento y el maestro, nunca guarda la ruta del archivo
 * ni datos de la cédula (§5.3: la auditoría no contiene documentos).
 */
export function textoAuditoria(documentoId: string, maestroId: string, motivo?: string): string {
  const base = `documento:${documentoId} maestro:${maestroId}`
  return motivo ? `${base} motivo: ${normalizarMotivo(motivo)}` : base
}

export type TipoArchivo = 'imagen' | 'pdf' | 'otro'

/** Decide cómo mostrar la cédula según la extensión de la ruta en el bucket. */
export function tipoArchivo(ruta: string): TipoArchivo {
  const extension = ruta.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) return 'imagen'
  if (extension === 'pdf') return 'pdf'
  return 'otro'
}

/** Días completos desde el registro, para ordenar y mostrar cuánto lleva esperando. */
export function diasEsperando(creadoEn: string, ahora: Date = new Date()): number {
  const diferencia = ahora.getTime() - Date.parse(creadoEn)
  if (!Number.isFinite(diferencia) || diferencia < 0) return 0
  return Math.floor(diferencia / 86_400_000)
}

export function textoEspera(dias: number): string {
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Hace 1 día'
  return `Hace ${dias} días`
}
