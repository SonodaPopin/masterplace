import { describe, expect, it } from 'vitest'
import {
  DIAS_PLAZO_RESENA,
  HORAS_ESPERA_REALIZADA,
  dentroDelPlazoDeResena,
  puedeMarcarseRealizada,
} from './reglas.ts'

const HORA = 60 * 60 * 1000
const DIA = 24 * HORA

describe('puedeMarcarseRealizada (2 horas)', () => {
  const fecha = new Date('2026-11-20T15:00:00.000Z')
  const limite = fecha.getTime() + HORAS_ESPERA_REALIZADA * HORA

  it('no puede 1 ms antes del límite', () => {
    expect(puedeMarcarseRealizada(fecha, new Date(limite - 1))).toBe(false)
  })

  it('puede justo en el límite', () => {
    expect(puedeMarcarseRealizada(fecha, new Date(limite))).toBe(true)
  })

  it('puede 1 ms después del límite', () => {
    expect(puedeMarcarseRealizada(fecha, new Date(limite + 1))).toBe(true)
  })

  it('no puede antes de la fecha acordada', () => {
    expect(puedeMarcarseRealizada(fecha, new Date(fecha.getTime() - HORA))).toBe(false)
  })

  it('acepta fechas como texto ISO', () => {
    expect(
      puedeMarcarseRealizada('2026-11-20T15:00:00.000Z', '2026-11-20T17:00:00.000Z'),
    ).toBe(true)
  })
})

describe('dentroDelPlazoDeResena (30 días)', () => {
  const realizada = new Date('2026-11-01T12:00:00.000Z')
  const limite = realizada.getTime() + DIAS_PLAZO_RESENA * DIA

  it('puede 1 ms antes del límite', () => {
    expect(dentroDelPlazoDeResena(realizada, new Date(limite - 1))).toBe(true)
  })

  it('puede justo en el límite', () => {
    expect(dentroDelPlazoDeResena(realizada, new Date(limite))).toBe(true)
  })

  it('no puede 1 ms después del límite', () => {
    expect(dentroDelPlazoDeResena(realizada, new Date(limite + 1))).toBe(false)
  })

  it('no puede si no hay fecha de realizada', () => {
    expect(dentroDelPlazoDeResena(null)).toBe(false)
    expect(dentroDelPlazoDeResena(undefined)).toBe(false)
  })
})