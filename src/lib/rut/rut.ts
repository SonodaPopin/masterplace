
const ERROR_RUT_VACIO = 'Escribe tu RUT.'
const ERROR_RUT_INVALIDO =
  'El RUT no es válido: revisa el número y el dígito verificador.'

/**
 * Elimina puntos, guiones y espacios, y convierte a mayúsculas.
 * Ejemplo: "12.345.678-5" → "123456785".
 */
export function limpiarRut(texto: string): string {
  return texto.replace(/[.\s-]/g, '').toUpperCase()
}

/**
 * Calcula el dígito verificador mediante módulo 11.
 * Devuelve un carácter entre "0" y "9", o "K".
 */
export function calcularDigitoVerificador(cuerpo: string): string {
  let suma = 0
  let factor = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }

  const resultado = 11 - (suma % 11)

  if (resultado === 11) return '0'
  if (resultado === 10) return 'K'

  return String(resultado)
}

/**
 * Valida el formato y el dígito verificador del RUT.
 * Devuelve undefined si es válido o un mensaje de error.
 */
export function validarRut(texto: string): string | undefined {
  if (!texto.trim()) {
    return ERROR_RUT_VACIO
  }

  const entrada = texto.replace(/\s/g, '').toUpperCase()

  const formatoSimple = /^[1-9]\d{6,7}-?[\dK]$/
  const formatoConPuntos = /^[1-9]\d?\.\d{3}\.\d{3}-?[\dK]$/

  if (!formatoSimple.test(entrada) && !formatoConPuntos.test(entrada)) {
    return ERROR_RUT_INVALIDO
  }

  const rut = limpiarRut(entrada)
  const cuerpo = rut.slice(0, -1)
  const dv = rut.slice(-1)

  if (calcularDigitoVerificador(cuerpo) !== dv) {
    return ERROR_RUT_INVALIDO
  }

  return undefined
}

/**
 * Convierte el RUT al formato canónico de almacenamiento.
 * Ejemplo: "12.345.678-5" → "12345678-5".
 */
export function normalizarRut(texto: string): string {
  const rut = limpiarRut(texto)

  if (rut.length <= 1) return rut

  return `${rut.slice(0, -1)}-${rut.slice(-1)}`
}

/**
 * Convierte el RUT al formato de visualización.
 * Ejemplo: "123456785" → "12.345.678-5".
 */
export function formatearRut(texto: string): string {
  const rut = limpiarRut(texto)

  if (rut.length <= 1) return rut

  const cuerpo = rut.slice(0, -1)
  const dv = rut.slice(-1)
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${cuerpoFormateado}-${dv}`
}
