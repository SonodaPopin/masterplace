import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSesion } from '../lib/auth/contexto'
import Icono from './Icono'

function iniciales(nombre: string): string {
  const partes = nombre.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean)
  return ((partes[0]?.[0] ?? '?') + (partes[1]?.[0] ?? '')).toUpperCase()
}

const NOMBRE_ROL = { cliente: 'Cliente', maestro: 'Maestro', admin: 'Administración' } as const

// Muestra quién está conectado y permite cerrar sesión (RF-10).
export default function EstadoSesion() {
  const { cargando, sesion, nombreVisible, rol, cerrarSesion } = useSesion()
  const navegar = useNavigate()
  const [cerrando, setCerrando] = useState(false)

  if (cargando)
    return (
      <div className="sesion" aria-live="polite">
        <span className="sesion-cargando">Cargando sesión…</span>
      </div>
    )

  if (!sesion)
    return (
      <div className="sesion">
        <Link to="/ingresar" className="boton boton-fantasma">
          Ingresar
        </Link>
        <Link to="/registro/cliente" className="boton boton-primario">
          Crear cuenta
        </Link>
      </div>
    )

  async function salir() {
    setCerrando(true)
    await cerrarSesion()
    setCerrando(false)
    navegar('/ingresar')
  }

  const nombre = nombreVisible ?? 'Usuario'
  return (
    <div className="sesion">
      <span className="avatar" aria-hidden="true">
        {iniciales(nombre)}
      </span>
      <span className="sesion-datos">
        <span className="solo-lector">Conectado como </span>
        <strong className="sesion-nombre">{nombre}</strong>
        {rol && <span className="sesion-rol">{NOMBRE_ROL[rol]}</span>}
      </span>
      <button type="button" className="boton boton-fantasma boton-chico" onClick={salir} disabled={cerrando}>
        <Icono nombre="salir" tamano={16} />
        {cerrando ? 'Cerrando…' : 'Cerrar sesión'}
      </button>
    </div>
  )
}
