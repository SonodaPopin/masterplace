import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useSesion } from '../../lib/auth/contexto'
import { supabase, supabaseConfigurado } from '../../lib/supabase'
import { DIAS_PLAZO_RESENA } from '../../lib/solicitudes/reglas'
import { listarSolicitudes, type Solicitud } from '../solicitudes/servicioSolicitudes'

type Contacto = {
  id: string
  cliente_id: string
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeStyle: 'short', hourCycle: 'h23' })

// Errores del trigger de la migración de cambio de Ignacio (20261124000000_resena_exige_solicitud.sql).
const ERRORES_RESENA: Record<string, string> = {
  RESENA_SIN_SOLICITUD: 'La reseña tiene que ser de un servicio realizado.',
  RESENA_SOLICITUD_INVALIDA: 'No encontramos ese servicio en esta conversación.',
  RESENA_SOLO_CLIENTE: 'Solo el cliente puede publicar una reseña.',
  RESENA_SOLICITUD_NO_REALIZADA: 'Podrás dejar la reseña cuando el servicio esté marcado como realizado.',
  RESENA_FUERA_DE_PLAZO: `Pasaron más de ${DIAS_PLAZO_RESENA} días desde el servicio; ya no se puede dejar una reseña.`,
}

function mensajeErrorResena(mensaje: string): string {
  for (const [codigo, texto] of Object.entries(ERRORES_RESENA)) {
    if (mensaje.includes(codigo)) return texto
  }
  return 'No se pudo publicar la reseña. Inténtalo nuevamente.'
}

