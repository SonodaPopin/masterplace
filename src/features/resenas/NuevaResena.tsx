import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { useSesion } from '../../lib/auth/contexto'
import { supabase, supabaseConfigurado } from '../../lib/supabase'

type Contacto = {
  id: string
  cliente_id: string
  estado: 'abierto' | 'servicio_confirmado' | 'cerrado'
}

export default function NuevaResena() {
  const { contactoId } = useParams<{ contactoId: string }>()
  const ubicacion = useLocation()
  const { usuario, cargando: cargandoSesion } = useSesion()

  const [contacto, setContacto] = useState<Contacto | null>(null)
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
      setYaExiste(false)

      const { data, error: errorContacto } = await supabase
        .from('contactos')
        .select('id, cliente_id, estado')
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

      if (contactoActual.estado !== 'servicio_confirmado') {
        setError('El servicio debe estar confirmado para publicar una reseña.')
        setCargando(false)
        return
      }

      const { data: resena, error: errorResena } = await supabase
        .from('resenas')
        .select('id')
        .eq('contacto_id', contactoId!)
        .maybeSingle()

      if (!vigente) return

      if (errorResena) {
        setError('No se pudo comprobar si el contacto ya tiene una reseña.')
      } else {
        setYaExiste(resena !== null)
      }

      setCargando(false)
    }

    void cargar()

    return () => {
      vigente = false
    }
  }, [contactoId, usuario, cargandoSesion])

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!contacto || !usuario || enviando || yaExiste) return
    if (contacto.cliente_id !== usuario.id) return
    if (contacto.estado !== 'servicio_confirmado') return

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
        calificacion,
        comentario: comentario.trim() || null,
      })

    if (errorInsertar) {
      if (errorInsertar.code === '23505') {
        setYaExiste(true)
        setError('Este contacto ya tiene una reseña.')
      } else {
        setError('No se pudo publicar la reseña. Inténtalo nuevamente.')
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

          {yaExiste && <p>Este contacto ya tiene una reseña registrada.</p>}

          {contacto &&
            contacto.cliente_id === usuario.id &&
            contacto.estado === 'servicio_confirmado' &&
            !yaExiste &&
            !error?.startsWith('No se pudo comprobar') && (
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
