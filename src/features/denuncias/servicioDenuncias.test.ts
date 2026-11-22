import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
  },
}))

import {
  denunciarResena,
  listarDenunciasPendientes,
  resolverDenuncia,
  traducirErrorDenuncia,
} from './servicioDenuncias'

describe('traducirErrorDenuncia (RF-12, RF-8)', () => {
  it('solo el maestro reseñado puede denunciar', () => {
    expect(traducirErrorDenuncia('SOLO_MAESTRO_RESENADO')).toMatch(/Solo el maestro/)
  })

  it('avisa que la reseña ya fue denunciada', () => {
    expect(traducirErrorDenuncia('YA_DENUNCIADA')).toMatch(/Ya denunciaste/)
  })

  it('solo el admin revisa denuncias', () => {
    expect(traducirErrorDenuncia('SOLO_ADMIN')).toMatch(/administrador/)
  })

  it('avisa si otra persona ya la resolvió', () => {
    expect(traducirErrorDenuncia('DENUNCIA_YA_RESUELTA')).toMatch(/ya resolvió/)
  })

  it('no expone detalles internos ante errores desconocidos', () => {
    expect(traducirErrorDenuncia('detalle interno de base de datos')).toMatch(/No fue posible/)
  })
})

describe('servicio de denuncias', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('denunciarResena envía el detalle sin espacios y null si viene vacío', async () => {
    rpcMock.mockResolvedValue({ data: 'id-denuncia', error: null })

    await denunciarResena('r1', 'ofensiva', '  me insulta  ')
    expect(rpcMock).toHaveBeenLastCalledWith('denunciar_resena', {
      p_resena_id: 'r1',
      p_motivo: 'ofensiva',
      p_detalle: 'me insulta',
    })

    await denunciarResena('r1', 'otro', '   ')
    expect(rpcMock).toHaveBeenLastCalledWith('denunciar_resena', {
      p_resena_id: 'r1',
      p_motivo: 'otro',
      p_detalle: null,
    })
  })

  it('denunciarResena rechaza un detalle de más de 500 caracteres sin llamar a la base', async () => {
    await expect(denunciarResena('r1', 'otro', 'a'.repeat(501))).rejects.toThrow(/500 caracteres/)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('denunciarResena traduce el error de la base', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'YA_DENUNCIADA' } })
    await expect(denunciarResena('r1', 'falsa')).rejects.toThrow(/Ya denunciaste/)
  })

  it('listarDenunciasPendientes agrupa los datos de la reseña', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'd1',
          motivo: 'ofensiva',
          detalle: null,
          creada_en: '2026-11-23T10:00:00Z',
          resena_id: 'r1',
          resena_calificacion: 1,
          resena_comentario: 'Pésimo',
          resena_creada_en: '2026-11-20T10:00:00Z',
          maestro_nombre: 'Juan',
        },
      ],
      error: null,
    })

    await expect(listarDenunciasPendientes()).resolves.toEqual([
      {
        id: 'd1',
        motivo: 'ofensiva',
        detalle: null,
        creadaEn: '2026-11-23T10:00:00Z',
        resena: { id: 'r1', calificacion: 1, comentario: 'Pésimo', creadaEn: '2026-11-20T10:00:00Z' },
        maestroNombre: 'Juan',
      },
    ])
  })

  it('listarDenunciasPendientes devuelve una lista vacía si no hay datos', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })
    await expect(listarDenunciasPendientes()).resolves.toEqual([])
  })

  it('resolverDenuncia llama a la función con los parámetros correctos', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })
    await resolverDenuncia('d1', true)
    expect(rpcMock).toHaveBeenCalledWith('resolver_denuncia', { p_id: 'd1', p_aceptar: true })
  })

  it('resolverDenuncia traduce SOLO_ADMIN', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'SOLO_ADMIN' } })
    await expect(resolverDenuncia('d1', false)).rejects.toThrow(/administrador/)
  })
})
