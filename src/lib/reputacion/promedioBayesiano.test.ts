import { describe, it } from 'vitest'

// Casos definidos en E1 §2.7 (Tabla 12). Hugo reemplaza cada it.todo por la prueba real.
describe('promedioBayesiano (CI-2)', () => {
  it.todo('con n = 0 devuelve C')
  it.todo('con n = 1 y r = 5 queda entre r y C (no sobrevalora una sola reseña)')
  it.todo('con n = 5 el peso del maestro y el del promedio global son iguales')
  it.todo('con n = 50 converge hacia r')
  it.todo('sin promedio global (C = null) devuelve null')
})
