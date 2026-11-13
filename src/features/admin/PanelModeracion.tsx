import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import Icono from '../../components/Icono'
import { useSesion } from '../../lib/auth/contexto'
import { supabaseConfigurado } from '../../lib/supabase'
import { COMUNAS_PILOTO } from '../../lib/catalogos/comunas'
import {
  diasEsperando,
  MOTIVO_MAX,
  SEGUNDOS_URL_FIRMADA,
  textoEspera,
  tipoArchivo,
  validarMotivo,
} from '../../lib/moderacion/moderacion'
import {
  aprobarIdentidad,
  listarPendientes,
  obtenerRolReal,
  rechazarIdentidad,
  urlFirmadaCedula,
  type MaestroPendiente,
} from './api'

// RF-2 · RF-8 · Panel de moderación: el administrador revisa la cédula de cada maestro pendiente y la aprueba
// o la rechaza con motivo. Responsable: Diego.

type Acceso = 'verificando' | 'admin' | 'denegado' | 'error'

function nombreComuna(id: number | null): string {
  return COMUNAS_PILOTO.find((c) => c.id === id)?.nombre ?? 'Comuna sin indicar'
}

export default function PanelModeracion() {
  const { cargando, sesion, usuario } = useSesion()
  const [acceso, setAcceso] = useState<Acceso>('verificando')

  // El acceso se decide con `perfiles.rol`, no con los metadatos de la sesión (el usuario puede editarlos).
  // Igual la protección real está en RLS: esta comprobación solo evita mostrar una pantalla inútil.
  useEffect(() => {
    if (!usuario) return
    let activo = true
    obtenerRolReal(usuario.id)
      .then((rol) => activo && setAcceso(rol === 'admin' ? 'admin' : 'denegado'))
      .catch(() => activo && setAcceso('error'))
    return () => {
      activo = false
    }
  }, [usuario])

  if (cargando) return <p className="texto-suave" aria-live="polite">Cargando sesión…</p>
  if (!sesion || !usuario) return <Navigate to="/ingresar" replace state={{ desde: '/admin' }} />

  return (
    <section className="moderacion" aria-labelledby="titulo-moderacion">
      <p className="chip">Administración · RF-2 · RF-8</p>
      <h1 id="titulo-moderacion">Panel de moderación</h1>
      <p className="texto-suave">
        Maestros que subieron su cédula y esperan verificación. Al aprobar, la cédula se borra y el maestro aparece en
        la búsqueda.
      </p>

      {!supabaseConfigurado && (
        <p className="aviso" role="note">
          <Icono nombre="alerta" tamano={18} />
          Falta configurar Supabase en <code>.env.local</code>; el panel no podrá cargar datos.
        </p>
      )}

      {acceso === 'verificando' && <p className="texto-suave" aria-live="polite">Verificando permisos…</p>}
      {acceso === 'denegado' && (
        <p className="alerta-error" role="alert">
          <Icono nombre="alerta" tamano={18} />
          Esta sección es solo para administración.
        </p>
      )}
      {acceso === 'error' && (
        <p className="alerta-error" role="alert">
          <Icono nombre="alerta" tamano={18} />
          No pudimos comprobar tus permisos. Intenta recargar la página.
        </p>
      )}
      {acceso === 'admin' && <ListaPendientes revisorId={usuario.id} />}
    </section>
  )
}

