import { formatearRut, normalizarRut, validarRut } from '../rut/rut'

// RUT del maestro en el registro (#62, H-01). Validación y formato de Hugo (src/lib/rut/rut.ts); la base lo vuelve a
// validar con el CHECK maestros_privado_rut_valido_check de Joaquín (20261123010000_rut.sql), que exige «12345678-5».

export const ERROR_RUT_DUPLICADO = 'Este RUT ya está registrado en otra cuenta. Si es tuyo, inicia sesión con esa cuenta.'
const ERROR_RUT_RECHAZADO = 'El RUT no es válido: revisa el número y el dígito verificador.'

export type RutPreparado = { ok: false; error: string } | { ok: true; guardar: string; mostrar: string }

/** Valida lo que escribió el maestro y lo deja listo para guardar («12345678-5») y para mostrar («12.345.678-5»). */
export function prepararRut(texto: string): RutPreparado {
  const error = validarRut(texto)
  if (error) return { ok: false, error }
  return { ok: true, guardar: normalizarRut(texto), mostrar: formatearRut(texto) }
}

/** Al salir del campo: si es válido se muestra con puntos y guion; si no, se deja como lo escribió. */
export function rutAlSalir(texto: string): { valor: string; error?: string } {
  if (!texto.trim()) return { valor: texto }
  const preparado = prepararRut(texto)
  return preparado.ok ? { valor: preparado.mostrar } : { valor: texto, error: preparado.error }
}

/** Error de Supabase al guardar en maestros_privado → texto para el campo RUT (o null si no es del RUT). */
export function errorRutDesdeBase(error: { code?: string; message?: string }): string | null {
  if (error.code === '23505') return ERROR_RUT_DUPLICADO
  if (error.code === '23514' || error.message?.includes('rut_valido')) return ERROR_RUT_RECHAZADO
  return null
}
