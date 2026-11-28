import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Icono from '../../components/Icono'
import { supabase } from '../../lib/supabase'
import { DIAS_PLAZO_RESENA } from '../../lib/solicitudes/reglas'
import {
  ETIQUETA_ESTADO,
  MAX_DESCRIPCION,
  MAX_MOTIVO,
  accionesSolicitud,
  desdeValorLocal,
  esSolicitudActiva,
  limitesFecha,
  validarSolicitud,
  type ErroresSolicitud,
  type RolConversacion,
} from '../../lib/solicitudes/presentacion'
import {
  cancelarSolicitud,
  crearSolicitud,
  listarSolicitudes,
  marcarRealizada,
  responderSolicitud,
  traducirErrorSolicitud,
  type Solicitud,
} from './servicioSolicitudes'
import './solicitudes.css'

type Props = {
  contactoId: string
  rol: RolConversacion
  /** El contacto no está cerrado: el cliente puede crear solicitudes. */
  abierta: boolean
  nombreContraparte: string
}

// Hora de 24 h («17:30»), como se usa en Chile; con 12 h el navegador escribe «05:30 p. m.».
const FORMATO_HORA = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const FORMATO_DIA = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

/** «sábado 28 de noviembre a las 14:30». */
function mostrarFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  return `${FORMATO_DIA.format(fecha).replace(',', '')} a las ${FORMATO_HORA.format(fecha)}`
}

