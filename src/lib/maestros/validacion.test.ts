import { describe, expect, it } from 'vitest'
import {
  extensionCedula,
  formatearTamano,
  mensajeErrorDatos,
  puntoEWKT,
  redondearCoordenada,
  rutaCedula,
  TAMANO_MAXIMO_CEDULA,
  validarArchivoCedula,
  validarPerfilMaestro,
  type DatosPerfilMaestro,
} from './validacion'

const VALIDO: DatosPerfilMaestro = {
  oficioId: '1',
  aniosExperiencia: '12',
  descripcion: 'Reparación de cañerías y calefont.',
  coberturas: [8101, 8103],
}

describe('validarPerfilMaestro', () => {
  it('acepta un perfil completo', () => {
    expect(validarPerfilMaestro(VALIDO)).toEqual({})
  })

  it('años y descripción son opcionales', () => {
    expect(validarPerfilMaestro({ ...VALIDO, aniosExperiencia: '', descripcion: '' })).toEqual({})
  })

  it('exige oficio y al menos una comuna', () => {
    const e = validarPerfilMaestro({ ...VALIDO, oficioId: '', coberturas: [] })
    expect(e.oficioId).toBeDefined()
    expect(e.coberturas).toBeDefined()
  })

  it('rechaza años fuera de 0–70 o con decimales', () => {
    for (const anios of ['-1', '71', '2.5', 'diez']) {
      expect(validarPerfilMaestro({ ...VALIDO, aniosExperiencia: anios }).aniosExperiencia).toBeDefined()
    }
    expect(validarPerfilMaestro({ ...VALIDO, aniosExperiencia: '0' })).toEqual({})
  })

  it('rechaza una descripción de más de 600 caracteres', () => {
    expect(validarPerfilMaestro({ ...VALIDO, descripcion: 'a'.repeat(601) }).descripcion).toBeDefined()
  })

  it('rechaza comunas fuera del piloto', () => {
    expect(validarPerfilMaestro({ ...VALIDO, coberturas: [8101, 13101] }).coberturas).toBeDefined()
  })
})

describe('validarArchivoCedula', () => {
  it('acepta JPG, PNG y PDF de hasta 5 MB', () => {
    expect(validarArchivoCedula({ type: 'image/jpeg', size: 1000 })).toBeUndefined()
    expect(validarArchivoCedula({ type: 'image/png', size: TAMANO_MAXIMO_CEDULA })).toBeUndefined()
    expect(validarArchivoCedula({ type: 'application/pdf', size: 1000 })).toBeUndefined()
  })

  it('rechaza archivo faltante, otro tipo o más de 5 MB', () => {
    expect(validarArchivoCedula(null)).toBeDefined()
    expect(validarArchivoCedula({ type: 'image/heic', size: 1000 })).toBeDefined()
    expect(validarArchivoCedula({ type: 'image/jpeg', size: TAMANO_MAXIMO_CEDULA + 1 })).toBeDefined()
  })
})

describe('ruta y formato de la cédula', () => {
  it('pone el id del maestro como primera carpeta', () => {
    expect(rutaCedula('abc', 'image/png', 123)).toBe('abc/cedula-123.png')
    expect(extensionCedula('image/jpeg')).toBe('jpg')
    expect(extensionCedula('application/pdf')).toBe('pdf')
  })

  it('muestra el tamaño en KB o MB', () => {
    expect(formatearTamano(2048)).toBe('2 KB')
    expect(formatearTamano(1.5 * 1024 * 1024)).toBe('1,5 MB')
  })
})

describe('punto de referencia', () => {
  it('redondea a 3 decimales y arma EWKT con longitud primero', () => {
    expect(redondearCoordenada(-36.82819)).toBe(-36.828)
    expect(puntoEWKT(-36.828, -73.051)).toBe('SRID=4326;POINT(-73.051 -36.828)')
  })
})

describe('mensajeErrorDatos', () => {
  it('traduce errores comunes', () => {
    expect(mensajeErrorDatos('new row violates row-level security policy')).toMatch(/permiso/)
    expect(mensajeErrorDatos('Failed to fetch')).toMatch(/conectarnos/)
    expect(mensajeErrorDatos('algo raro')).toMatch(/No pudimos guardar/)
  })
})
