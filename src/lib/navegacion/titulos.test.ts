import { describe, expect, it } from 'vitest'
import { tituloDeRuta } from './titulos'

describe('tituloDeRuta', () => {
  it('da un título distinto a cada página del flujo principal', () => {
    const rutas = [
      '/',
      '/registro/cliente',
      '/registro/maestro',
      '/ingresar',
      '/admin',
      '/contactos',
      '/contactos/abc',
      '/contactos/abc/resena',
    ]
    const titulos = rutas.map(tituloDeRuta)
    expect(new Set(titulos).size).toBe(rutas.length)
    titulos.forEach((t) => expect(t).toMatch(/· MasterPlace$/))
  })

  it('distingue la conversación de la reseña', () => {
    expect(tituloDeRuta('/contactos/abc')).toBe('Conversación · MasterPlace')
    expect(tituloDeRuta('/contactos/abc/resena')).toBe('Nueva reseña · MasterPlace')
  })

  it('usa solo la marca en una ruta desconocida', () => {
    expect(tituloDeRuta('/no-existe')).toBe('MasterPlace')
  })
})
