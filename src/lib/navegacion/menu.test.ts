import { describe, expect, it } from 'vitest'
import { enlacesDelMenu, inicioDelRol } from './menu'

const textos = (...args: Parameters<typeof enlacesDelMenu>) => enlacesDelMenu(...args).map((e) => e.texto)

describe('enlacesDelMenu', () => {
  it('el visitante busca y puede registrarse como maestro', () => {
    expect(textos({ conSesion: false, cargando: false, rol: null })).toEqual(['Buscar maestros', 'Soy maestro'])
  })

  it('el cliente busca, ve sus mensajes y sabe que puede ofrecer servicios con otra cuenta', () => {
    expect(textos({ conSesion: true, cargando: false, rol: 'cliente' })).toEqual([
      'Buscar maestros',
      'Mensajes',
      'Soy maestro',
    ])
  })

  it('el maestro no ve la búsqueda ni la moderación', () => {
    const menu = textos({ conSesion: true, cargando: false, rol: 'maestro' })
    expect(menu).toEqual(['Mensajes', 'Mi registro'])
    expect(menu).not.toContain('Buscar maestros')
    expect(menu).not.toContain('Moderación')
  })

  it('solo el admin ve la moderación', () => {
    expect(textos({ conSesion: true, cargando: false, rol: 'admin' })).toEqual(['Moderación', 'Buscar maestros'])
    for (const rol of ['cliente', 'maestro', null] as const) {
      expect(textos({ conSesion: true, cargando: false, rol })).not.toContain('Moderación')
    }
    expect(textos({ conSesion: false, cargando: false, rol: null })).not.toContain('Moderación')
  })

  it('no muestra enlaces mientras se conoce el rol (evita que aparezcan y desaparezcan)', () => {
    expect(enlacesDelMenu({ conSesion: true, cargando: true, rol: 'cliente' })).toEqual([])
    expect(enlacesDelMenu({ conSesion: false, cargando: true, rol: null })).toEqual([])
  })

  it('con sesión pero sin rol conocido solo ofrece la búsqueda', () => {
    expect(textos({ conSesion: true, cargando: false, rol: null })).toEqual(['Buscar maestros'])
  })
})

describe('inicioDelRol', () => {
  it('el maestro empieza en sus mensajes y los demás en la búsqueda', () => {
    expect(inicioDelRol('maestro')).toBe('/contactos')
    expect(inicioDelRol('cliente')).toBe('/')
    expect(inicioDelRol('admin')).toBe('/')
    expect(inicioDelRol(null)).toBe('/')
  })
})
