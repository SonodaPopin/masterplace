import { createContext, useContext } from 'react'
import type { Participante } from './api'

export type EstadoPrueba = {
  /** Token del enlace /prueba/<token> activo en este navegador, o null si no hay prueba en curso. */
  token: string | null
  participante: Participante | null
  cargando: boolean
  error: string | null
  /** Activa la prueba del enlace (y la recuerda en este navegador para el panel de tareas). */
  activar: (token: string) => void
  /** Guarda la respuesta de un paso y actualiza el avance. Lanza un error legible si falla. */
  guardar: (clave: string, valor: unknown) => Promise<void>
}

export const ContextoPrueba = createContext<EstadoPrueba | null>(null)

export function usePrueba(): EstadoPrueba {
  const valor = useContext(ContextoPrueba)
  if (!valor) throw new Error('usePrueba debe usarse dentro de <ProveedorPrueba>')
  return valor
}
