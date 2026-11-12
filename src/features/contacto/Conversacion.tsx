import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import Icono from '../../components/Icono'
import { useSesion } from '../../lib/auth/contexto'
import { supabase, supabaseConfigurado } from '../../lib/supabase'

type EstadoContacto = 'abierto' | 'servicio_confirmado' | 'cerrado'

type Contacto = {
  id: string
  cliente_id: string
  maestro_id: string
  estado: EstadoContacto
}

type Mensaje = {
  id: number
  contacto_id: string
  emisor_id: string
  contenido: string
  enviado_en: string
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function mostrarFecha(valor: string): string {
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? '' : FORMATO_FECHA.format(fecha)
}

function mensajeErrorEnvio(mensaje: string): string {
  if (mensaje.includes('row-level security') || mensaje.includes('permission denied')) {
    return 'No puedes enviar mensajes en esta conversación. Comprueba que el contacto siga abierto y que seas participante.'
  }
  if (mensaje.includes('char_length') || mensaje.includes('check constraint')) {
    return 'El mensaje debe contener entre 1 y 2000 caracteres.'
  }
  return 'No se pudo enviar el mensaje. Inténtalo nuevamente.'
}

// RF-11 · Carga los mensajes cronológicamente y permite enviar mensajes al contacto.
// La actualización en tiempo real se incorpora en la siguiente etapa de integración.
export default function Conversacion() {
  const { contactoId } = useParams<{ contactoId: string }>()
  const ubicacion = useLocation()
  const { usuario, cargando: cargandoSesion } = useSesion()
  const [contacto, setContacto] = useState<Contacto | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const finalMensajesRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (cargandoSesion || !usuario || !contactoId || !supabaseConfigurado) return

    const usuarioActual = usuario
    let vigente = true

    async function cargarConversacion() {
      setCargando(true)
      setErrorCarga(null)
      setContacto(null)
      setMensajes([])

      try {
        const { data: contactoData, error: contactoError } = await supabase
          .from('contactos')
          .select('id, cliente_id, maestro_id, estado')
          .eq('id', contactoId)
          .maybeSingle()

        if (!vigente) return
        if (contactoError || !contactoData) {
          setErrorCarga('No encontramos esta conversación o no tienes permiso para acceder a ella.')
          setCargando(false)
          return
        }

        const contactoActual = contactoData as Contacto
        if (contactoActual.cliente_id !== usuarioActual.id && contactoActual.maestro_id !== usuarioActual.id) {
          setErrorCarga('No tienes permiso para acceder a esta conversación.')
          setCargando(false)
          return
        }

        const { data: mensajesData, error: mensajesError } = await supabase
          .from('mensajes')
          .select('id, contacto_id, emisor_id, contenido, enviado_en')
          .eq('contacto_id', contactoId)
          .order('enviado_en', { ascending: true })
          .order('id', { ascending: true })

        if (!vigente) return
        if (mensajesError) {
          setErrorCarga('No fue posible cargar los mensajes. Inténtalo nuevamente.')
          setCargando(false)
          return
        }

        setContacto(contactoActual)
        setMensajes((mensajesData ?? []) as Mensaje[])
        setCargando(false)
      } catch {
        if (!vigente) return
        setErrorCarga('Ocurrió un error de conexión al cargar la conversación.')
        setCargando(false)
      }
    }

    void cargarConversacion()
    return () => {
      vigente = false
    }
  }, [cargandoSesion, usuario, contactoId])

  useEffect(() => {
    finalMensajesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes.length])

  if (cargandoSesion) {
    return <p className="texto-suave" role="status">Comprobando tu sesión…</p>
  }

  if (!usuario) {
    return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />
  }

  if (!supabaseConfigurado) {
    return (
      <section className="conversacion aviso" role="alert">
        <Icono nombre="alerta" tamano={18} />
        Falta configurar la conexión con Supabase en este entorno.
      </section>
    )
  }

  async function enviarMensaje(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const contenido = texto.trim()
    if (!contenido || !usuario || !contacto || !contactoId || enviando) return

    if (contacto.estado !== 'abierto') {
      setErrorEnvio('Esta conversación no está abierta y no admite nuevos mensajes.')
      return
    }
    if (contenido.length > 2000) {
      setErrorEnvio('El mensaje no puede superar los 2000 caracteres.')
      return
    }

    setEnviando(true)
    setErrorEnvio(null)

    try {
      const { data, error } = await supabase
        .from('mensajes')
        .insert({
          contacto_id: contactoId,
          emisor_id: usuario.id,
          contenido,
        })
        .select('id, contacto_id, emisor_id, contenido, enviado_en')
        .single()

      if (error || !data) {
        setErrorEnvio(mensajeErrorEnvio(error?.message ?? 'respuesta vacía'))
        return
      }

      setMensajes((actuales) => [...actuales, data as Mensaje])
      setTexto('')
    } catch {
      setErrorEnvio('Ocurrió un error de conexión al enviar el mensaje.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="conversacion" aria-labelledby="conversacion-titulo">
      <header className="conversacion-encabezado">
        <div>
          <p className="conversacion-eyebrow">MasterPlace · Contacto</p>
          <h1 id="conversacion-titulo">Conversación</h1>
          <p className="texto-suave">Los mensajes de este contacto son privados para sus participantes.</p>
        </div>
        <span className={`conversacion-estado conversacion-estado-${contacto?.estado ?? 'cargando'}`}>
          {contacto?.estado === 'abierto'
            ? 'Abierta'
            : contacto?.estado === 'servicio_confirmado'
              ? 'Servicio confirmado'
              : contacto?.estado === 'cerrado'
                ? 'Cerrada'
                : 'Cargando'}
        </span>
      </header>

      {cargando && <p className="texto-suave" role="status">Cargando conversación…</p>}

      {errorCarga && (
        <div className="alerta-error" role="alert">
          <Icono nombre="alerta" tamano={18} />
          {errorCarga}
        </div>
      )}

      {!cargando && !errorCarga && (
        <>
          <ol className="conversacion-mensajes" aria-label="Mensajes de la conversación" aria-live="polite">
            {mensajes.length === 0 && (
              <li className="conversacion-vacia">
                <Icono nombre="chat" tamano={28} />
                <p>Aún no hay mensajes.</p>
                <span>Envía el primer mensaje para iniciar la conversación.</span>
              </li>
            )}
            {mensajes.map((mensaje) => {
              const propio = mensaje.emisor_id === usuario.id
              return (
                <li key={mensaje.id} className={`conversacion-fila${propio ? ' conversacion-fila-propia' : ''}`}>
                  <article className={`conversacion-burbuja${propio ? ' conversacion-burbuja-propia' : ''}`}>
                    <p>{mensaje.contenido}</p>
                    <time dateTime={mensaje.enviado_en}>{mostrarFecha(mensaje.enviado_en)}</time>
                  </article>
                </li>
              )
            })}
            <li ref={finalMensajesRef} aria-hidden="true" className="conversacion-final" />
          </ol>

          {contacto?.estado === 'abierto' ? (
            <form className="conversacion-formulario" onSubmit={enviarMensaje}>
              <label className="solo-lector" htmlFor="mensaje-contenido">Escribe un mensaje</label>
              <textarea
                id="mensaje-contenido"
                value={texto}
                onChange={(evento) => {
                  setTexto(evento.target.value)
                  if (errorEnvio) setErrorEnvio(null)
                }}
                placeholder="Escribe tu mensaje…"
                rows={3}
                maxLength={2000}
                disabled={enviando}
                required
              />
              <div className="conversacion-acciones">
                <span className="texto-suave">{texto.length}/2000</span>
                <button type="submit" className="boton boton-primario" disabled={enviando || !texto.trim()}>
                  {enviando ? <span className="girador" aria-hidden="true" /> : <Icono nombre="flecha" tamano={17} />}
                  {enviando ? 'Enviando…' : 'Enviar mensaje'}
                </button>
              </div>
              {errorEnvio && <p className="alerta-error" role="alert">{errorEnvio}</p>}
            </form>
          ) : (
            <p className="aviso" role="status">
              Esta conversación no está abierta. Puedes consultar el historial, pero no enviar mensajes nuevos.
            </p>
          )}
        </>
      )}
    </section>
  )
}

