import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icono from '../../components/Icono'
import DisenoCuentas from './DisenoCuentas'
import FormularioCuenta from './FormularioCuenta'
import PasoCedulaMaestro from './PasoCedulaMaestro'
import PasoPerfilMaestro from './PasoPerfilMaestro'
import RevisaTuCorreo from './RevisaTuCorreo'
import { supabase, supabaseConfigurado } from '../../lib/supabase'
import { useSesion } from '../../lib/auth/contexto'
import type { DatosPerfilMaestro } from '../../lib/maestros/validacion'

type EstadoIdentidad = 'pendiente' | 'verificada' | 'rechazada'

type Vista =
  | { tipo: 'cargando' }
  | { tipo: 'intro' }
  | { tipo: 'cuenta' }
  | { tipo: 'revisarCorreo'; correo: string }
  | { tipo: 'noEsMaestro' }
  | { tipo: 'errorCarga' }
  | { tipo: 'perfil'; maestroCreado: boolean }
  | { tipo: 'cedula'; renovacion?: boolean }
  | { tipo: 'listo'; estado: EstadoIdentidad; identidadVenceEn: string | null }

const RUTA = '/registro/maestro'
const TOTAL_PASOS = 3

// Si recarga mientras espera el correo de confirmación, vuelve a ver «Revisa tu correo» y no el formulario vacío.
// Solo el correo (nada sensible) y solo en esta pestaña.
const CLAVE_CORREO = 'masterplace.registroMaestro.correo'
function leerCorreoPendiente(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_CORREO)
  } catch {
    return null
  }
}
function guardarCorreoPendiente(correo: string | null) {
  try {
    if (correo) sessionStorage.setItem(CLAVE_CORREO, correo)
    else sessionStorage.removeItem(CLAVE_CORREO)
  } catch {
    // Sin almacenamiento (modo privado): solo se pierde el aviso al recargar.
  }
}

// Dónde quedó el maestro: sin fila en `maestros` → paso 2; sin cédula → paso 3; con ambas → estado.
// Así, si cierra la página a mitad de camino, al volver retoma donde quedó.
async function cargarProgreso(maestroId: string): Promise<Vista> {
  const [maestro, cedula] = await Promise.all([
    supabase
      .from('maestros')
      .select('estado_identidad, identidad_vence_en')
      .eq('id', maestroId)
      .maybeSingle(),
    supabase
      .from('documentos')
      .select('id')
      .eq('maestro_id', maestroId)
      .eq('tipo', 'cedula')
      .limit(1),
  ])

  if (maestro.error || cedula.error) return { tipo: 'errorCarga' }

  if (!maestro.data) return { tipo: 'perfil', maestroCreado: false }

  const estado = maestro.data.estado_identidad as EstadoIdentidad
const vencimiento = maestro.data.identidad_vence_en

if (
  estado === 'verificada' &&
  (!vencimiento || Date.parse(vencimiento) <= Date.now())
) {
  return { tipo: 'cedula', renovacion: true }
}

if (!cedula.data.length) return { tipo: 'cedula' }

return {
  tipo: 'listo',
  estado,
  identidadVenceEn: vencimiento,
}
}

