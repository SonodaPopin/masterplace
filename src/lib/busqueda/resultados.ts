import { haversineKm, type Punto } from '../geo/haversine'

export type OrdenBusqueda = 'distancia' | 'reputacion'

// Contrato entre la búsqueda (Pedro, RF-3) y su presentación en mapa y lista (Gabriel).
// Un resultado es un maestro verificado con su punto de referencia y la distancia al punto de búsqueda.
export type ResultadoBusqueda = {
  id: string
  nombre: string | null
  oficio: string
  descripcion: string | null
  aniosExperiencia: number | null
  disponible: boolean
  certificado: boolean
  reputacion: boolean
  punto: Punto
  distanciaKm: number
  cantidadResenas: number
  promedioResenas: number | null
  puntajeLaplace: number | null
}

export type FiltrosBusqueda = {
  oficioId: number | null
  comunaId: number
  punto: Punto
  orden?: OrdenBusqueda
}

// PostgREST entrega una columna geography(point) como EWKB en hexadecimal, por ejemplo
// 0101000020E6100000<x 8 bytes><y 8 bytes>: orden de bytes, tipo (con bandera de SRID), SRID 4326, lng, lat.
const BANDERA_SRID = 0x20000000
const TIPO_PUNTO = 1

export function puntoDesdeEWKB(hex: string): Punto | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) return null
  const bytes = new Uint8Array(hex.match(/../g)!.map((b) => parseInt(b, 16)))
  if (bytes.length < 21) return null
  const vista = new DataView(bytes.buffer)
  const littleEndian = bytes[0] === 1
  const tipo = vista.getUint32(1, littleEndian)
  if ((tipo & 0xff) !== TIPO_PUNTO) return null
  const desplazamiento = tipo & BANDERA_SRID ? 9 : 5
  if (bytes.length < desplazamiento + 16) return null
  const lng = vista.getFloat64(desplazamiento, littleEndian)
  const lat = vista.getFloat64(desplazamiento + 8, littleEndian)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

// Fila de `maestros` con sus relaciones, tal como la devuelve la consulta de respaldo.
export type FilaMaestro = {
  id: string
  descripcion: string | null
  anios_experiencia: number | null
  referencia: string
  disponible: boolean
  certificado_ok: boolean
  nivel_reputacion: boolean
  perfiles: { nombre: string } | null
  oficios: { nombre: string } | null
}

// Convierte filas en resultados con su distancia (Haversine, CI-1) y los ordena del más cercano al más lejano.
export function aResultados(filas: FilaMaestro[], desde: Punto): ResultadoBusqueda[] {
  const resultados: ResultadoBusqueda[] = []
  for (const f of filas) {
    const punto = puntoDesdeEWKB(f.referencia)
    if (!punto) continue
    resultados.push({
      id: f.id,
      nombre: f.perfiles?.nombre ?? null,
      oficio: f.oficios?.nombre ?? 'Oficio',
      descripcion: f.descripcion,
      aniosExperiencia: f.anios_experiencia,
      disponible: f.disponible,
      certificado: f.certificado_ok,
      reputacion: f.nivel_reputacion,
      punto,
      distanciaKm: haversineKm(desde, punto),
      cantidadResenas: 0,
      promedioResenas: null,
      puntajeLaplace: null,
    })
  }
  return ordenarPorDistancia(resultados)
}

export function ordenarPorDistancia(resultados: ResultadoBusqueda[]): ResultadoBusqueda[] {
  return [...resultados].sort((a, b) => a.distanciaKm - b.distanciaKm || a.id.localeCompare(b.id))
}

export function ordenarPorReputacion(resultados: ResultadoBusqueda[]): ResultadoBusqueda[] {
  return [...resultados].sort((a, b) => {
    const aSinResenas = a.puntajeLaplace === null || a.cantidadResenas === 0
    const bSinResenas = b.puntajeLaplace === null || b.cantidadResenas === 0
    if (aSinResenas !== bSinResenas) return aSinResenas ? 1 : -1
    if (!aSinResenas && !bSinResenas && a.puntajeLaplace !== b.puntajeLaplace) {
      return b.puntajeLaplace! - a.puntajeLaplace!
    }
    return a.distanciaKm - b.distanciaKm || a.id.localeCompare(b.id)
  })
}

export function formatearDistancia(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`
  return `${Math.round(km)} km`
}

export function iniciales(nombre: string | null): string {
  if (!nombre) return 'M'
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || 'M'
}