function ListaPendientes({ revisorId }: { revisorId: string }) {
  const [pendientes, setPendientes] = useState<MaestroPendiente[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setError(null)
    try {
      setPendientes(await listarPendientes())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la lista.')
      setPendientes([])
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function alTerminar(maestro: MaestroPendiente, resultado: 'aprobado' | 'rechazado') {
    setPendientes((lista) => lista?.filter((m) => m.id !== maestro.id) ?? null)
    setSeleccionado(null)
    setAviso(
      resultado === 'aprobado'
        ? `${maestro.nombre} quedó verificado y su cédula fue borrada.`
        : `Se rechazó la identidad de ${maestro.nombre}.`,
    )
  }

  return (
    <>
      <div className="moderacion-barra">
        <h2>
          Pendientes {pendientes && <span className="moderacion-contador">{pendientes.length}</span>}
        </h2>
        <button type="button" className="boton boton-fantasma boton-chico" onClick={() => void cargar()}>
          Actualizar
        </button>
      </div>

      <p className="moderacion-estado" role="status" aria-live="polite">
        {aviso}
      </p>

      {error && (
        <p className="alerta-error" role="alert">
          <Icono nombre="alerta" tamano={18} />
          {error}
        </p>
      )}

      {pendientes === null && <p className="texto-suave">Cargando maestros pendientes…</p>}
      {pendientes?.length === 0 && !error && (
        <p className="moderacion-vacio">
          <Icono nombre="usuarioVerificado" tamano={22} />
          No hay maestros esperando verificación.
        </p>
      )}

      {pendientes && pendientes.length > 0 && (
        <ul className="moderacion-lista">
          {pendientes.map((m) => (
            <li key={m.id} className="moderacion-item">
              <div className="moderacion-fila">
                <div className="moderacion-datos">
                  <strong>{m.nombre}</strong>
                  <span className="texto-suave">
                    {m.oficio} · {nombreComuna(m.comunaId)} · {textoEspera(diasEsperando(m.registradoEn))}
                  </span>
                </div>
                {m.cedula ? (
                  <button
                    type="button"
                    className="boton boton-primario boton-chico"
                    aria-expanded={seleccionado === m.id}
                    aria-controls={`revision-${m.id}`}
                    onClick={() => setSeleccionado((s) => (s === m.id ? null : m.id))}
                  >
                    {seleccionado === m.id ? 'Cerrar' : 'Revisar cédula'}
                  </button>
                ) : (
                  <span className="chip">Sin cédula subida</span>
                )}
              </div>
              {seleccionado === m.id && m.cedula && (
                <Revision maestro={m} revisorId={revisorId} alTerminar={(r) => alTerminar(m, r)} />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

type PropsRevision = {
  maestro: MaestroPendiente
  revisorId: string
  alTerminar: (resultado: 'aprobado' | 'rechazado') => void
}

function Revision({ maestro, revisorId, alTerminar }: PropsRevision) {
  const cedula = maestro.cedula!
  const [url, setUrl] = useState<string | null>(null)
  const [errorUrl, setErrorUrl] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState<string | undefined>()
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const pedirUrl = useCallback(async () => {
    setErrorUrl(null)
    setUrl(null)
    try {
      setUrl(await urlFirmadaCedula(cedula.ruta_archivo!))
    } catch (e) {
      setErrorUrl(e instanceof Error ? e.message : 'No se pudo abrir la cédula.')
    }
  }, [cedula.ruta_archivo])

  useEffect(() => {
    void pedirUrl()
  }, [pedirUrl])

  const revision = { documentoId: cedula.id, maestroId: maestro.id, ruta: cedula.ruta_archivo!, revisorId }

  async function aprobar() {
    setErrorAccion(null)
    setEnviando(true)
    try {
      await aprobarIdentidad(revision)
      alTerminar('aprobado')
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'No se pudo aprobar.')
      setEnviando(false)
    }
  }

  async function rechazar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const e = validarMotivo(motivo)
    setErrorMotivo(e)
    if (e) {
      document.getElementById(`motivo-${maestro.id}`)?.focus()
      return
    }
    setErrorAccion(null)
    setEnviando(true)
    try {
      await rechazarIdentidad({ ...revision, motivo })
      alTerminar('rechazado')
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo rechazar.')
      setEnviando(false)
    }
  }

  const tipo = tipoArchivo(cedula.ruta_archivo!)
  const idMotivoError = errorMotivo ? `motivo-${maestro.id}-error` : undefined

  return (
    <div id={`revision-${maestro.id}`} className="moderacion-revision">
      <div className="moderacion-visor">
        {!url && !errorUrl && <p className="texto-suave">Abriendo la cédula…</p>}
        {errorUrl && (
          <p className="alerta-error" role="alert">
            <Icono nombre="alerta" tamano={18} />
            {errorUrl}
          </p>
        )}
        {url && tipo === 'imagen' && <img src={url} alt={`Cédula de identidad de ${maestro.nombre}`} />}
        {url && tipo === 'pdf' && <iframe src={url} title={`Cédula de identidad de ${maestro.nombre} (PDF)`} />}
        {url && tipo === 'otro' && (
          <a href={url} target="_blank" rel="noreferrer">
            Abrir la cédula en otra pestaña
          </a>
        )}
        <p className="campo-ayuda">
          El enlace es privado y vence en {SEGUNDOS_URL_FIRMADA} segundos.{' '}
          <button type="button" className="boton-enlace" onClick={() => void pedirUrl()}>
            Generar uno nuevo
          </button>
        </p>
      </div>

      <div className="moderacion-acciones">
        <p>
          Comprueba que el nombre de la cédula coincida con <strong>{maestro.nombre}</strong> y que el documento se lea
          completo.
        </p>

        {errorAccion && (
          <p className="alerta-error" role="alert">
            <Icono nombre="alerta" tamano={18} />
            {errorAccion}
          </p>
        )}

        {!rechazando ? (
          <div className="moderacion-botones">
            <button
              type="button"
              className="boton boton-primario"
              onClick={() => void aprobar()}
              disabled={enviando}
              aria-busy={enviando}
            >
              {enviando && <span className="girador" aria-hidden="true" />}
              <Icono nombre="usuarioVerificado" tamano={18} />
              {enviando ? 'Aprobando…' : 'Aprobar identidad'}
            </button>
            <button type="button" className="boton boton-fantasma" onClick={() => setRechazando(true)} disabled={enviando}>
              Rechazar
            </button>
          </div>
        ) : (
          <form className="formulario" onSubmit={rechazar} noValidate>
            <div className={`campo${errorMotivo ? ' campo-con-error' : ''}`}>
              <label htmlFor={`motivo-${maestro.id}`}>Motivo del rechazo</label>
              <textarea
                id={`motivo-${maestro.id}`}
                rows={3}
                maxLength={MOTIVO_MAX}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                aria-invalid={errorMotivo ? true : undefined}
                aria-describedby={[idMotivoError, `motivo-${maestro.id}-ayuda`].filter(Boolean).join(' ')}
                required
              />
              {errorMotivo && (
                <p id={idMotivoError} className="campo-error">
                  <Icono nombre="alerta" tamano={16} />
                  {errorMotivo}
                </p>
              )}
              <p id={`motivo-${maestro.id}-ayuda`} className="campo-ayuda">
                Por ejemplo: «La foto está borrosa y no se lee el número de documento». Máximo {MOTIVO_MAX} caracteres.
              </p>
            </div>
            <div className="moderacion-botones">
              <button type="submit" className="boton boton-peligro" disabled={enviando} aria-busy={enviando}>
                {enviando && <span className="girador" aria-hidden="true" />}
                {enviando ? 'Rechazando…' : 'Confirmar rechazo'}
              </button>
              <button
                type="button"
                className="boton boton-fantasma"
                onClick={() => {
                  setRechazando(false)
                  setErrorMotivo(undefined)
                }}
                disabled={enviando}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
