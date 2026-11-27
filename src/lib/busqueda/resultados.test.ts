import { describe, expect, it } from 'vitest'
import {
  aResultados,
  formatearDistancia,
  iniciales,
  ordenarPorReputacion,
  puntoDesdeEWKB,
  type FilaMaestro,
  type ResultadoBusqueda,
} from './resultados'

// Valores reales devueltos por Supabase para dos maestros de la semilla.
const EWKB_CONCEPCION = '0101000020E610000033C34659BF4352C00CCD751A696942C0' // (-73.058554, -36.823520)
const EWKB_CHIGUAYANTE = '0101000020E6100000821C9430D34052C044F98216127642C0' // (-73.012890, -36.922427)

describe('puntoDesdeEWKB', () => {
  it('lee longitud y latitud de un punto con SRID', () => {
    const p = puntoDesdeEWKB(EWKB_CONCEPCION)!
    expect(p.lng).toBeCloseTo(-73.058554, 6)
    expect(p.lat).toBeCloseTo(-36.82352, 6)
  })

  it('lee un punto sin SRID', () => {
    const p = puntoDesdeEWKB('0101000000' + EWKB_CONCEPCION.slice(18))!
    expect(p.lat).toBeCloseTo(-36.82352, 6)
  })

  it('rechaza texto que no es un punto', () => {
    expect(puntoDesdeEWKB('hola')).toBeNull()
    expect(puntoDesdeEWKB('0102000020E6100000')).toBeNull()
    expect(puntoDesdeEWKB('')).toBeNull()
  })
})

const fila = (id: string, referencia: string, nombre: string | null = 'Juan Pérez'): FilaMaestro => ({
  id,
  descripcion: null,
  anios_experiencia: 5,
  referencia,
  disponible: true,
  certificado_ok: false,
  nivel_reputacion: false,
  perfiles: nombre ? { nombre } : null,
  oficios: { nombre: 'Gasfitería sanitaria' },
})

const resultadoBase = (overrides: Partial<ResultadoBusqueda> & { id: string }): ResultadoBusqueda => ({
  nombre: 'Maestro',
  oficio: 'Gasfitería sanitaria',
  descripcion: null,
  aniosExperiencia: 4,
  disponible: true,
  certificado: false,
  reputacion: false,
  punto: { lat: -36.8281944, lng: -73.0513694 },
  distanciaKm: 1.0,
  cantidadResenas: 0,
  promedioResenas: null,
  puntajeLaplace: null,
  ...overrides,
})

describe('aResultados', () => {
  const desdeConcepcion = { lat: -36.8281944, lng: -73.0513694 }

  it('calcula la distancia y ordena del más cercano al más lejano', () => {
    const r = aResultados([fila('b', EWKB_CHIGUAYANTE), fila('a', EWKB_CONCEPCION)], desdeConcepcion)
    expect(r.map((x) => x.id)).toEqual(['a', 'b'])
    expect(r[0].distanciaKm).toBeLessThan(1.5)
    expect(r[1].distanciaKm).toBeGreaterThan(10)
  })

  it('inicializa campos de reseñas por defecto en resultados de respaldo', () => {
    const r = aResultados([fila('a', EWKB_CONCEPCION)], desdeConcepcion)
    expect(r[0].cantidadResenas).toBe(0)
    expect(r[0].promedioResenas).toBeNull()
    expect(r[0].puntajeLaplace).toBeNull()
  })

  it('descarta filas con un punto ilegible y tolera el nombre oculto', () => {
    const r = aResultados([fila('a', 'zz'), fila('b', EWKB_CONCEPCION, null)], desdeConcepcion)
    expect(r).toHaveLength(1)
    expect(r[0].nombre).toBeNull()
  })
})

describe('ordenarPorReputacion', () => {
  it('ordena por puntaje descendente y deja sin reseñas al final', () => {
    const items = [
      resultadoBase({ id: 'sin-1', distanciaKm: 0.5, cantidadResenas: 0, puntajeLaplace: null }),
      resultadoBase({ id: 'bajo', distanciaKm: 0.2, cantidadResenas: 2, promedioResenas: 3.5, puntajeLaplace: 3.14 }),
      resultadoBase({ id: 'alto', distanciaKm: 5.0, cantidadResenas: 10, promedioResenas: 4.9, puntajeLaplace: 4.27 }),
      resultadoBase({ id: 'sin-2', distanciaKm: 2.0, cantidadResenas: 0, promedioResenas: null, puntajeLaplace: null }),
    ]

    const ordenado = ordenarPorReputacion(items)
    expect(ordenado.map((x) => x.id)).toEqual(['alto', 'bajo', 'sin-1', 'sin-2'])
  })

  it('desempata por distancia cuando tienen el mismo puntaje', () => {
    const items = [
      resultadoBase({ id: 'lejos', distanciaKm: 4.2, cantidadResenas: 5, promedioResenas: 4.6, puntajeLaplace: 3.8 }),
      resultadoBase({ id: 'cerca', distanciaKm: 1.1, cantidadResenas: 5, promedioResenas: 4.6, puntajeLaplace: 3.8 }),
    ]

    const ordenado = ordenarPorReputacion(items)
    expect(ordenado.map((x) => x.id)).toEqual(['cerca', 'lejos'])
  })
})

describe('formato', () => {
  it('muestra metros bajo 1 km y km con coma decimal', () => {
    expect(formatearDistancia(0.012)).toBe('50 m')
    expect(formatearDistancia(0.43)).toBe('450 m')
    expect(formatearDistancia(2.345)).toBe('2,3 km')
    expect(formatearDistancia(12.6)).toBe('13 km')
  })

  it('arma iniciales', () => {
    expect(iniciales('Juan González Silva')).toBe('JG')
    expect(iniciales('Ana')).toBe('A')
    expect(iniciales(null)).toBe('M')
  })
})