function mismoDia(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

/** «desde las 17:30» si es hoy; si no, «desde el sábado 28 de noviembre a las 17:30». */
function desdeCuando(fecha: Date, ahora: Date): string {
  const hora = FORMATO_HORA.format(fecha)
  return mismoDia(fecha, ahora) ? `desde las ${hora}` : `desde el ${mostrarFecha(fecha.toISOString())}`
}

// servicioSolicitudes.ts ya lanza el texto traducido para la interfaz.
function mensajeDeError(error: unknown): string {
  return error instanceof Error && error.message ? error.message : traducirErrorSolicitud('')
}

// #64 · Solicitud de servicio en el chat. El cliente la envía con la fecha acordada, el maestro la acepta o la
// rechaza y, 2 h después de la fecha, cualquiera de los dos la marca como realizada; recién ahí el cliente
// puede dejar la reseña. Las reglas las aplica la base (servicioSolicitudes.ts); aquí solo se muestran.
export default function SolicitudesServicio({ contactoId, rol, abierta, nombreContraparte }: Props) {
  const idBase = useId()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [ahora, setAhora] = useState(() => new Date())
  const [anuncio, setAnuncio] = useState('')

  // Formulario del cliente
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [fechaLocal, setFechaLocal] = useState('')
  const [errores, setErrores] = useState<ErroresSolicitud>({})
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const descripcionRef = useRef<HTMLTextAreaElement>(null)
  const fechaRef = useRef<HTMLInputElement>(null)
  const botonSolicitarRef = useRef<HTMLButtonElement>(null)
  const tituloRef = useRef<HTMLHeadingElement>(null)

  // Los botones de una tarjeta desaparecen al usarlos; el foco no debe caer al inicio de la página.
  function enfocarTarjeta(id: string) {
    window.setTimeout(() => document.getElementById(`${idBase}-tarjeta-${id}`)?.focus(), 0)
  }

  // Acciones sobre una tarjeta
  const [ocupadaId, setOcupadaId] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<{ id: string; texto: string } | null>(null)
  const [rechazandoId, setRechazandoId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [cancelandoId, setCancelandoId] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const lista = await listarSolicitudes(contactoId)
      setSolicitudes(lista)
      setErrorCarga(null)
    } catch {
      setErrorCarga('No fue posible cargar las solicitudes de servicio. Recarga la página para intentarlo otra vez.')
    } finally {
      setCargando(false)
      setAhora(new Date())
    }
  }, [contactoId])

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setSolicitudes([])
    void cargar()

    // La tarjeta se actualiza sola cuando la otra persona responde, cancela o marca realizada.
    const canal = supabase
      .channel(`solicitudes-contacto-${contactoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitudes_servicio', filter: `contacto_id=eq.${contactoId}` },
        () => {
          if (vigente) void cargar()
        },
      )
      .subscribe()

    return () => {
      vigente = false
      void supabase.removeChannel(canal)
    }
  }, [contactoId, cargar])

  // Si hay una aceptada esperando las 2 h, el botón «Marcar como realizado» aparece solo cuando llega la hora.
  const hayEspera = solicitudes.some((s) => accionesSolicitud(s, rol, ahora).realizadaDesde !== null)
  useEffect(() => {
    if (!hayEspera) return
    const intervalo = window.setInterval(() => setAhora(new Date()), 30_000)
    return () => window.clearInterval(intervalo)
  }, [hayEspera])

  function abrirFormulario() {
    setFormularioAbierto(true)
    setErrores({})
    setErrorEnvio(null)
    window.setTimeout(() => descripcionRef.current?.focus(), 0)
  }

  function cerrarFormulario() {
    setFormularioAbierto(false)
    setDescripcion('')
    setFechaLocal('')
    setErrores({})
    setErrorEnvio(null)
    window.setTimeout(() => botonSolicitarRef.current?.focus(), 0)
  }

  async function enviarSolicitud(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    const encontrados = validarSolicitud(descripcion, fechaLocal)
    setErrores(encontrados)
    setErrorEnvio(null)
    if (encontrados.descripcion) {
      descripcionRef.current?.focus()
      return
    }
    if (encontrados.fecha) {
      fechaRef.current?.focus()
      return
    }

    setEnviando(true)
    try {
      await crearSolicitud(contactoId, descripcion.trim(), desdeValorLocal(fechaLocal)!)
      setFormularioAbierto(false)
      setDescripcion('')
      setFechaLocal('')
      setAnuncio(`Solicitud enviada. ${nombreContraparte} la verá en esta conversación.`)
      await cargar()
      // El formulario desaparece: el foco vuelve al botón que lo abrió, no al inicio de la página.
      window.setTimeout(() => botonSolicitarRef.current?.focus(), 0)
    } catch (error) {
      setErrorEnvio(mensajeDeError(error))
    } finally {
      setEnviando(false)
    }
  }

  async function ejecutar(solicitud: Solicitud, accion: () => Promise<void>, textoExito: string) {
    setOcupadaId(solicitud.id)
    setErrorAccion(null)
    try {
      await accion()
      setRechazandoId(null)
      setCancelandoId(null)
      setMotivo('')
      setAnuncio(textoExito)
      await cargar()
      // La tarjeta puede pasar a «anteriores» (cerrado): el foco va al título de la sección.
      window.setTimeout(() => tituloRef.current?.focus(), 0)
    } catch (error) {
      setErrorAccion({ id: solicitud.id, texto: mensajeDeError(error) })
      enfocarTarjeta(solicitud.id)
    } finally {
      setOcupadaId(null)
    }
  }

  function textoAyuda(s: Solicitud): string {
    const acciones = accionesSolicitud(s, rol, ahora)
    switch (s.estado) {
      case 'pendiente':
        return rol === 'cliente'
          ? `Esperando que ${nombreContraparte} la acepte.`
          : '¿Puedes hacer este trabajo en esa fecha? Acéptala o recházala.'
      case 'aceptada':
        if (acciones.realizadaDesde) {
          return `Podrás marcarlo como realizado ${desdeCuando(acciones.realizadaDesde, ahora)}.`
        }
        return 'Cuando el trabajo esté hecho, márcalo como realizado.'
      case 'realizada':
        if (acciones.resenar) return `¿Cómo te fue? Tienes ${DIAS_PLAZO_RESENA} días para dejar una reseña.`
        return 'Servicio realizado.'
      case 'rechazada':
        return rol === 'cliente'
          ? `${nombreContraparte} no puede tomar este trabajo. Puedes conversarlo y enviar otra solicitud.`
          : 'Rechazaste esta solicitud.'
      case 'cancelada':
        return rol === 'cliente' ? 'Cancelaste esta solicitud.' : 'El cliente canceló esta solicitud.'
    }
  }

  function tarjeta(s: Solicitud) {
    const acciones = accionesSolicitud(s, rol, ahora)
    const ocupada = ocupadaId === s.id
    const idMotivo = `${idBase}-motivo-${s.id}`
    const idAyuda = `${idBase}-ayuda-${s.id}`

    return (
      <li key={s.id}>
        <article
          id={`${idBase}-tarjeta-${s.id}`}
          tabIndex={-1}
          className={`solicitud solicitud-${s.estado}`}
          aria-describedby={idAyuda}
          aria-busy={ocupada}
        >
          <header className="solicitud-cabecera">
            <h3 className="solicitud-titulo">
              <Icono nombre="herramienta" tamano={16} />
              Solicitud de servicio
            </h3>
            <span className={`solicitud-estado solicitud-estado-${s.estado}`}>{ETIQUETA_ESTADO[s.estado]}</span>
          </header>
          <p className="solicitud-descripcion">{s.descripcion}</p>
          <p className="solicitud-fecha">
            <Icono nombre="reloj" tamano={15} />
            <span className="solo-lector">Fecha acordada: </span>
            <time dateTime={s.fechaAcordada}>{mostrarFecha(s.fechaAcordada)}</time>
          </p>
          <p id={idAyuda} className="solicitud-ayuda">{textoAyuda(s)}</p>

          {rechazandoId === s.id ? (
            <form
              className="solicitud-rechazo"
              onSubmit={(evento) => {
                evento.preventDefault()
                void ejecutar(s, () => responderSolicitud(s.id, false, motivo.trim() || undefined), 'Rechazaste la solicitud.')
              }}
            >
              <div className="campo">
                <label htmlFor={idMotivo}>
                  Motivo <span className="campo-opcional">(opcional)</span>
                </label>
                <textarea
                  id={idMotivo}
                  value={motivo}
                  onChange={(evento) => setMotivo(evento.target.value)}
                  maxLength={MAX_MOTIVO}
                  rows={2}
                  placeholder="Por ejemplo: ese día no tengo disponibilidad."
                  autoFocus
                />
                <p className="campo-ayuda campo-contador">{motivo.length}/{MAX_MOTIVO}</p>
              </div>
              <div className="solicitud-acciones">
                <button type="submit" className="boton boton-peligro boton-chico" disabled={ocupada}>
                  {ocupada ? 'Rechazando…' : 'Rechazar solicitud'}
                </button>
                <button
                  type="button"
                  className="boton boton-fantasma boton-chico"
                  onClick={() => {
                    setRechazandoId(null)
                    setMotivo('')
                    enfocarTarjeta(s.id)
                  }}
                  disabled={ocupada}
                >
                  Volver
                </button>
              </div>
            </form>
          ) : cancelandoId === s.id ? (
            <div className="solicitud-confirmar" role="group" aria-label="Confirmar cancelación">
              <p>¿Cancelar esta solicitud? {nombreContraparte} verá que la cancelaste.</p>
              <div className="solicitud-acciones">
                <button
                  type="button"
                  className="boton boton-peligro boton-chico"
                  onClick={() => void ejecutar(s, () => cancelarSolicitud(s.id), 'Cancelaste la solicitud.')}
                  disabled={ocupada}
                  autoFocus
                >
                  {ocupada ? 'Cancelando…' : 'Sí, cancelar'}
                </button>
                <button
                  type="button"
                  className="boton boton-fantasma boton-chico"
                  onClick={() => {
                    setCancelandoId(null)
                    enfocarTarjeta(s.id)
                  }}
                  disabled={ocupada}
                >
                  No, mantenerla
                </button>
              </div>
            </div>
          ) : (
            (acciones.aceptarORechazar || acciones.cancelar || acciones.marcarRealizada || acciones.resenar) && (
              <div className="solicitud-acciones">
                {acciones.aceptarORechazar && (
                  <>
                    <button
                      type="button"
                      className="boton boton-primario boton-chico"
                      onClick={() => void ejecutar(s, () => responderSolicitud(s.id, true), 'Aceptaste la solicitud.')}
                      disabled={ocupada}
                    >
                      {ocupada ? 'Aceptando…' : 'Aceptar'}
                    </button>
                    <button
                      type="button"
                      className="boton boton-fantasma boton-chico"
                      onClick={() => {
                        setErrorAccion(null)
                        setRechazandoId(s.id)
                      }}
                      disabled={ocupada}
                    >
                      Rechazar
                    </button>
                  </>
                )}
                {acciones.marcarRealizada && (
                  <button
                    type="button"
                    className="boton boton-primario boton-chico"
                    onClick={() =>
                      void ejecutar(s, () => marcarRealizada(s.id), 'Marcaste el servicio como realizado.')
                    }
                    disabled={ocupada}
                  >
                    {ocupada ? 'Guardando…' : 'Marcar como realizado'}
                  </button>
                )}
                {acciones.resenar && (
                  <Link
                    to={`/contactos/${contactoId}/resena?solicitud=${s.id}`}
                    className="boton boton-primario boton-chico"
                  >
                    <Icono nombre="estrella" tamano={16} />
                    Dejar reseña
                  </Link>
                )}
                {acciones.cancelar && (
                  <button
                    type="button"
                    className="boton boton-fantasma boton-chico"
                    onClick={() => {
                      setErrorAccion(null)
                      setCancelandoId(s.id)
                    }}
                    disabled={ocupada}
                  >
                    Cancelar solicitud
                  </button>
                )}
              </div>
            )
          )}

          {errorAccion?.id === s.id && (
            <p className="campo-error" role="alert">
              <Icono nombre="alerta" tamano={15} />
              {errorAccion.texto}
            </p>
          )}
        </article>
      </li>
    )
  }

  const activas = solicitudes.filter((s) => esSolicitudActiva(s, rol))
  const anteriores = solicitudes.filter((s) => !esSolicitudActiva(s, rol))
  const { min, max } = limitesFecha(ahora)
  const idDescripcion = `${idBase}-descripcion`
  const idFecha = `${idBase}-fecha`

  return (
    <section className="solicitudes" aria-labelledby={`${idBase}-titulo`}>
      <div className="solicitudes-cabecera">
        <h2 id={`${idBase}-titulo`} ref={tituloRef} tabIndex={-1}>
          Servicio
        </h2>
        {rol === 'cliente' && abierta && !formularioAbierto && !cargando && !errorCarga && (
          <button
            ref={botonSolicitarRef}
            type="button"
            className="boton boton-primario boton-chico"
            onClick={abrirFormulario}
          >
            <Icono nombre="herramienta" tamano={16} />
            Solicitar servicio
          </button>
        )}
      </div>

      {cargando && <p className="texto-suave" role="status">Cargando solicitudes…</p>}

      {errorCarga && (
        <p className="alerta-error" role="alert">
          <Icono nombre="alerta" tamano={18} />
          {errorCarga}
        </p>
      )}

      {!cargando && !errorCarga && solicitudes.length === 0 && !formularioAbierto && (
        <p className="solicitudes-vacio">
          {rol === 'cliente'
            ? abierta
              ? 'Cuando acuerden el trabajo y la fecha, envíale una solicitud. Después del servicio podrás dejar una reseña.'
              : 'No hay solicitudes de servicio en esta conversación.'
            : 'Cuando el cliente te envíe una solicitud de servicio, aparecerá aquí para que la aceptes o la rechaces.'}
        </p>
      )}

      {formularioAbierto && (
        <form className="solicitud-formulario" noValidate onSubmit={(evento) => void enviarSolicitud(evento)}>
          <h3 className="solicitud-titulo">Nueva solicitud para {nombreContraparte}</h3>
          <div className={`campo${errores.descripcion ? ' campo-con-error' : ''}`}>
            <label htmlFor={idDescripcion}>¿Qué necesitas?</label>
            <textarea
              id={idDescripcion}
              ref={descripcionRef}
              value={descripcion}
              onChange={(evento) => {
                setDescripcion(evento.target.value)
                if (errores.descripcion) setErrores((e) => ({ ...e, descripcion: undefined }))
              }}
              maxLength={MAX_DESCRIPCION}
              rows={3}
              placeholder="Por ejemplo: cambiar la llave del lavamanos del baño."
              aria-invalid={errores.descripcion ? true : undefined}
              aria-describedby={`${idDescripcion}-contador${errores.descripcion ? ` ${idDescripcion}-error` : ''}`}
            />
            <p id={`${idDescripcion}-contador`} className="campo-ayuda campo-contador">
              {descripcion.length}/{MAX_DESCRIPCION}
            </p>
            {errores.descripcion && (
              <p id={`${idDescripcion}-error`} className="campo-error">
                <Icono nombre="alerta" tamano={15} />
                {errores.descripcion}
              </p>
            )}
          </div>

          <div className={`campo${errores.fecha ? ' campo-con-error' : ''}`}>
            <label htmlFor={idFecha}>Fecha y hora acordadas</label>
            <input
              id={idFecha}
              ref={fechaRef}
              type="datetime-local"
              value={fechaLocal}
              min={min}
              max={max}
              onChange={(evento) => {
                setFechaLocal(evento.target.value)
                if (errores.fecha) setErrores((e) => ({ ...e, fecha: undefined }))
              }}
              aria-invalid={errores.fecha ? true : undefined}
              aria-describedby={`${idFecha}-ayuda${errores.fecha ? ` ${idFecha}-error` : ''}`}
            />
            <p id={`${idFecha}-ayuda`} className="campo-ayuda">
              La que acordaron por el chat. Dos horas después podrán marcar el servicio como realizado.
            </p>
            {errores.fecha && (
              <p id={`${idFecha}-error`} className="campo-error">
                <Icono nombre="alerta" tamano={15} />
                {errores.fecha}
              </p>
            )}
          </div>

          {errorEnvio && (
            <p className="alerta-error" role="alert">
              <Icono nombre="alerta" tamano={18} />
              {errorEnvio}
            </p>
          )}

          <div className="solicitud-acciones">
            <button type="submit" className="boton boton-primario boton-chico" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
            <button type="button" className="boton boton-fantasma boton-chico" onClick={cerrarFormulario} disabled={enviando}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {activas.length > 0 && (
        <ul className="solicitudes-lista" aria-label="Solicitudes en curso">
          {activas.map(tarjeta)}
        </ul>
      )}

      {anteriores.length > 0 && (
        <details className="solicitudes-anteriores">
          <summary>
            Solicitudes anteriores ({anteriores.length})
          </summary>
          <ul className="solicitudes-lista">{anteriores.map(tarjeta)}</ul>
        </details>
      )}

      <p className="solo-lector" role="status" aria-live="polite">
        {anuncio}
      </p>
    </section>
  )
}
