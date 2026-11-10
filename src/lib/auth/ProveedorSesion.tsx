import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import { ContextoSesion, type EstadoSesion } from './contexto'

// Mantiene la sesión de Supabase Auth disponible para toda la app (RF-10).
export default function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (activo) setSesion(data.session)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion)
    })
    return () => {
      activo = false
      data.subscription.unsubscribe()
    }
  }, [])

  const valor = useMemo<EstadoSesion>(() => {
    const usuario = sesion?.user ?? null
    const meta = usuario?.user_metadata ?? {}
    const rol = meta.rol === 'cliente' || meta.rol === 'maestro' || meta.rol === 'admin' ? meta.rol : null
    return {
      cargando,
      sesion,
      usuario,
      nombreVisible: (typeof meta.nombre === 'string' && meta.nombre) || usuario?.email || null,
      rol,
      cerrarSesion: async () => {
        await supabase.auth.signOut()
      },
    }
  }, [cargando, sesion])

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
}
