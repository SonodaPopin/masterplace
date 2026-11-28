import { describe, expect, it } from 'vitest'
import {
  accionesSolicitud,
  aValorLocal,
  avisoDeContacto,
  desdeValorLocal,
  esSolicitudActiva,
  limitesFecha,
  validarSolicitud,
  type FilaAviso,
} from './presentacion'

const AHORA = new Date(2026, 10, 27, 12, 0) // 27-11-2026 12:00, hora local
const horas = (h: number) => new Date(AHORA.getTime() + h * 3_600_000).toISOString()
const dias = (d: number) => new Date(AHORA.getTime() + d * 86_400_000).toISOString()

const solicitud = (estado: FilaAviso['estado'], fechaAcordada: string, puedeResenar = false) => ({
  estado,
  fechaAcordada,
  puedeResenar,
})

describe('accionesSolicitud', () => {
  it('pendiente: el maestro responde y el cliente puede cancelar antes de la fecha', () => {
    const s = solicitud('pendiente', horas(24))
    expect(accionesSolicitud(s, 'maestro', AHORA)).toMatchObject({ aceptarORechazar: true, cancelar: false })
    expect(accionesSolicitud(s, 'cliente', AHORA)).toMatchObject({ aceptarORechazar: false, cancelar: true })
  })

  it('aceptada antes de las 2 h: nadie marca realizada y se informa desde cuándo', () => {
    const s = solicitud('aceptada', horas(-1))
    const a = accionesSolicitud(s, 'cliente', AHORA)
    expect(a.marcarRealizada).toBe(false)
    expect(a.cancelar).toBe(false) // ya pasó la fecha acordada (FUERA_DE_PLAZO)
    expect(a.realizadaDesde?.toISOString()).toBe(horas(1))
  })

  it('aceptada desde las 2 h exactas: ambos pueden marcarla como realizada', () => {
    const s = solicitud('aceptada', horas(-2))
    expect(accionesSolicitud(s, 'cliente', AHORA)).toMatchObject({ marcarRealizada: true, realizadaDesde: null })
    expect(accionesSolicitud(s, 'maestro', AHORA).marcarRealizada).toBe(true)
  })

  it('realizada: solo el cliente ve «Dejar reseña», y solo si el servicio lo permite', () => {
    expect(accionesSolicitud(solicitud('realizada', horas(-5), true), 'cliente', AHORA).resenar).toBe(true)
    expect(accionesSolicitud(solicitud('realizada', horas(-5), true), 'maestro', AHORA).resenar).toBe(false)
    expect(accionesSolicitud(solicitud('realizada', horas(-5), false), 'cliente', AHORA).resenar).toBe(false)
  })

  it('rechazada o cancelada no tienen acciones', () => {
    for (const estado of ['rechazada', 'cancelada'] as const) {
      const a = accionesSolicitud(solicitud(estado, horas(24)), 'cliente', AHORA)
      expect(a).toEqual({
        aceptarORechazar: false,
        cancelar: false,
        marcarRealizada: false,
        resenar: false,
        realizadaDesde: null,
      })
    }
  })
})

describe('esSolicitudActiva', () => {
  it('pendientes, aceptadas y las que el cliente puede reseñar quedan a la vista', () => {
    expect(esSolicitudActiva(solicitud('pendiente', horas(3)), 'maestro')).toBe(true)
    expect(esSolicitudActiva(solicitud('aceptada', horas(3)), 'cliente')).toBe(true)
    expect(esSolicitudActiva(solicitud('realizada', horas(-3), true), 'cliente')).toBe(true)
    expect(esSolicitudActiva(solicitud('realizada', horas(-3), true), 'maestro')).toBe(false)
    expect(esSolicitudActiva(solicitud('rechazada', horas(3)), 'cliente')).toBe(false)
  })
})

describe('fecha del formulario', () => {
  it('ida y vuelta entre datetime-local e ISO conserva la hora local', () => {
    expect(aValorLocal(AHORA)).toBe('2026-11-27T12:00')
    expect(desdeValorLocal('2026-11-27T12:00')).toBe(AHORA.toISOString())
  })

  it('rechaza valores vacíos o incompletos', () => {
    expect(desdeValorLocal('')).toBeNull()
    expect(desdeValorLocal('2026-11-27')).toBeNull()
    expect(desdeValorLocal('2026-13-40T99:99')).toBeNull()
  })

  it('los límites del campo son 7 días atrás y 60 hacia adelante', () => {
    expect(limitesFecha(AHORA)).toEqual({
      min: aValorLocal(new Date(dias(-7))),
      max: aValorLocal(new Date(dias(60))),
    })
  })
})

describe('validarSolicitud', () => {
  const enDosDias = aValorLocal(new Date(dias(2)))

  it('acepta una descripción y una fecha dentro del rango', () => {
    expect(validarSolicitud('Cambiar la llave del baño', enDosDias, AHORA)).toEqual({})
  })

  it('pide descripción y fecha', () => {
    expect(validarSolicitud('   ', '', AHORA)).toEqual({
      descripcion: 'Cuéntale al maestro qué necesitas.',
      fecha: 'Elige el día y la hora que acordaron.',
    })
  })

  it('limita la descripción a 500 caracteres', () => {
    expect(validarSolicitud('a'.repeat(500), enDosDias, AHORA)).toEqual({})
    expect(validarSolicitud('a'.repeat(501), enDosDias, AHORA).descripcion).toMatch(/500/)
  })

  it('rechaza fechas fuera de los límites de la base', () => {
    expect(validarSolicitud('x', aValorLocal(new Date(dias(-8))), AHORA).fecha).toMatch(/7 días/)
    expect(validarSolicitud('x', aValorLocal(new Date(dias(61))), AHORA).fecha).toMatch(/60 días/)
  })
})

describe('avisoDeContacto', () => {
  const CLIENTE = 'cliente-1'
  const fila = (id: string, estado: FilaAviso['estado'], realizada_en: string | null = null): FilaAviso => ({
    id,
    estado,
    cliente_id: CLIENTE,
    realizada_en,
  })

  it('sin solicitudes no hay aviso', () => {
    expect(avisoDeContacto([], CLIENTE, new Set(), AHORA)).toBeNull()
  })

  it('una solicitud pendiente se avisa a ambos', () => {
    const filas = [fila('a', 'pendiente')]
    expect(avisoDeContacto(filas, CLIENTE, new Set(), AHORA)).toBe('pendiente')
    expect(avisoDeContacto(filas, 'maestro-1', new Set(), AHORA)).toBe('pendiente')
  })

  it('al cliente la reseña le importa más que una pendiente', () => {
    const filas = [fila('a', 'pendiente'), fila('b', 'realizada', dias(-1))]
    expect(avisoDeContacto(filas, CLIENTE, new Set(), AHORA)).toBe('resenar')
    expect(avisoDeContacto(filas, 'maestro-1', new Set(), AHORA)).toBe('pendiente')
  })

  it('no avisa la reseña si ya existe o si pasaron los 30 días', () => {
    expect(avisoDeContacto([fila('b', 'realizada', dias(-1))], CLIENTE, new Set(['b']), AHORA)).toBeNull()
    expect(avisoDeContacto([fila('b', 'realizada', dias(-31))], CLIENTE, new Set(), AHORA)).toBeNull()
  })
})
