import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSesion } from '../lib/auth/contexto'

// Muestra quién está conectado y permite cerrar sesión (RF-10).
export default function EstadoSesion() {
  const { cargando, sesion, nombreVisible, rol, cerrarSesion } = useSesion()
  const navegar = useNavigate()
  const [cerrando, setCerrando] = useState(false)

  if (cargando) return <p className="estado-sesion">Cargando sesión…</p>

  if (!sesion)
    return (
      <p className="estado-sesion">
        <Link to="/ingresar">Ingresar</Link> · <Link to="/registro/cliente">Crear cuenta</Link>
      </p>
    )

  async function salir() {
    setCerrando(true)
    await cerrarSesion()
    setCerrando(false)
    navegar('/ingresar')
  }

  return (
    <p className="estado-sesion">
      Conectado como <strong>{nombreVisible}</strong>
      {rol && <span className="etiqueta-rol"> ({rol})</span>}{' '}
      <button type="button" className="boton-secundario" onClick={salir} disabled={cerrando}>
        {cerrando ? 'Cerrando…' : 'Cerrar sesión'}
      </button>
    </p>
  )
}
