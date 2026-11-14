import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icono from '../../components/Icono'
import { estadoTarea, pasoActual, type Logro } from '../../lib/validacion/guion'
import { usePrueba } from './contextoPrueba'
import { AyudaTarea, EvaluacionTarea } from './PasosPrueba'
import './validacion.css'

// Validación con usuarios · Panel fijo abajo de la pantalla mientras el participante hace una tarea en MasterPlace:
// muestra la instrucción, el correo y el carnet de prueba, marca el inicio y el fin (tiempo medido) y pregunta
// «¿Pudo hacerlo?» sin salir de la página. Así no tiene que cambiar de pestaña en el celular.
export default function PanelPrueba() {
  const { token, participante, guardar } = usePrueba()
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const [oculto, setOculto] = useState(false)
  const [logroInicial, setLogroInicial] = useState<Logro | undefined>()
  const [enviando, setEnviando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const panelRef = useRef<HTMLElement>(null)
  const [alto, setAlto] = useState(0)

  const paso = participante ? pasoActual(participante.perfil, participante.respuestas) : null
  const visible = Boolean(token && participante && paso?.tipo === 'tarea' && !pathname.startsWith('/prueba/'))

  // Espacio al final de la página para que el panel no tape el contenido.
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!visible || !panel) {
      setAlto(0)
      return
    }
    const medir = () => setAlto(panel.offsetHeight)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(panel)
    return () => observador.disconnect()
  }, [visible, oculto])

  if (!visible || !participante || !paso || paso.tipo !== 'tarea' || !token) return null

  const { tarea } = paso
  const estado = estadoTarea(tarea.id, participante.respuestas)

  async function marcar(clave: string) {
    setEnviando(true)
    setErrorAccion(null)
    try {
      await guardar(clave, new Date().toISOString())
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'No pudimos guardar.')
    } finally {
      setEnviando(false)
    }
  }

  function terminar(logro?: Logro) {
    setLogroInicial(logro)
    setOculto(false)
    void marcar(`${tarea.id}_fin`)
  }

  async function guardarEvaluacion(valor: unknown) {
    await guardar(tarea.id, valor)
    setLogroInicial(undefined)
    const siguiente = pasoActual(participante!.perfil, { ...participante!.respuestas, [tarea.id]: valor })
    if (siguiente.tipo !== 'tarea') navegar(`/prueba/${token}`)
  }

  const etiqueta = `Tarea ${paso.numero} de ${paso.total} · ${tarea.titulo}`

  return (
    <>
      <div style={{ height: alto }} aria-hidden="true" />
      <aside ref={panelRef} className="panel-prueba" aria-label="Prueba de MasterPlace">
        <div className="panel-prueba-interior">
          <div className="panel-prueba-cabecera">
            <div>
              <span className="panel-prueba-etiqueta">Prueba · Participante {participante.codigo}</span>
              <h2 className="panel-prueba-titulo">{etiqueta}</h2>
            </div>
            <button
              type="button"
              className="boton boton-fantasma boton-chico"
              aria-expanded={!oculto}
              aria-controls="panel-prueba-detalle"
              onClick={() => setOculto((v) => !v)}
            >
              {oculto ? 'Ver instrucción' : 'Ocultar'}
            </button>
          </div>

          <div id="panel-prueba-detalle" hidden={oculto}>
            {estado === 'por_evaluar' ? (
              <EvaluacionTarea
                key={tarea.id}
                tarea={tarea}
                logroInicial={logroInicial}
                alGuardar={guardarEvaluacion}
              />
            ) : (
              <>
                <p className="panel-prueba-instruccion">{tarea.instruccion}</p>
                <AyudaTarea tarea={tarea} codigo={participante.codigo} />
                {errorAccion && (
                  <div className="alerta-error" role="alert">
                    <Icono nombre="alerta" tamano={18} />
                    {errorAccion}
                  </div>
                )}
                <div className="prueba-acciones">
                  {estado === 'por_comenzar' ? (
                    <button
                      type="button"
                      className="boton boton-primario"
                      disabled={enviando}
                      onClick={() => marcar(`${tarea.id}_inicio`)}
                    >
                      <Icono nombre="flecha" tamano={17} />
                      Comenzar tarea
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="boton boton-primario"
                        disabled={enviando}
                        onClick={() => terminar()}
                      >
                        Terminé la tarea
                      </button>
                      <button
                        type="button"
                        className="boton boton-fantasma"
                        disabled={enviando}
                        onClick={() => terminar('No pude')}
                      >
                        No puedo seguir
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
