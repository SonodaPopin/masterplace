import { useState, type FormEvent, type ReactNode } from 'react'
import Campo from '../../components/Campo'
import Icono from '../../components/Icono'
import { supabase } from '../../lib/supabase'
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

type Props = {
  rol: 'cliente' | 'maestro'
  /** Ruta a la que vuelve el enlace del correo de confirmación. */
  rutaTrasConfirmar: string
  textoBoton: string
  textoEnviando: string
  /** Se llama cuando Supabase pide confirmar el correo (no hay sesión todavía). */
  alPedirConfirmacion: (correo: string) => void
  /** Texto extra bajo los campos, por ejemplo el aviso de datos de prueba. */
  pie?: ReactNode
}

// Datos de la cuenta (RF-10, y paso 1 de RF-1). Crea el usuario en Supabase Auth con los datos del perfil
// como metadatos; el trigger de 20261110120000_perfil_al_registrarse.sql crea la fila en `perfiles` con ese rol.
// Si "Confirm email" está desactivado, signUp devuelve sesión y ProveedorSesion la recoge sola.
export default function FormularioCuenta({ rol, rutaTrasConfirmar, textoBoton, textoEnviando, alPedirConfirmacion, pie }: Props) {
  const [datos, setDatos] = useState<DatosRegistroCliente>(VACIO)
  const [errores, setErrores] = useState<ErroresFormulario<DatosRegistroCliente>>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

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
        emailRedirectTo: `${window.location.origin}${rutaTrasConfirmar}`,
        data: {
          rol,
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
    // Sin sesión = falta confirmar el correo. Con sesión, el cambio de estado lo maneja la pantalla que nos usa.
    if (!data.session) alPedirConfirmacion(correo)
  }

  return (
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
        <label htmlFor="comunaId">{rol === 'maestro' ? 'Comuna donde vives' : 'Comuna'}</label>
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

      {pie}

      {errorGeneral && (
        <p className="alerta-error" role="alert">
          <Icono nombre="alerta" tamano={18} />
          {errorGeneral}
        </p>
      )}

      <button type="submit" className="boton boton-primario boton-ancho" disabled={enviando} aria-busy={enviando}>
        {enviando && <span className="girador" aria-hidden="true" />}
        {enviando ? textoEnviando : textoBoton}
        {!enviando && (
          <span className="icono-flecha">
            <Icono nombre="flecha" tamano={18} />
          </span>
        )}
      </button>
    </form>
  )
}
