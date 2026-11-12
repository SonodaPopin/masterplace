import { describe, expect, it } from 'vitest'
import { aResultados, formatearDistancia, iniciales, puntoDesdeEWKB, type FilaMaestro } from './resultados'

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

describe('aResultados', () => {
  const desdeConcepcion = { lat: -36.8281944, lng: -73.0513694 }

  it('calcula la distancia y ordena del más cercano al más lejano', () => {
    const r = aResultados([fila('b', EWKB_CHIGUAYANTE), fila('a', EWKB_CONCEPCION)], desdeConcepcion)
    expect(r.map((x) => x.id)).toEqual(['a', 'b'])
    expect(r[0].distanciaKm).toBeLessThan(1.5)
    expect(r[1].distanciaKm).toBeGreaterThan(10)
  })

  it('descarta filas con un punto ilegible y tolera el nombre oculto', () => {
    const r = aResultados([fila('a', 'zz'), fila('b', EWKB_CONCEPCION, null)], desdeConcepcion)
    expect(r).toHaveLength(1)
    expect(r[0].nombre).toBeNull()
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
