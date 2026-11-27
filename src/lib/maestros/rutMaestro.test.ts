import { describe, expect, it } from 'vitest'
import { ERROR_RUT_DUPLICADO, errorRutDesdeBase, prepararRut, rutAlSalir } from './rutMaestro'

describe('prepararRut', () => {
  it('acepta las formas habituales y guarda el formato que exige la base', () => {
    for (const escrito of ['12.345.678-5', '12345678-5', '123456785', ' 12.345.678-5 ']) {
      expect(prepararRut(escrito)).toEqual({ ok: true, guardar: '12345678-5', mostrar: '12.345.678-5' })
    }
  })

  it('pasa la K a mayúscula, como exige el CHECK de la base', () => {
    expect(prepararRut('10.000.013-k')).toEqual({ ok: true, guardar: '10000013-K', mostrar: '10.000.013-K' })
  })

  it('rechaza el vacío y el dígito verificador incorrecto', () => {
    expect(prepararRut('')).toEqual({ ok: false, error: 'Escribe tu RUT.' })
    expect(prepararRut('12.345.678-9')).toMatchObject({ ok: false, error: expect.stringMatching(/dígito verificador/) })
  })
})

describe('rutAlSalir', () => {
  it('formatea un RUT válido y deja el inválido como estaba, con su error', () => {
    expect(rutAlSalir('123456785')).toEqual({ valor: '12.345.678-5' })
    expect(rutAlSalir('12345678-9')).toEqual({ valor: '12345678-9', error: expect.stringMatching(/no es válido/) })
  })

  it('no marca error si todavía no escribió nada', () => {
    expect(rutAlSalir('  ')).toEqual({ valor: '  ' })
  })
})

describe('errorRutDesdeBase', () => {
  it('traduce el RUT duplicado (23505) y el CHECK (23514)', () => {
    expect(errorRutDesdeBase({ code: '23505', message: 'duplicate key value' })).toBe(ERROR_RUT_DUPLICADO)
    expect(errorRutDesdeBase({ code: '23514', message: 'violates check constraint' })).toMatch(/no es válido/)
  })

  it('devuelve null para errores que no son del RUT', () => {
    expect(errorRutDesdeBase({ code: '42501', message: 'permission denied' })).toBeNull()
  })
})