// RF-1 · Registro de maestro en 3 pasos (RNF-3): 1 cuenta, 2 oficio y comunas, 3 cédula. Responsable: Gabriel.
// Resultado: perfil «pendiente de verificación», que no aparece en búsquedas hasta que un admin lo apruebe.
export default function RegistroMaestro() {
  const { cargando, usuario, rol } = useSesion()
  const maestroId = usuario?.id ?? null
  const comunaHogar = Number(usuario?.user_metadata?.comuna_id) || null

  const [vista, setVista] = useState<Vista>({ tipo: 'cargando' })
  const [datosPerfil, setDatosPerfil] = useState<DatosPerfilMaestro | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (cargando) return
    if (!maestroId) {
      // Sin sesión: primero «Antes de empezar» (H-01), salvo que ya esté en el formulario o esperando el correo.
      setVista((v) => {
        if (v.tipo === 'revisarCorreo' || v.tipo === 'cuenta') return v
        const correo = leerCorreoPendiente()
        return correo ? { tipo: 'revisarCorreo', correo } : { tipo: 'intro' }
      })
      return
    }
    guardarCorreoPendiente(null)
    if (rol !== 'maestro') {
      setVista({ tipo: 'noEsMaestro' })
      return
    }
    let activo = true
    setVista({ tipo: 'cargando' })
    cargarProgreso(maestroId).then((v) => {
      if (activo) setVista(v)
    })
    return () => {
      activo = false
    }
  }, [cargando, maestroId, rol, intento])

  // Mueve el foco al título al cambiar de paso, para que el lector de pantalla anuncie el nuevo paso.
  useEffect(() => {
    if (vista.tipo !== 'cargando') document.getElementById('titulo-cuenta')?.focus()
  }, [vista.tipo])

  if (vista.tipo === 'cargando') {
    return (
      <div className="cargando-pantalla" role="status">
        <span className="girador girador-oscuro" aria-hidden="true" />
        Cargando tu registro…
      </div>
    )
  }

  if (vista.tipo === 'intro') {
    return (
      <DisenoCuentas
        publico="maestro"
        titulo="Ofrece tus servicios en MasterPlace"
        subtitulo="Son 3 pasos y toman unos 5 minutos. Puedes dejarlo a medias: lo que guardes no se pierde."
      >
        <AntesDeEmpezar alEmpezar={() => setVista({ tipo: 'cuenta' })} />
      </DisenoCuentas>
    )
  }

  if (vista.tipo === 'cuenta') {
    return (
      <DisenoCuentas
        publico="maestro"
        titulo="Crea tu cuenta de maestro"
        subtitulo={
          <>
            ¿Ya tienes una? <Link to="/ingresar">Ingresa</Link>
          </>
        }
        pasoActual={1}
        pasoTotal={TOTAL_PASOS}
        nombrePaso="Tus datos"
      >
        {!supabaseConfigurado && (
          <p className="aviso" role="note">
            <Icono nombre="alerta" tamano={18} />
            Falta configurar Supabase en <code>.env.local</code>; el registro no funcionará en este entorno.
          </p>
        )}
        <FormularioCuenta
          rol="maestro"
          rutaTrasConfirmar={RUTA}
          textoBoton="Crear cuenta y continuar"
          textoEnviando="Creando cuenta…"
          alPedirConfirmacion={(correo) => {
            guardarCorreoPendiente(correo)
            setVista({ tipo: 'revisarCorreo', correo })
          }}
        />
        <p className="cuentas-alterno">
          ¿Buscas un maestro? <Link to="/registro/cliente">Crea una cuenta de cliente</Link>
        </p>
      </DisenoCuentas>
    )
  }

  if (vista.tipo === 'revisarCorreo') {
    return (
      <DisenoCuentas publico="maestro" titulo="Revisa tu correo" pasoActual={1} pasoTotal={TOTAL_PASOS}>
        <RevisaTuCorreo
          correo={vista.correo}
          siguiente="Al abrir el enlace volverás aquí para completar los pasos 2 y 3: tu oficio, tu RUT y tu cédula."
        />
        <p className="cuentas-alterno">
          ¿Te equivocaste de correo?{' '}
          <button
            type="button"
            className="enlace-boton"
            onClick={() => {
              guardarCorreoPendiente(null)
              setVista({ tipo: 'cuenta' })
            }}
          >
            Crear la cuenta con otro correo
          </button>
        </p>
      </DisenoCuentas>
    )
  }

  if (vista.tipo === 'noEsMaestro') {
    return (
      <DisenoCuentas publico="maestro" titulo="Tu cuenta es de cliente">
        <div className="confirmacion">
          <span className="confirmacion-icono">
            <Icono nombre="usuarioVerificado" tamano={32} />
          </span>
          <p>
            Ingresaste con una cuenta de cliente. Para ofrecer servicios necesitas una cuenta de maestro con otro
            correo.
          </p>
          <Link to="/" className="boton boton-primario boton-ancho">
            Ir a buscar maestros
          </Link>
        </div>
      </DisenoCuentas>
    )
  }

  if (vista.tipo === 'errorCarga') {
    return (
      <DisenoCuentas publico="maestro" titulo="No pudimos cargar tu registro">
        <p className="alerta-error" role="alert">
          <Icono nombre="alerta" tamano={18} />
          Revisa tu conexión e inténtalo de nuevo.
        </p>
        <button type="button" className="boton boton-primario boton-ancho" onClick={() => setIntento((n) => n + 1)}>
          Reintentar
        </button>
      </DisenoCuentas>
    )
  }

  if (vista.tipo === 'perfil' && maestroId) {
    return (
      <DisenoCuentas
        publico="maestro"
        titulo="Tu oficio y dónde trabajas"
        subtitulo="Esto es lo que verán los clientes en tu perfil."
        pasoActual={2}
        pasoTotal={TOTAL_PASOS}
        nombrePaso="Oficio y comunas"
      >
        <PasoPerfilMaestro
          maestroId={maestroId}
          comunaHogarId={comunaHogar}
          maestroCreado={vista.maestroCreado}
          inicial={datosPerfil}
          alGuardar={(datos) => {
            setDatosPerfil(datos)
            setVista({ tipo: 'cedula' })
          }}
        />
      </DisenoCuentas>
    )
  }

  if (vista.tipo === 'cedula' && maestroId) {
    return (
      <DisenoCuentas
        publico="maestro"
        titulo={vista.renovacion ? 'Renueva tu identidad' : 'Verifica tu identidad'}
        subtitulo={
          vista.renovacion
            ? 'Tu verificación anterior venció. Sube una nueva cédula para volver a ofrecer tus servicios.'
            : 'Revisamos tu RUT y tu cédula para que los clientes sepan que eres quien dices ser.'
        }
        pasoActual={3}
        pasoTotal={TOTAL_PASOS}
        nombrePaso="RUT y cédula"
      >
        <PasoCedulaMaestro
          maestroId={maestroId}
          renovacion={vista.renovacion ?? false}
          // El paso 2 carga lo guardado si no viene de esta visita, así que siempre se puede volver (salvo al renovar).
          alVolver={vista.renovacion ? undefined : () => setVista({ tipo: 'perfil', maestroCreado: true })}
          alTerminar={() =>
            setVista({
              tipo: 'listo',
              estado: 'pendiente',
              identidadVenceEn: null,
            })
          }
        />
      </DisenoCuentas>
    )
  }

  if (vista.tipo === 'listo') {
    return (
      <DisenoCuentas publico="maestro" titulo={TITULO_ESTADO[vista.estado]}>
        <EstadoRegistro
          estado={vista.estado}
          identidadVenceEn={vista.identidadVenceEn}
          alSubirOtra={() => setVista({ tipo: 'cedula' })}
        />
      </DisenoCuentas>
    )
  }

  // Hay vista de paso pero se cerró la sesión en otra pestaña: ProveedorSesion actualiza y el efecto la corrige.
  return null
}

