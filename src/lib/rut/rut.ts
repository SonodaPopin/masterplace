/**
 * Elimina los separadores del RUT y convierte el DV a mayúscula.
 * Ejemplo: "12.345.678-5" → "123456785".
 */
export function limpiarRut(texto: string): string {
  void texto
  throw new Error('No implementado')
}

/**
 * Calcula el dígito verificador mediante módulo 11.
 * Devuelve un carácter entre "0" y "9", o "K".
 */
export function calcularDigitoVerificador(cuerpo: string): string {
  void cuerpo
  throw new Error('No implementado')
}

/**
 * Valida el formato y el dígito verificador del RUT.
 * Devuelve undefined si es válido o un mensaje de error.
 */
export function validarRut(texto: string): string | undefined {
  void texto
  throw new Error('No implementado')
}

/**
 * Convierte el RUT al formato canónico de almacenamiento.
 * Ejemplo: "12.345.678-5" → "12345678-5".
 */
export function normalizarRut(texto: string): string {
  void texto
  throw new Error('No implementado')
}

/**
 * Convierte el RUT al formato de visualización.
 * Ejemplo: "123456785" → "12.345.678-5".
 */
export function formatearRut(texto: string): string {
  void texto
  throw new Error('No implementado')
}
