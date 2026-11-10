import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type EstadoSesion = {
  /** true mientras se recupera la sesión guardada al abrir la página. */
  cargando: boolean
  sesion: Session | null
  usuario: User | null
  /** Nombre visible: el del registro (metadatos) o, si falta, el correo. */
  nombreVisible: string | null
  rol: 'cliente' | 'maestro' | 'admin' | null
  cerrarSesion: () => Promise<void>
}

export const ContextoSesion = createContext<EstadoSesion | null>(null)

export function useSesion(): EstadoSesion {
  const valor = useContext(ContextoSesion)
  if (!valor) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>')
  return valor
}
