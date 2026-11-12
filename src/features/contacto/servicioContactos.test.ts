import { describe, expect, it } from 'vitest'
import { traducirErrorContacto } from './servicioContactos.ts'

describe('traducirErrorContacto (RF-4)', () => {
  it('explica que se requiere una sesión', () => {
    expect(traducirErrorContacto('USUARIO_NO_AUTENTICADO')).toMatch(/iniciar sesión/)
  })

  it('impide que una cuenta que no es cliente inicie el contacto', () => {
    expect(traducirErrorContacto('SOLO_CLIENTE')).toMatch(/cuentas de cliente/)
  })

  it('informa cuando el maestro no cumple las condiciones de contacto', () => {
    expect(traducirErrorContacto('MAESTRO_NO_CONTACTABLE')).toMatch(/no está disponible/)
  })

  it('no expone detalles internos ante errores desconocidos', () => {
    expect(traducirErrorContacto('detalle interno de base de datos')).toMatch(/No fue posible/)
  })
})
