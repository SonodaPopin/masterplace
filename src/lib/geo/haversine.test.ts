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

  it('Plaza de Armas de Concepción a Plaza de Talcahuano coincide con PostGIS con error <= 1 %', () => {
    const distanciaCalculada = haversineKm(plazaConcepcion, plazaTalcahuano)
    
    // Valor real de referencia acorde al cálculo de gran círculo entre ambas plazas (~12.82 km)
    const referenciaPostGISKm = 12.82 
    
    const errorRelativo = Math.abs(distanciaCalculada - referenciaPostGISKm) / referenciaPostGISKm
    expect(errorRelativo).toBeLessThanOrEqual(0.01)
  })

  it('rechaza latitudes fuera de [-90, 90] y longitudes fuera de [-180, 180]', () => {
    expect(() => haversineKm({ lat: 91, lng: 0 }, plazaConcepcion)).toThrow()
    expect(() => haversineKm({ lat: -91, lng: 0 }, plazaConcepcion)).toThrow()
    expect(() => haversineKm({ lat: 0, lng: 181 }, plazaConcepcion)).toThrow()
    expect(() => haversineKm({ lat: 0, lng: -181 }, plazaConcepcion)).toThrow()
  })
})