// H-01 (validación de E3): un maestro no encontró dónde inscribirse ni qué le iban a pedir. Antes del paso 1 se
// dice qué tener a mano, cuáles son los pasos y qué pasa después.
function AntesDeEmpezar({ alEmpezar }: { alEmpezar: () => void }) {
  return (
    <div className="registro-intro">
      <section aria-labelledby="intro-necesitas">
        <h2 id="intro-necesitas">Ten a mano</h2>
        <ul className="registro-intro-lista">
          <li>
            <Icono nombre="documento" tamano={20} />
            <span>
              <strong>Tu cédula de identidad</strong> para sacarle una foto por delante.
            </span>
          </li>
          <li>
            <Icono nombre="usuarioVerificado" tamano={20} />
            <span>
              <strong>Tu RUT.</strong> No aparece en tu perfil.
            </span>
          </li>
          <li>
            <Icono nombre="correo" tamano={20} />
            <span>
              <strong>Un correo</strong> para entrar a tu cuenta. El celular es opcional.
            </span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="intro-pasos">
        <h2 id="intro-pasos">Los 3 pasos</h2>
        <ol className="registro-intro-pasos">
          <li>
            <span>
              <strong>Tus datos:</strong> nombre, correo, celular y una contraseña.
            </span>
          </li>
          <li>
            <span>
              <strong>Tu oficio</strong> y las comunas donde trabajas.
            </span>
          </li>
          <li>
            <span>
              <strong>Tu RUT y la foto de tu cédula.</strong>
            </span>
          </li>
        </ol>
      </section>

      <section aria-labelledby="intro-despues" className="registro-intro-despues">
        <h2 id="intro-despues">¿Qué pasa después?</h2>
        <p>
          Un administrador de MasterPlace revisa tu cédula. Mientras tanto tu perfil no aparece en las búsquedas; cuando
          la aprueba, los clientes de tus comunas ya pueden encontrarte y escribirte. Tu cédula se borra apenas se
          aprueba.
        </p>
      </section>

      <button type="button" className="boton boton-primario boton-ancho" onClick={alEmpezar}>
        Empezar registro
        <span className="icono-flecha">
          <Icono nombre="flecha" tamano={18} />
        </span>
      </button>
      <p className="cuentas-alterno">
        ¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link> y sigue donde quedaste.
      </p>
    </div>
  )
}

