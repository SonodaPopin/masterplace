import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icono from '../../components/Icono'

// Aviso tras registrarse cuando Supabase pide confirmar el correo.
export default function RevisaTuCorreo({ correo, siguiente }: { correo: string; siguiente?: ReactNode }) {
  return (
    <div className="confirmacion" role="status">
      <span className="confirmacion-icono">
        <Icono nombre="correo" tamano={32} />
      </span>
      <p>
        Te enviamos un enlace de confirmación a <strong>{correo}</strong>. Ábrelo para activar tu cuenta.
      </p>
      {siguiente && <p>{siguiente}</p>}
      <p className="texto-suave">Si no lo ves en unos minutos, revisa la carpeta de spam.</p>
      <Link to="/ingresar" className="boton boton-primario boton-ancho">
        Ir a ingresar
      </Link>
    </div>
  )
}
