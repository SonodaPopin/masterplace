import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import { ContextoSesion, type EstadoSesion, type Rol } from './contexto'

function aRol(valor: unknown): Rol | null {
  return valor === 'cliente' || valor === 'maestro' || valor === 'admin' ? valor : null
}

// Mantiene la sesión de Supabase Auth disponible para toda la app (RF-10).
//
// El rol sale de `perfiles` (fuente de verdad, Iteración 2 de la bitácora): los metadatos de la sesión los puede
// editar el propio usuario y no reflejan a un admin asignado por SQL ni a las cuentas de la semilla. Mientras se
// consulta el perfil, `cargando` sigue en true y se usa el rol de los metadatos solo como respaldo. Esto decide qué
// se muestra; la protección real sigue en RLS.
export default function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [rolPerfil, setRolPerfil] = useState<{ id: string; rol: Rol | null } | null>(null)

  useEffect(() => {
    let activo = true
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (activo) setSesion(data.session)
      })
      .finally(() => {
        if (activo) setCargandoSesion(false)
      })

    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion)
    })
    return () => {
      activo = false
      data.subscription.unsubscribe()
    }
  }, [])

  const idUsuario = sesion?.user.id ?? null

  // Rol real del usuario conectado. Se consulta una vez por cuenta (no en cada renovación del token).
  useEffect(() => {
    if (!idUsuario) return
    let activo = true
    supabase
      .from('perfiles')
      .select('rol')
      .eq('id', idUsuario)
      .maybeSingle()
      .then(({ data, error }) => {
        if (activo) setRolPerfil({ id: idUsuario, rol: error ? null : aRol(data?.rol) })
      })
    return () => {
      activo = false
    }
  }, [idUsuario])

  const valor = useMemo<EstadoSesion>(() => {
    const usuario = sesion?.user ?? null
    const meta = usuario?.user_metadata ?? {}
    const perfilListo = !idUsuario || rolPerfil?.id === idUsuario
    const rolReal = rolPerfil?.id === idUsuario ? rolPerfil.rol : null
    return {
      cargando: cargandoSesion || !perfilListo,
      sesion,
      usuario,
      nombreVisible: (typeof meta.nombre === 'string' && meta.nombre) || usuario?.email || null,
      rol: rolReal ?? aRol(meta.rol),
      cerrarSesion: async () => {
        await supabase.auth.signOut()
      },
    }
  }, [cargandoSesion, sesion, idUsuario, rolPerfil])

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
}