// #64: la reseña es de una solicitud de servicio realizada (?solicitud=<id>), no de la conversación.
export default function NuevaResena() {
  const { contactoId } = useParams<{ contactoId: string }>()
  const [parametros] = useSearchParams()
  const solicitudId = parametros.get('solicitud')
  const ubicacion = useLocation()
  const { usuario, cargando: cargandoSesion } = useSesion()

  const [contacto, setContacto] = useState<Contacto | null>(null)
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [calificacion, setCalificacion] = useState(5)
  const [comentario, setComentario] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [publicada, setPublicada] = useState(false)
  const [yaExiste, setYaExiste] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cargandoSesion || !usuario || !contactoId || !supabaseConfigurado) return

    let vigente = true

    async function cargar() {
      setCargando(true)
      setError(null)
      setContacto(null)
      setSolicitud(null)
      setYaExiste(false)

      const { data, error: errorContacto } = await supabase
        .from('contactos')
        .select('id, cliente_id')
        .eq('id', contactoId!)
        .maybeSingle()

      if (!vigente) return

      if (errorContacto || !data) {
        setError('No se pudo encontrar el contacto.')
        setCargando(false)
        return
      }

      const contactoActual = data as Contacto
      setContacto(contactoActual)

      if (contactoActual.cliente_id !== usuario!.id) {
        setError('Solo el cliente puede publicar una reseña.')
        setCargando(false)
        return
      }

      if (!solicitudId) {
        setError('Para dejar una reseña, abre la conversación y toca «Dejar reseña» en el servicio realizado.')
        setCargando(false)
        return
      }

      let solicitudes: Solicitud[]
      try {
        solicitudes = await listarSolicitudes(contactoId!)
      } catch {
        if (!vigente) return
        setError('No se pudo comprobar el servicio. Inténtalo nuevamente.')
        setCargando(false)
        return
      }
      if (!vigente) return

      const actual = solicitudes.find((s) => s.id === solicitudId) ?? null
      setSolicitud(actual)

      if (!actual) {
        setError(ERRORES_RESENA.RESENA_SOLICITUD_INVALIDA)
      } else if (actual.estado !== 'realizada') {
        setError(ERRORES_RESENA.RESENA_SOLICITUD_NO_REALIZADA)
      } else if (!actual.puedeResenar) {
        // Ya tiene reseña o pasó el plazo de 30 días.
        const { data: resena } = await supabase
          .from('resenas')
          .select('id')
          .eq('solicitud_id', actual.id)
          .maybeSingle()
        if (!vigente) return
        if (resena) setYaExiste(true)
        else setError(ERRORES_RESENA.RESENA_FUERA_DE_PLAZO)
      }

      setCargando(false)
    }

    void cargar()

    return () => {
      vigente = false
    }
  }, [contactoId, solicitudId, usuario, cargandoSesion])

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!contacto || !solicitud || !usuario || enviando || yaExiste) return
    if (contacto.cliente_id !== usuario.id || !solicitud.puedeResenar) return

    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
      setError('Selecciona una calificación entre 1 y 5.')
      return
    }

    if (comentario.length > 1000) {
      setError('El comentario no puede superar los 1000 caracteres.')
      return
    }

    setEnviando(true)
    setError(null)

    const { error: errorInsertar } = await supabase
      .from('resenas')
      .insert({
        contacto_id: contacto.id,
        solicitud_id: solicitud.id,
        calificacion,
        comentario: comentario.trim() || null,
      })

    if (errorInsertar) {
      if (errorInsertar.code === '23505') {
        setYaExiste(true)
      } else {
        setError(mensajeErrorResena(errorInsertar.message))
      }
    } else {
      setPublicada(true)
    }

    setEnviando(false)
  }

  if (cargandoSesion) {
    return <p>Cargando sesión…</p>
  }

  if (!usuario) {
    return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />
  }

  if (!contactoId) {
    return <p>No se especificó un contacto válido.</p>
  }

  if (!supabaseConfigurado) {
    return <p>Falta configurar la conexión con Supabase.</p>
  }

  return (
    <section className="resena-pagina">
      <h1>Nueva reseña</h1>

      {cargando ? (
        <p>Cargando información del contacto…</p>
      ) : publicada ? (
        <div role="status">
          <h2>¡Reseña publicada!</h2>
          <p>Tu calificación se registró correctamente.</p>
          <Link to={`/contactos/${contactoId}`}>Volver a la conversación</Link>
        </div>
      ) : (
        <>
          {error && <p className="alerta-error" role="alert">{error}</p>}

          {yaExiste && <p>Ya dejaste una reseña para este servicio. ¡Gracias!</p>}

          {solicitud && (
            <p className="texto-suave">
              Servicio: <strong>{solicitud.descripcion}</strong> ·{' '}
              <time dateTime={solicitud.fechaAcordada}>{FORMATO_FECHA.format(new Date(solicitud.fechaAcordada))}</time>
            </p>
          )}

          {contacto &&
            solicitud?.puedeResenar &&
            contacto.cliente_id === usuario.id &&
            !yaExiste && (
              <form onSubmit={(evento) => void publicar(evento)}>
                <fieldset disabled={enviando}>
                  <legend>Calificación del servicio</legend>

                  <div className="resena-estrellas">
                    {[1, 2, 3, 4, 5].map((valor) => (
                      <label key={valor}>
                        <input
                          type="radio"
                          name="calificacion"
                          value={valor}
                          checked={calificacion === valor}
                          onChange={() => setCalificacion(valor)}
                        />
                        {valor} {valor === 1 ? 'estrella' : 'estrellas'}
                      </label>
                    ))}
                  </div>

                  <label htmlFor="resena-comentario">Comentario (opcional)</label>
                  <textarea
                    id="resena-comentario"
                    value={comentario}
                    onChange={(evento) => setComentario(evento.target.value)}
                    maxLength={1000}
                    rows={5}
                    placeholder="Describe tu experiencia con el servicio…"
                  />

                  <p>{comentario.length}/1000 caracteres</p>

                  <button className="boton boton-primario" type="submit">
                    {enviando ? 'Publicando…' : 'Publicar reseña'}
                  </button>
                </fieldset>
              </form>
            )}

          <p>
            <Link to={`/contactos/${contactoId}`}>
              Volver a la conversación
            </Link>
          </p>
        </>
      )}
    </section>
  )
}
