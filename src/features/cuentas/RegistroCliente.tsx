import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Icono from '../../components/Icono'
import DisenoCuentas from './DisenoCuentas'
import FormularioCuenta from './FormularioCuenta'
import RevisaTuCorreo from './RevisaTuCorreo'
import { supabaseConfigurado } from '../../lib/supabase'
import { useSesion } from '../../lib/auth/contexto'

// RF-10 · Registro de cliente con Supabase Auth (correo y contraseña). Responsable: Gabriel.
export default function RegistroCliente() {
  const { sesion } = useSesion()
  const [correoPorConfirmar, setCorreoPorConfirmar] = useState<string | null>(null)

  if (sesion) return <Navigate to="/" replace />

  if (correoPorConfirmar) {
    return (
      <DisenoCuentas titulo="Revisa tu correo">
        <RevisaTuCorreo correo={correoPorConfirmar} />
      </DisenoCuentas>
    )
  }

  return (
    <DisenoCuentas
      titulo="Crea tu cuenta"
      subtitulo={
        <>
          ¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link>
        </>
      }
    >
      {!supabaseConfigurado && (
        <p className="aviso" role="note">
          <Icono nombre="alerta" tamano={18} />
          Falta configurar Supabase en <code>.env.local</code>; el registro no funcionará en este entorno.
        </p>
      )}

      <FormularioCuenta
        rol="cliente"
        rutaTrasConfirmar="/ingresar"
        textoBoton="Crear cuenta"
        textoEnviando="Creando cuenta…"
        alPedirConfirmacion={setCorreoPorConfirmar}
      />

      <p className="cuentas-alterno">
        ¿Ofreces servicios de un oficio? <Link to="/registro/maestro">Regístrate como maestro</Link>
      </p>
    </DisenoCuentas>
  )
}
