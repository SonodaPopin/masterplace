import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Campo from '../../components/Campo'
import Icono from '../../components/Icono'
import DisenoCuentas from './DisenoCuentas'
import { supabase, supabaseConfigurado } from '../../lib/supabase'
import { useSesion } from '../../lib/auth/contexto'
import { COMUNAS_PILOTO } from '../../lib/catalogos/comunas'
import {
  LARGO_MINIMO_CONTRASENA,
  mensajeErrorAuth,
  normalizarCorreo,
  normalizarTelefono,
  validarRegistroCliente,
  type DatosRegistroCliente,
  type ErroresFormulario,
} from '../../lib/auth/validacion'

const VACIO: DatosRegistroCliente = {
  nombre: '',
  correo: '',
  telefono: '',
  comunaId: '',
  contrasena: '',
  confirmacion: '',
}

// RF-10 · Registro de cliente con Supabase Auth (correo y contraseña). Responsable: Gabriel.
// Los datos del perfil viajan como metadatos del usuario; el trigger de la migración
// 20261110120000_perfil_al_registrarse.sql crea la fila en `perfiles` con rol «cliente».
export default function RegistroCliente() {
  const { sesion } = useSesion()
  const [datos, setDatos] = useState<DatosRegistroCliente>(VACIO)
  const [errores, setErrores] = useState<ErroresFormulario<DatosRegistroCliente>>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [correoPorConfirmar, setCorreoPorConfirmar] = useState<string | null>(null)

  if (sesion) return <Navigate to="/" replace />

  if (correoPorConfirmar) {
    return (
      <DisenoCuentas titulo="Revisa tu correo">
        <div className="confirmacion" role="status">
          <span className="confirmacion-icono">
            <Icono nombre="correo" tamano={32} />
          </span>
          <p>
            Te enviamos un enlace de confirmación a <strong>{correoPorConfirmar}</strong>. Ábrelo para activar tu cuenta.
          </p>
          <p className="texto-suave">Si no lo ves en unos minutos, revisa la carpeta de spam.</p>
          <Link to="/ingresar" className="boton boton-primario boton-ancho">
            Ir a ingresar
          </Link>
        </div>
      </DisenoCuentas>
    )
  }

  function cambiar(campo: keyof DatosRegistroCliente, valor: string) {
    setDatos((d) => ({ ...d, [campo]: valor }))
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErrorGeneral(null)

    const nuevosErrores = validarRegistroCliente(datos)
    setErrores(nuevosErrores)
    const primero = Object.keys(nuevosErrores)[0]
    if (primero) {
      document.getElementById(primero)?.focus()
      return
    }

    setEnviando(true)
    const correo = normalizarCorreo(datos.correo)
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: datos.contrasena,
      options: {
        emailRedirectTo: `${window.location.origin}/ingresar`,
        data: {
          rol: 'cliente',
          nombre: datos.nombre.trim(),
          telefono: normalizarTelefono(datos.telefono) || null,
          comuna_id: Number(datos.comunaId),
        },
      },
    })
    setEnviando(false)

    if (error) {
      setErrorGeneral(mensajeErrorAuth(error.message))
      return
    }
    // Con "Confirm email" activo, Supabase no revela si el correo ya existía: devuelve un usuario sin identidades.
    if (data.user && data.user.identities?.length === 0) {
      setErrorGeneral(mensajeErrorAuth('User already registered'))
      return
    }
    // Sin sesión = falta confirmar el correo. Con sesión, el cambio de estado redirige al inicio.
    if (!data.session) setCorreoPorConfirmar(correo)
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

      <form onSubmit={enviar} noValidate className="formulario">
        <div className="cuentas-campos-pareja">
          <Campo
            id="nombre"
            etiqueta="Nombre"
            autoComplete="name"
            value={datos.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            error={errores.nombre}
            required
          />
          <Campo
            id="telefono"
            etiqueta="Celular"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="9 1234 5678"
            value={datos.telefono}
            onChange={(e) => cambiar('telefono', e.target.value)}
            error={errores.telefono}
          />
        </div>

        <Campo
          id="correo"
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={datos.correo}
          onChange={(e) => cambiar('correo', e.target.value)}
          error={errores.correo}
          required
        />

        <div className={`campo${errores.comunaId ? ' campo-con-error' : ''}`}>
          <label htmlFor="comunaId">Comuna</label>
          <select
            id="comunaId"
            name="comunaId"
            value={datos.comunaId}
            onChange={(e) => cambiar('comunaId', e.target.value)}
            aria-invalid={errores.comunaId ? true : undefined}
            aria-describedby={errores.comunaId ? 'comunaId-error' : undefined}
            required
          >
            <option value="">Elige tu comuna</option>
            {COMUNAS_PILOTO.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {errores.comunaId && (
            <p id="comunaId-error" className="campo-error">
              <Icono nombre="alerta" tamano={16} />
              {errores.comunaId}
            </p>
          )}
        </div>

        <div className="cuentas-campos-pareja">
          <Campo
            id="contrasena"
            etiqueta="Contraseña"
            type="password"
            autoComplete="new-password"
            value={datos.contrasena}
            onChange={(e) => cambiar('contrasena', e.target.value)}
            error={errores.contrasena}
            ayuda={`Al menos ${LARGO_MINIMO_CONTRASENA} caracteres, con letras y números.`}
            required
          />
          <Campo
            id="confirmacion"
            etiqueta="Repite la contraseña"
            type="password"
            autoComplete="new-password"
            value={datos.confirmacion}
            onChange={(e) => cambiar('confirmacion', e.target.value)}
            error={errores.confirmacion}
            required
          />
        </div>

        {errorGeneral && (
          <p className="alerta-error" role="alert">
            <Icono nombre="alerta" tamano={18} />
            {errorGeneral}
          </p>
        )}

        <button type="submit" className="boton boton-primario boton-ancho" disabled={enviando} aria-busy={enviando}>
          {enviando && <span className="girador" aria-hidden="true" />}
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          {!enviando && (
            <span className="icono-flecha">
              <Icono nombre="flecha" tamano={18} />
            </span>
          )}
        </button>
      </form>

      <p className="cuentas-alterno">
        ¿Ofreces servicios de un oficio? <Link to="/registro/maestro">Regístrate como maestro</Link>
      </p>
    </DisenoCuentas>
  )
}
