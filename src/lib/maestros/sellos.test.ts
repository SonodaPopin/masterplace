import { describe, expect, it } from 'vitest'
import { SELLOS, sellosDeMaestro } from './sellos'

describe('sellosDeMaestro', () => {
  it('siempre incluye la identidad y termina con la disponibilidad', () => {
    expect(sellosDeMaestro({ certificado: false, reputacion: false, disponible: true })).toEqual([
      'identidad',
      'disponible',
    ])
    expect(sellosDeMaestro({ certificado: false, reputacion: false, disponible: false })).toEqual([
      'identidad',
      'ocupado',
    ])
  })

  it('agrega certificado y reputación en ese orden cuando corresponden', () => {
    expect(sellosDeMaestro({ certificado: true, reputacion: true, disponible: true })).toEqual([
      'identidad',
      'certificado',
      'reputacion',
      'disponible',
    ])
    expect(sellosDeMaestro({ certificado: false, reputacion: true, disponible: false })).toEqual([
      'identidad',
      'reputacion',
      'ocupado',
    ])
  })
})

describe('SELLOS', () => {
  it('cada sello tiene etiqueta y una explicación en una oración', () => {
    for (const sello of Object.values(SELLOS)) {
      expect(sello.etiqueta.length).toBeGreaterThan(0)
      expect(sello.ayuda).toMatch(/^[A-ZÁÉÍÓÚ].+\.$/)
    }
  })
})
