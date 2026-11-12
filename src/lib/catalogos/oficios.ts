import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export type Oficio = { id: number; nombre: string }

export type EstadoOficios =
  | { estado: 'cargando' }
  | { estado: 'listo'; oficios: Oficio[] }
  | { estado: 'error' }

// Oficios del piloto desde la tabla `oficios` (lectura pública por RLS).
export function useOficios(): EstadoOficios & { reintentar: () => void } {
  const [estado, setEstado] = useState<EstadoOficios>({ estado: 'cargando' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    supabase
      .from('oficios')
      .select('id, nombre')
      .order('nombre')
      .then(({ data, error }) => {
        if (!activo) return
        setEstado(error || !data?.length ? { estado: 'error' } : { estado: 'listo', oficios: data as Oficio[] })
      })
    return () => {
      activo = false
    }
  }, [intento])

  return {
    ...estado,
    reintentar: () => {
      setEstado({ estado: 'cargando' })
      setIntento((n) => n + 1)
    },
  }
}
