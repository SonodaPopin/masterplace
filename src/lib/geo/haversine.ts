 /**
 * CI-1 · Distancia geográfica (responsable: Pedro).
 *
 * Distancia de gran círculo entre dos puntos con la fórmula de Haversine,
 * sobre una esfera de radio R = 6.371 km. Se usa para contrastar la distancia
 * que entrega PostGIS (geography, elipsoide WGS84) con tolerancia de 1 %.
 *
 *   a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)
 *   d = 2R · atan2(√a, √(1−a))
 *
 * φ = latitud y λ = longitud, ambas en radianes.
 */

export const RADIO_TIERRA_KM = 6371

export type Punto = { lat: number; lng: number }

export function haversineKm(a: Punto, b: Punto): number {
  void a
  void b
  
  throw new Error('Por implementar (CI-1, Pedro): ver docs/ciencias/CI-1_distancia.md')
} 
