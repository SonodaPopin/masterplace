import { esComunaPiloto } from '../catalogos/comunas'
import type { ErroresFormulario } from '../auth/validacion'

// Validación del registro de maestro (RF-1), pasos 2 y 3. Funciones puras para probarlas sin Supabase.

export type DatosPerfilMaestro = {
  oficioId: string
  aniosExperiencia: string
  descripcion: string
  coberturas: number[]
}

// Mismos límites que los check de la tabla maestros.
export const LARGO_MAXIMO_DESCRIPCION = 600
export const ANIOS_MAXIMOS = 70

export function validarPerfilMaestro(d: DatosPerfilMaestro): ErroresFormulario<DatosPerfilMaestro> {
  const errores: ErroresFormulario<DatosPerfilMaestro> = {}

  if (!d.oficioId) errores.oficioId = 'Elige tu oficio.'

  const anios = d.aniosExperiencia.trim()
  if (anios) {
    const n = Number(anios)
    if (!Number.isInteger(n) || n < 0 || n > ANIOS_MAXIMOS)
      errores.aniosExperiencia = `Escribe un número entero entre 0 y ${ANIOS_MAXIMOS}.`
  }

  if (d.descripcion.trim().length > LARGO_MAXIMO_DESCRIPCION)
    errores.descripcion = `La descripción no puede superar ${LARGO_MAXIMO_DESCRIPCION} caracteres.`

  if (d.coberturas.length === 0) errores.coberturas = 'Marca al menos una comuna donde trabajas.'
  else if (!d.coberturas.every(esComunaPiloto)) errores.coberturas = 'Hay una comuna que no está en el piloto.'

  return errores
}

// Mismos límites que el bucket privado «cedulas» (migración de políticas de Ignacio).
export const TIPOS_CEDULA = ['image/jpeg', 'image/png', 'application/pdf'] as const
export const TAMANO_MAXIMO_CEDULA = 5 * 1024 * 1024

export function validarArchivoCedula(archivo: { size: number; type: string } | null): string | undefined {
  if (!archivo) return 'Adjunta la imagen o el PDF de la cédula.'
  if (!(TIPOS_CEDULA as readonly string[]).includes(archivo.type))
    return 'El archivo debe ser una imagen JPG o PNG, o un PDF.'
  if (archivo.size > TAMANO_MAXIMO_CEDULA) return 'El archivo pesa más de 5 MB. Prueba con una foto más liviana.'
  return undefined
}

export function extensionCedula(tipo: string): 'jpg' | 'png' | 'pdf' {
  if (tipo === 'image/png') return 'png'
  if (tipo === 'application/pdf') return 'pdf'
  return 'jpg'
}

// Ruta en el bucket: la primera carpeta debe ser el id del dueño (lo exige la política de Storage).
export function rutaCedula(maestroId: string, tipo: string, ahora = Date.now()): string {
  return `${maestroId}/cedula-${ahora}.${extensionCedula(tipo)}`
}

// Punto declarado del maestro. Se redondea a 3 decimales (unos 100 m) para no guardar su dirección exacta.
export function redondearCoordenada(valor: number, decimales = 3): number {
  const factor = 10 ** decimales
  return Math.round(valor * factor) / factor
}

// Formato EWKT que Postgres acepta para una columna geography(point, 4326). Ojo: primero longitud.
export function puntoEWKT(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

// Traduce errores de la base de datos o de Storage a un texto entendible.
export function mensajeErrorDatos(mensaje: string): string {
  const m = mensaje.toLowerCase()
  if (m.includes('row-level security') || m.includes('permission denied'))
    return 'Tu cuenta no tiene permiso para esta acción. Cierra sesión, vuelve a ingresar e inténtalo de nuevo.'
  if (m.includes('mime') || m.includes('invalid_mime_type')) return 'El archivo debe ser una imagen JPG o PNG, o un PDF.'
  if (m.includes('exceeded') || m.includes('too large') || m.includes('payload'))
    return 'El archivo pesa más de 5 MB. Prueba con una foto más liviana.'
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.'
  return 'No pudimos guardar los datos. Inténtalo de nuevo en un momento.'
}
