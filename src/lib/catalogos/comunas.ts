// Las 6 comunas del piloto (E1, escenario Gran Concepción) con su código único territorial (CUT).
// Se usan como lista fija en los formularios mientras la tabla `comunas` no tenga política de lectura.
// Deben coincidir con la semilla de Ignacio (supabase/seed.sql).
export const COMUNAS_PILOTO = [
  { id: 8101, nombre: 'Concepción' },
  { id: 8103, nombre: 'Chiguayante' },
  { id: 8107, nombre: 'Penco' },
  { id: 8108, nombre: 'San Pedro de la Paz' },
  { id: 8110, nombre: 'Talcahuano' },
  { id: 8112, nombre: 'Hualpén' },
] as const

export type ComunaId = (typeof COMUNAS_PILOTO)[number]['id']

export function esComunaPiloto(id: number): id is ComunaId {
  return COMUNAS_PILOTO.some((c) => c.id === id)
}
