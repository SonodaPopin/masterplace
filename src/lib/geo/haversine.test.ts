import { describe, it, expect } from 'vitest'
import { haversineKm, type Punto } from './haversine'

describe('haversineKm (CI-1)', () => {
  const plazaConcepcion: Punto = { lat: -36.8269, lng: -73.0498 }
  const plazaTalcahuano: Punto = { lat: -36.7248, lng: -73.1167 }

  it('devuelve 0 para el mismo punto', () => {
    const distancia = haversineKm(plazaConcepcion, plazaConcepcion)
    expect(distancia).toBe(0)
  })

  it('es simétrica: d(a, b) = d(b, a)', () => {
    const dAB = haversineKm(plazaConcepcion, plazaTalcahuano)
    const dBA = haversineKm(plazaTalcahuano, plazaConcepcion)
    
    expect(dAB).toBeCloseTo(dBA, 5)
    expect(dAB).toBeGreaterThan(0)
  })

  // Par 1 de la tabla de CI-1 (docs/ciencias/CI-1_distancia.md): puntos de referencia de Concepción y Talcahuano
  // en `comunas.centroide` (seed.sql). Los valores salen de docs/ciencias/ci1_distancias.sql en Supabase:
  // Haversine 13,903 km y ST_Distance sobre geography (WGS84) 13,888 km.
  const centroConcepcion: Punto = { lat: -36.8281944, lng: -73.0513694 }
  const centroTalcahuano: Punto = { lat: -36.71667, lng: -73.12194 }

  it('coincide con el Haversine calculado en la base de datos para el par 1 de CI-1', () => {
    expect(haversineKm(centroConcepcion, centroTalcahuano)).toBeCloseTo(13.903, 3)
  })

  it('Concepción–Talcahuano coincide con PostGIS (ST_Distance, WGS84) con error <= 1 %', () => {
    const distanciaCalculada = haversineKm(centroConcepcion, centroTalcahuano)
    const referenciaPostGISKm = 13.888

    const errorRelativo = Math.abs(distanciaCalculada - referenciaPostGISKm) / referenciaPostGISKm
    expect(errorRelativo).toBeLessThanOrEqual(0.01)
    // Resultado de CI-1: error del 0,111 % en este par.
    expect(errorRelativo).toBeLessThan(0.002)
  })

  it('rechaza latitudes fuera de [-90, 90] y longitudes fuera de [-180, 180]', () => {
    expect(() => haversineKm({ lat: 91, lng: 0 }, plazaConcepcion)).toThrow()
    expect(() => haversineKm({ lat: -91, lng: 0 }, plazaConcepcion)).toThrow()
    expect(() => haversineKm({ lat: 0, lng: 181 }, plazaConcepcion)).toThrow()
    expect(() => haversineKm({ lat: 0, lng: -181 }, plazaConcepcion)).toThrow()
  })
})