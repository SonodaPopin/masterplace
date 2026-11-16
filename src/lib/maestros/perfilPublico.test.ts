import { describe, expect, it } from 'vitest'
import { nombreDeRelacion } from './perfilPublico'

describe('nombreDeRelacion (D-01)', () => {
  it('lee la relación como objeto, que es lo que devuelve Supabase', () => {
    expect(nombreDeRelacion({ nombre: 'Juan González Silva' })).toBe('Juan González Silva')
  })

  it('también acepta la relación como lista', () => {
    expect(nombreDeRelacion([{ nombre: 'Carpintería' }])).toBe('Carpintería')
  })

  it('devuelve null si falta la relación o el nombre está vacío', () => {
    expect(nombreDeRelacion(null)).toBeNull()
    expect(nombreDeRelacion(undefined)).toBeNull()
    expect(nombreDeRelacion([])).toBeNull()
    expect(nombreDeRelacion({ nombre: '  ' })).toBeNull()
  })
})
