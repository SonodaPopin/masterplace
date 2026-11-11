/**
 * CI-2 · Promedio bayesiano de estrellas (responsable: Hugo).
 *
 *   B = (n·r + m·C) / (n + m)
 *
 * n = reseñas válidas del maestro, r = su promedio bruto,
 * C = promedio global de la plataforma, m = 5 (peso del promedio global).
 * Si no hay reseñas en la plataforma no se inventa C: se devuelve null
 * y la interfaz muestra «sin reseñas». B ordena resultados; no reemplaza
 * la regla RB-3 del Nivel 2 (>= 5 reseñas y promedio bruto >= 4).
 */
export const M_POR_DEFECTO = 5

export function promedioBayesiano(
  n: number,
  r: number,
  C: number | null,
  m: number = M_POR_DEFECTO,
): number | null {
  if (C === null) {
    return null
  }

  if (!Number.isInteger(n) || n < 0) {
    throw new Error('La cantidad de reseñas debe ser un entero no negativo')
  }

  if (!Number.isFinite(m) || m <= 0) {
    throw new Error('El peso m debe ser positivo')
  }

  if (!Number.isFinite(C) || C < 1 || C > 5) {
    throw new Error('El promedio global debe estar entre 1 y 5')
  }

  if (n === 0) {
    return C
  }

  if (!Number.isFinite(r) || r < 1 || r > 5) {
    throw new Error('El promedio del maestro debe estar entre 1 y 5')
  }

  return (n * r + m * C) / (n + m)
}
