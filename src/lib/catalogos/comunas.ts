// Las 6 comunas del piloto (E1, escenario Gran Concepción) con su código único territorial (CUT).
// Se usan como lista fija en los formularios. Deben coincidir con la semilla de Ignacio
// (supabase/seed.sql), incluido el punto de referencia (lat, lng) de cada comuna, que se usa como
// punto por defecto del maestro mientras no elija uno en el mapa.
export const COMUNAS_PILOTO = [
  { id: 8101, nombre: 'Concepción', lat: -36.8281944, lng: -73.0513694 },
  { id: 8103, nombre: 'Chiguayante', lat: -36.917, lng: -73.017 },
  { id: 8107, nombre: 'Penco', lat: -36.73861, lng: -72.99389 },
  { id: 8108, nombre: 'San Pedro de la Paz', lat: -36.84194, lng: -73.10306 },
  { id: 8110, nombre: 'Talcahuano', lat: -36.71667, lng: -73.12194 },
  { id: 8112, nombre: 'Hualpén', lat: -36.78833, lng: -73.08667 },
] as const

export type ComunaPiloto = (typeof COMUNAS_PILOTO)[number]
export type ComunaId = ComunaPiloto['id']

export function esComunaPiloto(id: number): id is ComunaId {
  return COMUNAS_PILOTO.some((c) => c.id === id)
}

export function buscarComuna(id: number): ComunaPiloto | undefined {
  return COMUNAS_PILOTO.find((c) => c.id === id)
}
