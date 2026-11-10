import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Campo from '../../components/Campo'
import { supabase, supabaseConfigurado } from '../../lib/supabase'
import { useSesion } from '../../lib/auth/contexto'
import { mensajeErrorAuth, normalizarCorreo, validarCorreo } from '../../lib/auth/validacion'

// RF-10 · Inicio de sesión con correo y contraseña (Supabase Auth). Responsable: Gabriel.
export default function IniciarSesion() {
  const { sesion } = useSesion()
  const ubicacion = useLocation()
  const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? '/'

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [errorCorreo, setErrorCorreo] = useState<string | undefined>()
  const [errorContrasena, setErrorContrasena] = useState<string | undefined>()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (sesion) return <Navigate to={destino} replace />

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErrorGeneral(null)

    const eCorreo = validarCorreo(correo)
    const eContrasena = contrasena ? undefined : 'Escribe tu contraseña.'
    setErrorCorreo(eCorreo)
    setErrorContrasena(eContrasena)
    if (eCorreo || eContrasena) {
      document.getElementById(eCorreo ? 'correo' : 'contrasena')?.focus()
      return
    }

    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizarCorreo(correo),
      password: contrasena,
    })
    setEnviando(false)
    // Si funciona, onAuthStateChange actualiza la sesión y el <Navigate> de arriba redirige.
    if (error) setErrorGeneral(mensajeErrorAuth(error.message))
  }

  return (
    <section aria-labelledby="titulo-ingresar" className="tarjeta">
      <h2 id="titulo-ingresar">Ingresar</h2>
      <p>
        ¿No tienes cuenta? <Link to="/registro/cliente">Regístrate como cliente</Link> o{' '}
        <Link to="/registro/maestro">como maestro</Link>.
      </p>

      {!supabaseConfigurado && (
        <p className="aviso" role="note">
          Falta configurar Supabase en <code>.env.local</code>; el inicio de sesión no funcionará en este entorno.
        </p>
      )}

      <form onSubmit={enviar} noValidate>
        <Campo
          id="correo"
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={errorCorreo}
          required
        />
        <Campo
          id="contrasena"
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          error={errorContrasena}
          required
        />

        {errorGeneral && (
          <p className="campo-error" role="alert">
            {errorGeneral}
          </p>
        )}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </section>
  )
}
