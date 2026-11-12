import { describe, expect, it } from 'vitest'
import { promedioBayesiano } from './promedioBayesiano'

describe('promedioBayesiano (CI-2)', () => {
  const C = 4
  const m = 5

  it('con n = 0 devuelve C', () => {
    expect(promedioBayesiano(0, 0, C, m)).toBe(C)
  })

  it('con n = 1 y r = 5 queda entre r y C', () => {
    const resultado = promedioBayesiano(1, 5, C, m)

    expect(resultado).not.toBeNull()
    expect(resultado!).toBeGreaterThan(C)
    expect(resultado!).toBeLessThan(5)
    expect(resultado).toBeCloseTo(25 / 6)
  })

  it('con n = 5 los pesos son iguales', () => {
    const resultado = promedioBayesiano(5, 5, C, m)

    expect(resultado).toBeCloseTo(4.5)
  })

  it('con n = 50 converge hacia r', () => {
    const resultado = promedioBayesiano(50, 5, C, m)

    expect(resultado).toBeCloseTo(270 / 55)
    expect(resultado!).toBeGreaterThan(4.9)
  })

  it('sin promedio global (C = null) devuelve null', () => {
    expect(promedioBayesiano(5, 5, null, m)).toBeNull()
  })
})
