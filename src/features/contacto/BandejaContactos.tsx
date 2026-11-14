import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Icono from '../../components/Icono'
import { useSesion } from '../../lib/auth/contexto'
import { supabase, supabaseConfigurado } from '../../lib/supabase'
import './bandejaContactos.css'

type EstadoContacto = 'abierto' | 'servicio_confirmado' | 'cerrado'
type EstadoRealtime = 'conectando' | 'conectado' | 'desconectado'

type ResumenContacto = {
  contacto_id: string
  contraparte_id: string
  nombre_contraparte: string
  rol_contraparte: 'cliente' | 'maestro' | 'admin' | string
  estado: EstadoContacto
  creado_en: string
  ultimo_mensaje: string | null
  ultimo_mensaje_en: string | null
  ultimo_mensaje_emisor_id: string | null
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function mostrarFecha(valor: string | null): string {
  if (!valor) return ''
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? '' : FORMATO_FECHA.format(fecha)
}

function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  return `${palabras[0]?.[0] ?? '?'}${palabras.length > 1 ? palabras[palabras.length - 1][0] : ''}`.toUpperCase()
}

function nombreRol(rol: string): string {
  if (rol === 'cliente') return 'Cliente'
  if (rol === 'maestro') return 'Maestro'
  return 'Participante'
}

function etiquetaEstado(estado: EstadoContacto): string {
  if (estado === 'abierto') return 'Abierta'
  if (estado === 'servicio_confirmado') return 'Servicio confirmado'
  return 'Cerrada'
}

// RF-11 · Bandeja privada: cada usuario ve sus contactos y el nombre de la contraparte.
// El RPC respeta RLS (SECURITY INVOKER) y no devuelve correo ni teléfono.
export default function BandejaContactos() {
  const ubicacion = useLocation()
  const { usuario, rol, cargando: cargandoSesion } = useSesion()
  const [contactos, setContactos] = useState<ResumenContacto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estadoRealtime, setEstadoRealtime] = useState<EstadoRealtime>('conectando')

  useEffect(() => {
    if (cargandoSesion || !usuario || !supabaseConfigurado) return

    let vigente = true
    let solicitudActual = 0

    async function cargarBandeja() {
      const solicitud = ++solicitudActual
      const { data, error: errorConsulta } = await supabase.rpc('bandeja_contactos')
      // Ignora respuestas antiguas si varios eventos llegan casi al mismo tiempo.
      if (!vigente || solicitud !== solicitudActual) return

      if (errorConsulta) {
        setError('No fue posible cargar tus conversaciones. Comprueba que la migración de la bandeja esté aplicada.')
        setCargando(false)
        return
      }

      setContactos((data ?? []) as ResumenContacto[])
      setError(null)
      setCargando(false)
    }

    // Carga inicial; la consulta reemplaza el estado completo, por lo que repetirla
    // después de reconectar no agrega mensajes o conversaciones duplicadas.
    void cargarBandeja()

    const canal = supabase
      .channel(`bandeja-contactos-${usuario.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contactos' },
        () => {
          if (vigente) void cargarBandeja()
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes' },
        () => {
          if (vigente) void cargarBandeja()
        },
      )
      .subscribe((status) => {
        if (!vigente) return
        if (status === 'SUBSCRIBED') {
          setEstadoRealtime('conectado')
          // Recupera nuevos contactos/mensajes que pudieran llegar durante una desconexión.
          void cargarBandeja()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setEstadoRealtime('desconectado')
        }
      })

    return () => {
      vigente = false
      void supabase.removeChannel(canal)
    }
  }, [cargandoSesion, usuario])

  if (cargandoSesion) {
    return <p className="texto-suave" role="status">Comprobando tu sesión…</p>
  }

  if (!usuario) {
    return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />
  }

  if (rol !== 'cliente' && rol !== 'maestro') {
    return (
      <section className="bandeja-contactos" role="status">
        <h1>Mensajes</h1>
        <p>La bandeja de conversaciones está disponible para cuentas de cliente y maestro.</p>
      </section>
    )
  }

  if (!supabaseConfigurado) {
    return (
      <section className="bandeja-contactos" role="alert">
        <div className="alerta-error">
          <Icono nombre="alerta" tamano={18} />
          Falta configurar la conexión con Supabase en este entorno.
        </div>
      </section>
    )
  }

  return (
    <section className="bandeja-contactos" aria-labelledby="bandeja-titulo">
      <header className="bandeja-encabezado">
        <div>
          <p className="bandeja-eyebrow"><Icono nombre="chat" tamano={16} /> MasterPlace · Mensajes</p>
          <h1 id="bandeja-titulo">Tus conversaciones</h1>
          <p className="texto-suave">Aquí puedes ver quién te escribió y continuar tus conversaciones.</p>
        </div>
        <span className={`bandeja-realtime bandeja-realtime-${estadoRealtime}`} role="status" aria-live="polite">
          <span aria-hidden="true" />
          {estadoRealtime === 'conectado'
            ? 'Actualización en tiempo real'
            : estadoRealtime === 'desconectado'
              ? 'Reconectando…'
              : 'Conectando…'}
        </span>
      </header>

      {error && <div className="alerta-error" role="alert"><Icono nombre="alerta" tamano={18}/>{error}</div>}

      {cargando ? (
        <div className="bandeja-vacia" role="status">
          <span className="bandeja-vacia-icono"><Icono nombre="reloj" tamano={26}/></span>
          <p>Cargando conversaciones…</p>
        </div>
      ) : !error && contactos.length === 0 ? (
        <div className="bandeja-vacia">
          <span className="bandeja-vacia-icono"><Icono nombre="chat" tamano={28}/></span>
          <h2>Aún no tienes conversaciones</h2>
          <p>Cuando contactes a un maestro o alguien te escriba, la conversación aparecerá aquí.</p>
          <Link className="boton boton-primario" to="/">Buscar maestros</Link>
        </div>
      ) : (
        <ul className="bandeja-lista" aria-label="Lista de conversaciones">
          {contactos.map((contacto) => {
            const nombre = contacto.nombre_contraparte || nombreRol(contacto.rol_contraparte)
            const vistaMensaje = contacto.ultimo_mensaje
              ? `${contacto.ultimo_mensaje_emisor_id === usuario.id ? 'Tú: ' : ''}${contacto.ultimo_mensaje}`
              : 'Aún no hay mensajes. Abre la conversación para iniciar.'

            return (
              <li key={contacto.contacto_id}>
                <Link className="bandeja-item" to={`/contactos/${contacto.contacto_id}`}>
                  <span className="bandeja-avatar" aria-hidden="true">{iniciales(nombre)}</span>
                  <span className="bandeja-contenido">
                    <span className="bandeja-fila-superior">
                      <span className="bandeja-nombre">{nombre}</span>
                      <span className="bandeja-fecha">{mostrarFecha(contacto.ultimo_mensaje_en ?? contacto.creado_en)}</span>
                    </span>
                    <span className="bandeja-rol">{nombreRol(contacto.rol_contraparte)}</span>
                    <span className={`bandeja-preview${contacto.ultimo_mensaje ? '' : ' bandeja-preview-vacio'}`}>
                      {vistaMensaje}
                    </span>
                    <span className="bandeja-fila-inferior">
                      <span className={`bandeja-estado bandeja-estado-${contacto.estado}`}>
                        {etiquetaEstado(contacto.estado)}
                      </span>
                      <span className="bandeja-abrir">Abrir conversación <Icono nombre="flecha" tamano={15}/></span>
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
