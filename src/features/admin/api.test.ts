import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc, remove, invoke } = vi.hoisted(() => ({
  rpc: vi.fn(),
  remove: vi.fn(),
  invoke: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc,
    storage: { from: () => ({ remove }) },
    functions: { invoke },
  },
}))

import { aprobarIdentidad } from './api'

const revision = { documentoId: 'doc-1', maestroId: 'maestro-1', ruta: 'maestro-1/cedula.jpg', revisorId: 'admin-1' }

describe('aprobarIdentidad (RF-2, §5.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    rpc.mockResolvedValue({ data: 'maestro-1/cedula.jpg', error: null })
    remove.mockResolvedValue({ data: [], error: null })
    invoke.mockResolvedValue({ data: { pendientes: 1, borrados: 1, fallos: [] }, error: null })
  })

  it('borra el archivo y vacía la cola de borrado después de aprobar', async () => {
    await aprobarIdentidad(revision)

    expect(rpc).toHaveBeenCalledWith('revisar_identidad', {
      p_documento_id: 'doc-1',
      p_aprobar: true,
      p_motivo: null,
    })
    expect(remove).toHaveBeenCalledWith(['maestro-1/cedula.jpg'])
    expect(invoke).toHaveBeenCalledWith('purgar-archivos')
  })

  it('no falla si el borrado directo falla pero la Edge Function lo borra', async () => {
    remove.mockResolvedValue({ data: null, error: { message: 'sin permiso' } })

    await expect(aprobarIdentidad(revision)).resolves.toBeUndefined()
  })

  it('no falla si solo falla la Edge Function: el archivo ya se borró', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'Failed to send a request to the Edge Function' } })

    await expect(aprobarIdentidad(revision)).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalled()
  })

  it('avisa cuando fallan el borrado directo y la Edge Function', async () => {
    remove.mockResolvedValue({ data: null, error: { message: 'sin permiso' } })
    invoke.mockResolvedValue({ data: { pendientes: 1, borrados: 0, fallos: ['cedulas: sin permiso'] }, error: null })

    await expect(aprobarIdentidad(revision)).rejects.toThrow(/quedó verificado.*cola de borrado/)
  })

  it('no borra nada si la revisión falla', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'Este documento ya fue revisado' } })

    await expect(aprobarIdentidad(revision)).rejects.toThrow('Este documento ya fue revisado')
    expect(remove).not.toHaveBeenCalled()
    expect(invoke).not.toHaveBeenCalled()
  })
})
