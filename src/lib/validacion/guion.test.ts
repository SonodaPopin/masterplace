import { describe, expect, it } from 'vitest'
import {
  correoPrueba,
  estadoTarea,
  guion,
  pasoActual,
  progreso,
  puntajeSus,
  segundosTarea,
  validarOrdenSenales,
} from './guion'

describe('guion de la validación con usuarios', () => {
  it('el maestro hace solo el registro (T1) y el cliente T2, T3 y T4', () => {
    const tareas = (perfil: 'maestro' | 'cliente') =>
      guion(perfil)
        .filter((p) => p.tipo === 'tarea')
        .map((p) => p.clave)
    expect(tareas('maestro')).toEqual(['t1'])
    expect(tareas('cliente')).toEqual(['t2', 't3', 't4'])
  })

  it('todos terminan con señales (T5), SUS, preguntas finales y cierre', () => {
    const cola = guion('cliente')
      .slice(-4)
      .map((p) => p.clave)
    expect(cola).toEqual(['t5', 'sus', 'finales', 'fin'])
  })

  it('el paso actual es el primero sin responder', () => {
    expect(pasoActual('maestro', {}).clave).toBe('consentimiento')
    expect(pasoActual('maestro', { consentimiento: { acepta: true }, datos: {} }).clave).toBe('a1')
    expect(pasoActual('cliente', { consentimiento: { acepta: true }, datos: {}, a1: {}, t2: {} }).clave).toBe('t3')
  })

  it('si no acepta participar, la prueba termina sin más preguntas', () => {
    const paso = pasoActual('cliente', { consentimiento: { acepta: false } })
    expect(paso).toEqual({ tipo: 'fin', clave: 'fin', rechazo: true })
  })

  it('con todo respondido, el paso actual es el cierre', () => {
    const todo = Object.fromEntries(guion('maestro').map((p) => [p.clave, {}]))
    todo.consentimiento = { acepta: true }
    expect(pasoActual('maestro', todo)).toMatchObject({ tipo: 'fin', rechazo: false })
  })

  it('el progreso cuenta los pasos sin el cierre', () => {
    const pasos = guion('cliente')
    expect(progreso('cliente', pasos[0])).toEqual({ numero: 1, total: pasos.length - 1 })
    expect(progreso('cliente', pasos[pasos.length - 1])).toEqual({ numero: pasos.length - 1, total: pasos.length - 1 })
  })
})

describe('tareas: estado y tiempo medido', () => {
  it('avanza de por comenzar a evaluada', () => {
    expect(estadoTarea('t1', {})).toBe('por_comenzar')
    expect(estadoTarea('t1', { t1_inicio: 'x' })).toBe('en_curso')
    expect(estadoTarea('t1', { t1_inicio: 'x', t1_fin: 'y' })).toBe('por_evaluar')
    expect(estadoTarea('t1', { t1_inicio: 'x', t1_fin: 'y', t1: {} })).toBe('evaluada')
  })

  it('mide los segundos entre comenzar y terminar', () => {
    const r = { t1_inicio: '2026-11-14T15:00:00.000Z', t1_fin: '2026-11-14T15:04:30.000Z' }
    expect(segundosTarea('t1', r)).toBe(270)
  })

  it('no inventa un tiempo si falta una marca o están al revés', () => {
    expect(segundosTarea('t1', { t1_inicio: '2026-11-14T15:00:00Z' })).toBeNull()
    expect(segundosTarea('t1', { t1_inicio: '2026-11-14T15:05:00Z', t1_fin: '2026-11-14T15:00:00Z' })).toBeNull()
    expect(segundosTarea('t1', { t1_inicio: 'no es fecha', t1_fin: '2026-11-14T15:00:00Z' })).toBeNull()
  })
})

describe('puntajeSus (Brooke, 1996)', () => {
  it('reproduce el ejemplo del plan de validación: 82,5', () => {
    expect(puntajeSus([4, 2, 4, 1, 4, 2, 5, 1, 4, 2])).toBe(82.5)
  })

  it('va de 0 a 100', () => {
    expect(puntajeSus([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0)
    expect(puntajeSus([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100)
  })

  it('rechaza respuestas incompletas o fuera de la escala', () => {
    expect(() => puntajeSus([3, 3, 3])).toThrow()
    expect(() => puntajeSus([3, 3, 3, 3, 3, 3, 3, 3, 3, 6])).toThrow()
  })
})

describe('validarOrdenSenales (A2)', () => {
  it('acepta un orden completo sin repetir', () => {
    expect(validarOrdenSenales({ identidad: 1, resenas: 2, certificado: 3, cercania: 4 })).toBeNull()
  })

  it('pide completar y no repetir', () => {
    expect(validarOrdenSenales({ identidad: 1, resenas: 2 })).toMatch(/cada una/)
    expect(validarOrdenSenales({ identidad: 1, resenas: 1, certificado: 3, cercania: 4 })).toMatch(/una sola vez/)
  })
})

it('arma el correo de prueba desde el código', () => {
  expect(correoPrueba('P3')).toBe('p3@prueba.masterplace.cl')
})
