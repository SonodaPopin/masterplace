import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo'
import Icono from './Icono'
import EstadoSesion from './EstadoSesion'
import { useSesion } from '../lib/auth/contexto'

const ENLACES = [
  { a: '/', texto: 'Buscar maestros', fin: true },
  { a: '/registro/maestro', texto: 'Soy maestro', fin: false },
  { a: '/admin', texto: 'Moderación', fin: false },
]

// Encabezado común: marca, navegación principal y sesión. En móvil la navegación se pliega (RNF-7: botón
// con aria-expanded y aria-controls).
export default function Encabezado() {
  const [abierto, setAbierto] = useState(false)
  const { pathname } = useLocation()
  const { usuario, rol } = useSesion()
  const enlaces = usuario && (rol === 'cliente' || rol === 'maestro')
    ? [...ENLACES, { a: '/contactos', texto: 'Mensajes', fin: false }]
    : ENLACES

  // Cierra el menú móvil al cambiar de página.
  useEffect(() => setAbierto(false), [pathname])

  return (
    <header className="encabezado">
      <div className="encabezado-interior">
        <Link to="/" className="encabezado-marca" aria-label="MasterPlace, ir al inicio">
          <Logo />
        </Link>

        <button
          type="button"
          className="boton-menu"
          aria-expanded={abierto}
          aria-controls="menu-principal"
          onClick={() => setAbierto((v) => !v)}
        >
          <Icono nombre={abierto ? 'cerrar' : 'menu'} />
          <span className="solo-lector">{abierto ? 'Cerrar menú' : 'Abrir menú'}</span>
        </button>

        <div id="menu-principal" className={`encabezado-menu${abierto ? ' abierto' : ''}`}>
          <nav aria-label="Principal">
            <ul className="nav-lista">
              {enlaces.map((e) => (
                <li key={e.a}>
                  <NavLink to={e.a} end={e.fin} className="nav-enlace">
                    {e.texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <EstadoSesion />
        </div>
      </div>
    </header>
  )
}