const TITULO_ESTADO: Record<EstadoIdentidad, string> = {
  pendiente: 'Tu perfil está pendiente de verificación',
  verificada: 'Tu identidad está verificada',
  rechazada: 'No pudimos verificar tu cédula',
}

function EstadoRegistro({estado, identidadVenceEn, alSubirOtra,}: {
  estado: EstadoIdentidad
  identidadVenceEn: string | null
  alSubirOtra: () => void
}) {
  if (estado === 'rechazada') {
    return (
      <div className="confirmacion" role="status">
        <span className="confirmacion-icono confirmacion-icono-error">
          <Icono nombre="alerta" tamano={32} />
        </span>
        <p>La imagen no permitió confirmar tu identidad. Sube una foto nítida de la cédula por delante.</p>
        <button type="button" className="boton boton-primario boton-ancho" onClick={alSubirOtra}>
          Subir otra foto
        </button>
      </div>
    )
  }

  const verificada = estado === 'verificada'
  return (
    <div className="confirmacion" role="status">
      <span className={`confirmacion-icono${verificada ? '' : ' confirmacion-icono-pendiente'}`}>
        <Icono nombre={verificada ? 'escudo' : 'reloj'} tamano={32} />
      </span>
      <p>
        {verificada
          ? 'Ya apareces en las búsquedas de los clientes de tus comunas.'
          : 'Recibimos tus datos. Un administrador revisará tu cédula; mientras tanto tu perfil no aparece en las búsquedas.'}
      </p>

          {verificada && identidadVenceEn && (
            <p>
              Tu identidad está vigente hasta el{' '}
              <strong>
                {new Date(identidadVenceEn).toLocaleDateString('es-CL')}
              </strong>.
            </p>
          )}

      <ol className="sellos" aria-label="Sellos de confianza">
        <li className={verificada ? 'sello sello-ok' : 'sello sello-pendiente'}>
          <Icono nombre={verificada ? 'escudo' : 'reloj'} tamano={18} />
          <span>
            <strong>Identidad</strong> {verificada ? 'verificada' : 'en revisión'}
          </span>
        </li>
        <li className="sello">
          <Icono nombre="estrella" tamano={18} />
          <span>
            <strong>Reputación</strong> con tus primeras reseñas
          </span>
        </li>
        <li className="sello">
          <Icono nombre="herramienta" tamano={18} />
          <span>
            <strong>Certificación</strong> opcional, más adelante
          </span>
        </li>
      </ol>

      {!verificada && <p className="texto-suave">Tu cédula se elimina de nuestros sistemas en cuanto se aprueba.</p>}
      <Link to="/" className="boton boton-primario boton-ancho">
        Ir al inicio
      </Link>
    </div>
  )
}
