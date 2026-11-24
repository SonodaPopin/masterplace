import { describe, expect, it } from 'vitest'
import {
  limpiarRut,
  calcularDigitoVerificador,
  validarRut,
  normalizarRut,
  formatearRut,
} from './rut'

describe('limpiarRut', () => {
  it('elimina puntos y guion', () => {
    expect(limpiarRut('12.345.678-5')).toBe('123456785')
  })

  it('elimina espacios y convierte la k a mayúscula', () => {
    expect(limpiarRut(' 12.345.670-k ')).toBe('12345670K')
  })

  it('conserva una cadena vacía', () => {
    expect(limpiarRut('')).toBe('')
  })
})

describe('calcularDigitoVerificador', () => {
  it('calcula un dígito verificador numérico', () => {
    expect(calcularDigitoVerificador('12345678')).toBe('5')
  })

  it('calcula un dígito verificador K', () => {
    expect(calcularDigitoVerificador('12345670')).toBe('K')
  })

  it('calcula un dígito verificador igual a cero', () => {
    expect(calcularDigitoVerificador('12345675')).toBe('0')
  })

  it('acepta cuerpos de siete dígitos', () => {
    expect(calcularDigitoVerificador('1234567')).toBe('4')
  })
})

describe('validarRut', () => {
  it.each([
    '12.345.678-5',
    '12.345.6785',
    '12345678-5',
    '123456785',
    '12.345.670-K',
    '12.345.670-k',
    '12345670k',
    ' 12.345.678-5 ',
    '12 345 678-5',
    '1.234.567-4',
    '1234567-4',
    '12345675-0',
  ])('acepta el RUT válido %s', (rut) => {
    expect(validarRut(rut)).toBeUndefined()
  })

  it.each(['', ' ', '   '])(
    'rechaza una entrada vacía: "%s"',
    (rut) => {
      expect(validarRut(rut)).toBe('Escribe tu RUT.')
    },
  )

  it.each([
    '12.345.678-9',
    '12345670-5',
    'abcdefg-5',
    '1234567A-5',
    '12345678-X',
    '123-4',
    '123456789-5',
    '01234567-4',
    '12..345.678-5',
    '12345678--5',
    '12.34.5678-5',
    '12345678',
    '---',
  ])('rechaza el RUT inválido %s', (rut) => {
    expect(validarRut(rut)).toBe(
      'El RUT no es válido: revisa el número y el dígito verificador.',
    )
  })
})

describe('normalizarRut', () => {
  it.each([
    ['12.345.678-5', '12345678-5'],
    ['123456785', '12345678-5'],
    ['12345678-5', '12345678-5'],
    ['12.345.670-k', '12345670-K'],
    [' 12.345.678-5 ', '12345678-5'],
    ['1.234.567-4', '1234567-4'],
    ['', ''],
    ['1', '1'],
  ])('normaliza %s como %s', (entrada, esperado) => {
    expect(normalizarRut(entrada)).toBe(esperado)
  })
})

describe('formatearRut', () => {
  it.each([
    ['123456785', '12.345.678-5'],
    ['12345678-5', '12.345.678-5'],
    ['12.345.678-5', '12.345.678-5'],
    ['12345670k', '12.345.670-K'],
    ['1234567-4', '1.234.567-4'],
    ['', ''],
    ['1', '1'],
  ])('formatea %s como %s', (entrada, esperado) => {
    expect(formatearRut(entrada)).toBe(esperado)
  })
})
