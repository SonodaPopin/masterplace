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
  void n
  void r
  void C
  void m
  throw new Error('Por implementar (CI-2, Hugo): ver docs/ciencias/CI-2_promedio_bayesiano.md')
}
