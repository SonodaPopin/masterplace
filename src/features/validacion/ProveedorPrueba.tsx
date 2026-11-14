import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { guardarRespuesta, obtenerParticipante, tokenValido, type Participante } from './api'
import { ContextoPrueba, type EstadoPrueba } from './contextoPrueba'

const CLAVE_LOCAL = 'masterplace.prueba'

function leerTokenGuardado(): string | null {
  try {
    const t = window.localStorage.getItem(CLAVE_LOCAL)
    return t && tokenValido(t) ? t : null
  } catch {
    return null
  }
}

function recordarToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(CLAVE_LOCAL, token)
    else window.localStorage.removeItem(CLAVE_LOCAL)
  } catch {
    // Sin almacenamiento (modo privado): la prueba sigue funcionando mientras no se recargue la página.
  }
}

// Mantiene la prueba con usuarios activa en toda la app: la página /prueba/<token> y el panel de tareas que se ve
// mientras el participante usa MasterPlace. Sin enlace activo no hace ninguna consulta.
export default function ProveedorPrueba({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(leerTokenGuardado)
  const [participante, setParticipante] = useState<Participante | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let activo = true
    setCargando(true)
    setError(null)
    obtenerParticipante(token)
      .then((p) => {
        if (!activo) return
        if (!p) {
          setError('Este enlace de prueba no es válido. Revise que lo copió completo.')
          setParticipante(null)
          recordarToken(null)
          return
        }
        setParticipante(p)
      })
      .catch((e: unknown) => activo && setError(e instanceof Error ? e.message : 'No pudimos cargar la prueba.'))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [token])

  const activar = useCallback(
    (nuevo: string) => {
      if (!tokenValido(nuevo)) {
        setError('Este enlace de prueba no es válido. Revise que lo copió completo.')
        return
      }
      recordarToken(nuevo)
      if (nuevo !== token) {
        setParticipante(null)
        setToken(nuevo)
      }
    },
    [token],
  )

  const guardar = useCallback(
    async (clave: string, valor: unknown) => {
      if (!token) throw new Error('No hay una prueba activa.')
      await guardarRespuesta(token, clave, valor)
      setParticipante((p) => (p ? { ...p, respuestas: { ...p.respuestas, [clave]: valor } } : p))
    },
    [token],
  )

  const valor = useMemo<EstadoPrueba>(
    () => ({ token, participante, cargando, error, activar, guardar }),
    [token, participante, cargando, error, activar, guardar],
  )

  return <ContextoPrueba.Provider value={valor}>{children}</ContextoPrueba.Provider>
}
