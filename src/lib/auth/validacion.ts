import { esComunaPiloto } from '../catalogos/comunas'

// Validación de los formularios de cuenta (RF-10). Funciones puras para poder probarlas sin Supabase.

export type DatosRegistroCliente = {
  nombre: string
  correo: string
  telefono: string
  comunaId: string
  contrasena: string
  confirmacion: string
}

export type ErroresFormulario<T> = Partial<Record<keyof T, string>>

export const LARGO_MINIMO_CONTRASENA = 8

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Teléfono chileno opcional: +56 9 1234 5678, 912345678, etc. Se ignoran espacios y guiones.
const PATRON_TELEFONO = /^(\+?56)?9\d{8}$/

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase()
}

export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/[\s-]/g, '')
}

export function validarCorreo(correo: string): string | undefined {
  const c = normalizarCorreo(correo)
  if (!c) return 'Escribe tu correo.'
  if (!PATRON_CORREO.test(c)) return 'El correo no tiene un formato válido (ejemplo: nombre@correo.cl).'
  return undefined
}

export function validarContrasena(contrasena: string): string | undefined {
  if (contrasena.length < LARGO_MINIMO_CONTRASENA)
    return `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`
  if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena))
    return 'La contraseña debe combinar letras y números.'
  return undefined
}

export function validarRegistroCliente(d: DatosRegistroCliente): ErroresFormulario<DatosRegistroCliente> {
  const errores: ErroresFormulario<DatosRegistroCliente> = {}

  const nombre = d.nombre.trim()
  // Mismo rango que el check de la tabla perfiles (2 a 80 caracteres).
  if (nombre.length < 2) errores.nombre = 'Escribe tu nombre (al menos 2 caracteres).'
  else if (nombre.length > 80) errores.nombre = 'El nombre no puede superar 80 caracteres.'

  const errorCorreo = validarCorreo(d.correo)
  if (errorCorreo) errores.correo = errorCorreo

  const telefono = normalizarTelefono(d.telefono)
  if (telefono && !PATRON_TELEFONO.test(telefono))
    errores.telefono = 'Usa un celular chileno de 9 dígitos, por ejemplo 9 1234 5678.'

  if (!d.comunaId) errores.comunaId = 'Elige tu comuna.'
  else if (!esComunaPiloto(Number(d.comunaId))) errores.comunaId = 'Esa comuna no está en el piloto.'

  const errorContrasena = validarContrasena(d.contrasena)
  if (errorContrasena) errores.contrasena = errorContrasena
  else if (d.confirmacion !== d.contrasena) errores.confirmacion = 'Las contraseñas no coinciden.'

  return errores
}

// Traduce los mensajes de Supabase Auth más comunes a un texto entendible para el usuario.
export function mensajeErrorAuth(mensaje: string): string {
  const m = mensaje.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Ya existe una cuenta con ese correo. Prueba ingresar.'
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.'
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.'
}
