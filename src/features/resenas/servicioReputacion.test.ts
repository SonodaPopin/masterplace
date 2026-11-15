import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
  },
}))

import { obtenerReputacionMaestro } from './servicioReputacion'

describe('obtenerReputacionMaestro (RF-5 / CI-2)', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  function simularRespuestas(
    resenas: unknown[],
    estadisticas: {
      cantidad_resenas: number
      promedio_maestro: number | null
      promedio_global: number | null
    },
  ) {
    rpcMock.mockImplementation((funcion: string) => {
      if (funcion === 'obtener_resenas_maestro') {
        return Promise.resolve({
          data: resenas,
          error: null,
        })
      }

      if (funcion === 'obtener_estadisticas_reputacion') {
        return Promise.resolve({
          data: [estadisticas],
          error: null,
        })
      }

      throw new Error(`Función inesperada: ${funcion}`)
    })
  }

  it('utiliza el promedio global cuando no hay reseñas', async () => {
    simularRespuestas([], {
      cantidad_resenas: 0,
      promedio_maestro: null,
      promedio_global: 3.5,
    })

    const resultado = await obtenerReputacionMaestro('maestro-1')

    expect(resultado.resenas).toEqual([])
    expect(resultado.cantidadResenas).toBe(0)
    expect(resultado.promedioBruto).toBeNull()
    expect(resultado.promedioBayesiano).toBe(3.5)
  })

  it('calcula el promedio bayesiano cuando existen reseñas', async () => {
    const resenas = [
      {
        calificacion: 5,
        comentario: 'Buen servicio',
        creada_en: '2026-11-14T12:00:00Z',
      },
      {
        calificacion: 4,
        comentario: null,
        creada_en: '2026-11-13T12:00:00Z',
      },
    ]

    simularRespuestas(resenas, {
      cantidad_resenas: 2,
      promedio_maestro: 4.5,
      promedio_global: 3.5,
    })

    const resultado = await obtenerReputacionMaestro('maestro-1')

    expect(resultado.resenas).toEqual(resenas)
    expect(resultado.cantidadResenas).toBe(2)
    expect(resultado.promedioBruto).toBe(4.5)
    expect(resultado.promedioBayesiano).toBeCloseTo(
      (2 * 4.5 + 5 * 3.5) / 7,
    )
  })

  it('devuelve reputación nula cuando no existe promedio global', async () => {
    simularRespuestas([], {
      cantidad_resenas: 0,
      promedio_maestro: null,
      promedio_global: null,
    })

    const resultado = await obtenerReputacionMaestro('maestro-1')

    expect(resultado.promedioBayesiano).toBeNull()
  })

  it('envía el identificador del maestro a ambas funciones', async () => {
    simularRespuestas([], {
      cantidad_resenas: 0,
      promedio_maestro: null,
      promedio_global: 4,
    })

    await obtenerReputacionMaestro('maestro-123')

    expect(rpcMock).toHaveBeenCalledWith(
      'obtener_resenas_maestro',
      { p_maestro_id: 'maestro-123' },
    )

    expect(rpcMock).toHaveBeenCalledWith(
      'obtener_estadisticas_reputacion',
      { p_maestro_id: 'maestro-123' },
    )
  })

  it('maneja errores al consultar las reseñas', async () => {
    rpcMock.mockImplementation((funcion: string) =>
      Promise.resolve(
        funcion === 'obtener_resenas_maestro'
          ? { data: null, error: { message: 'Error de base de datos' } }
          : { data: [], error: null },
      ),
    )

    await expect(
      obtenerReputacionMaestro('maestro-1'),
    ).rejects.toThrow('No se pudieron obtener las reseñas.')
  })

  it('maneja errores al consultar las estadísticas', async () => {
    rpcMock.mockImplementation((funcion: string) =>
      Promise.resolve(
        funcion === 'obtener_estadisticas_reputacion'
          ? { data: null, error: { message: 'Error de base de datos' } }
          : { data: [], error: null },
      ),
    )

    await expect(
      obtenerReputacionMaestro('maestro-1'),
    ).rejects.toThrow(
      'No se pudieron obtener las estadísticas de reputación.',
    )
  })

  it('detecta cuando faltan las estadísticas', async () => {
    rpcMock.mockImplementation((funcion: string) =>
      Promise.resolve({
        data: funcion === 'obtener_estadisticas_reputacion' ? [] : [],
        error: null,
      }),
    )

    await expect(
      obtenerReputacionMaestro('maestro-1'),
    ).rejects.toThrow(
      'No se encontraron las estadísticas de reputación.',
    )
  })
})
