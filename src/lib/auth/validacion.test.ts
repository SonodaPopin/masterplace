import { describe, expect, it } from 'vitest'
import {
  mensajeErrorAuth,
  normalizarCorreo,
  validarContrasena,
  validarCorreo,
  validarRegistroCliente,
  type DatosRegistroCliente,
} from './validacion'

const validos: DatosRegistroCliente = {
  nombre: 'Cliente Prueba',
  correo: 'p1@prueba.masterplace.cl',
  telefono: '',
  comunaId: '8101',
  contrasena: 'clave1234',
  confirmacion: 'clave1234',
}

describe('validarRegistroCliente (RF-10)', () => {
  it('acepta datos válidos sin teléfono', () => {
    expect(validarRegistroCliente(validos)).toEqual({})
  })

  it('acepta teléfono chileno con espacios o +56', () => {
    expect(validarRegistroCliente({ ...validos, telefono: '+56 9 1234 5678' })).toEqual({})
    expect(validarRegistroCliente({ ...validos, telefono: '9-1234-5678' })).toEqual({})
  })

  it('rechaza teléfono que no es celular chileno', () => {
    expect(validarRegistroCliente({ ...validos, telefono: '12345' }).telefono).toBeDefined()
  })

  it('exige nombre de 2 a 80 caracteres, igual que la tabla perfiles', () => {
    expect(validarRegistroCliente({ ...validos, nombre: ' A ' }).nombre).toBeDefined()
    expect(validarRegistroCliente({ ...validos, nombre: 'A'.repeat(81) }).nombre).toBeDefined()
    expect(validarRegistroCliente({ ...validos, nombre: 'Al' }).nombre).toBeUndefined()
  })

  it('exige una comuna del piloto', () => {
    expect(validarRegistroCliente({ ...validos, comunaId: '' }).comunaId).toBeDefined()
    expect(validarRegistroCliente({ ...validos, comunaId: '13101' }).comunaId).toBeDefined()
  })

  it('exige que la confirmación coincida', () => {
    expect(validarRegistroCliente({ ...validos, confirmacion: 'otra1234' }).confirmacion).toBeDefined()
  })
})

describe('validarCorreo', () => {
  it('normaliza espacios y mayúsculas', () => {
    expect(normalizarCorreo('  P1@Prueba.CL ')).toBe('p1@prueba.cl')
    expect(validarCorreo('  P1@Prueba.CL ')).toBeUndefined()
  })

  it('rechaza vacío y formatos inválidos', () => {
    expect(validarCorreo('')).toBeDefined()
    expect(validarCorreo('sin-arroba.cl')).toBeDefined()
    expect(validarCorreo('a@b')).toBeDefined()
  })
})

describe('validarContrasena', () => {
  it('exige 8 caracteres con letras y números', () => {
    expect(validarContrasena('abc123')).toBeDefined()
    expect(validarContrasena('solamenteletras')).toBeDefined()
    expect(validarContrasena('12345678')).toBeDefined()
    expect(validarContrasena('clave1234')).toBeUndefined()
  })
})

describe('mensajeErrorAuth', () => {
  it('traduce los errores conocidos de Supabase', () => {
    expect(mensajeErrorAuth('Invalid login credentials')).toBe('Correo o contraseña incorrectos.')
    expect(mensajeErrorAuth('Email not confirmed')).toMatch(/confirmar tu correo/)
    expect(mensajeErrorAuth('User already registered')).toMatch(/Ya existe una cuenta/)
  })

  it('usa un mensaje genérico para errores desconocidos', () => {
    expect(mensajeErrorAuth('algo raro')).toMatch(/error inesperado/)
  })
})
