import { describe, it } from 'vitest'

// Casos definidos en E1 §2.7 (Tabla 12). Pedro reemplaza cada it.todo por la prueba real.
describe('haversineKm (CI-1)', () => {
  it.todo('devuelve 0 para el mismo punto')
  it.todo('es simétrica: d(a, b) = d(b, a)')
  it.todo('Plaza de Armas de Concepción a Plaza de Talcahuano coincide con PostGIS con error <= 1 %')
  it.todo('rechaza latitudes fuera de [-90, 90] y longitudes fuera de [-180, 180]')
})
