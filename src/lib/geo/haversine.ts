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

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180
}

export function haversineKm(a: Punto, b: Punto): number {
  // Validación de rangos geográficos válidos
  if (
    a.lat < -90 || a.lat > 90 || b.lat < -90 || b.lat > 90 ||
    a.lng < -180 || a.lng > 180 || b.lng < -180 || b.lng > 180
  ) {
    throw new Error('Coordenadas fuera de rango válido (lat: [-90, 90], lng: [-180, 180])')
  }

  const dLat = aRadianes(b.lat - a.lat)
  const dLng = aRadianes(b.lng - a.lng)

  const lat1 = aRadianes(a.lat)
  const lat2 = aRadianes(b.lat)

  const sinDLat2 = Math.sin(dLat / 2)
  const sinDLng2 = Math.sin(dLng / 2)

  const valA =
    sinDLat2 * sinDLat2 +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng2 * sinDLng2

  const valC = 2 * Math.atan2(Math.sqrt(valA), Math.sqrt(1 - valA))

  return RADIO_TIERRA_KM * valC
}