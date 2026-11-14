import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icono from '../../components/Icono'
import {
  estadoTarea,
  pasoActual,
  progreso,
  type Paso,
  type Respuestas,
} from '../../lib/validacion/guion'
import { tokenValido } from './api'
import { usePrueba } from './contextoPrueba'
import {
  AyudaTarea,
  EvaluacionTarea,
  PasoAntes,
  PasoConsentimiento,
  PasoDatos,
  PasoFinales,
  PasoSenales,
  PasoSus,
} from './PasosPrueba'
import './validacion.css'

// Validación con usuarios (R3-C5) · Página del enlace único /prueba/<token>. Responsable: Gabriel.
// Guía al participante paso a paso. Las tareas se hacen en la app real, acompañadas por <PanelPrueba>.

function tituloPaso(paso: Paso): string {
  switch (paso.tipo) {
    case 'consentimiento':
      return 'Antes de empezar'
    case 'datos':
      return 'Sus datos para la prueba'
    case 'antes':
      return 'Una pregunta antes de empezar'
    case 'tarea':
      return `Tarea ${paso.numero} de ${paso.total} · ${paso.tarea.titulo}`
    case 'senales':
      return 'Lo que muestran los perfiles'
    case 'sus':
      return 'Su opinión sobre la página'
    case 'finales':
      return 'Para terminar'
    case 'fin':
      return paso.rechazo ? 'Gracias por su tiempo' : '¡Muchas gracias!'
  }
}

export default function PaginaPrueba() {
  const { token: tokenRuta = '' } = useParams()
  const { token, participante, cargando, error, activar, guardar } = usePrueba()
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const claveActual = participante ? pasoActual(participante.perfil, participante.respuestas).clave : null

  useEffect(() => {
    activar(tokenRuta)
  }, [tokenRuta, activar])

  // Cada paso nuevo empieza arriba, con el foco en su título (en el celular, si no, se queda abajo).
  useEffect(() => {
    if (!claveActual) return
    window.scrollTo({ top: 0 })
    tituloRef.current?.focus({ preventScroll: true })
  }, [claveActual])

  // Un enlace mal copiado se detecta aquí mismo: el error del proveedor podría ser de otro enlace guardado antes.
  const mensajeError = tokenValido(tokenRuta)
    ? error
    : 'Este enlace de prueba no es válido. Revise que lo copió completo.'
  if (mensajeError) {
    return (
      <section className="prueba">
        <div className="alerta-error" role="alert">
          <Icono nombre="alerta" tamano={18} />
          {mensajeError}
        </div>
      </section>
    )
  }

  if (cargando || !participante || token !== tokenRuta) {
    return (
      <section className="prueba cargando-pantalla" aria-live="polite">
        <span className="girador girador-oscuro" aria-hidden="true" />
        <span className="texto-suave">Cargando la prueba…</span>
      </section>
    )
  }

  const { perfil, codigo, respuestas } = participante
  const paso = pasoActual(perfil, respuestas)
  const { numero, total } = progreso(perfil, paso)
  const alGuardar = (valor: unknown) => guardar(paso.clave, valor)

  return (
    <section className="prueba" aria-labelledby="prueba-titulo">
      <header className="prueba-encabezado">
        <p className="chip">Prueba de MasterPlace · Participante {codigo}</p>
        <h1 id="prueba-titulo" ref={tituloRef} tabIndex={-1}>
          {tituloPaso(paso)}
        </h1>
        {paso.tipo !== 'fin' && (
          <div className="prueba-progreso">
            <span className="texto-suave">
              Paso {numero} de {total}
            </span>
            <span className="prueba-progreso-barra" aria-hidden="true">
              <span className="prueba-progreso-avance" style={{ width: `${(numero / total) * 100}%` }} />
            </span>
          </div>
        )}
      </header>

      {/* key: cada paso empieza con su formulario vacío. */}
      <div key={paso.clave}>
        {paso.tipo === 'consentimiento' && <PasoConsentimiento alGuardar={alGuardar} />}
        {paso.tipo === 'datos' && <PasoDatos alGuardar={alGuardar} />}
        {paso.tipo === 'antes' && <PasoAntes perfil={perfil} alGuardar={alGuardar} />}
        {paso.tipo === 'tarea' && (
          <TareaEnPagina paso={paso} codigo={codigo} respuestas={respuestas} guardar={guardar} />
        )}
        {paso.tipo === 'senales' && <PasoSenales alGuardar={alGuardar} />}
        {paso.tipo === 'sus' && <PasoSus alGuardar={alGuardar} />}
        {paso.tipo === 'finales' && <PasoFinales alGuardar={alGuardar} />}
        {paso.tipo === 'fin' && <Fin rechazo={paso.rechazo} respuestas={respuestas} guardar={guardar} />}
      </div>
    </section>
  )
}

type PasoTarea = Extract<Paso, { tipo: 'tarea' }>

function TareaEnPagina({
  paso,
  codigo,
  respuestas,
  guardar,
}: {
  paso: PasoTarea
  codigo: string
  respuestas: Respuestas
  guardar: (clave: string, valor: unknown) => Promise<void>
}) {
  const navegar = useNavigate()
  const { tarea } = paso
  const estado = estadoTarea(tarea.id, respuestas)
  const [enviando, setEnviando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  async function marcar(clave: string, luego?: () => void) {
    setEnviando(true)
    setErrorAccion(null)
    try {
      await guardar(clave, new Date().toISOString())
      luego?.()
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'No pudimos guardar.')
    } finally {
      setEnviando(false)
    }
  }

  if (estado === 'por_evaluar') {
    return (
      <div className="prueba-tarjeta">
        <p className="texto-suave">{tarea.instruccion}</p>
        <EvaluacionTarea tarea={tarea} alGuardar={(valor) => guardar(tarea.id, valor)} />
      </div>
    )
  }

  return (
    <div className="prueba-tarjeta">
      <p className="prueba-instruccion">{tarea.instruccion}</p>
      <AyudaTarea tarea={tarea} codigo={codigo} />
      <p className="texto-suave">
        Al tocar «Comenzar» se abrirá MasterPlace. Esta instrucción quedará abajo de la pantalla mientras hace la tarea.
      </p>
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
            onClick={() => marcar(`${tarea.id}_inicio`, () => navegar('/'))}
          >
            <Icono nombre="flecha" tamano={17} />
            Comenzar tarea
          </button>
        ) : (
          <>
            <button type="button" className="boton boton-primario" onClick={() => navegar('/')}>
              Volver a la tarea
            </button>
            <button
              type="button"
              className="boton boton-fantasma"
              disabled={enviando}
              onClick={() => marcar(`${tarea.id}_fin`)}
            >
              Terminé la tarea
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Fin({
  rechazo,
  respuestas,
  guardar,
}: {
  rechazo: boolean
  respuestas: Respuestas
  guardar: (clave: string, valor: unknown) => Promise<void>
}) {
  const registrado = useRef('fin' in respuestas)

  useEffect(() => {
    if (rechazo || registrado.current) return
    registrado.current = true
    void guardar('fin', new Date().toISOString()).catch(() => {
      registrado.current = false
    })
  }, [rechazo, guardar])

  return (
    <div className="prueba-tarjeta confirmacion">
      <span className="confirmacion-icono" aria-hidden="true">
        <Icono nombre="escudo" tamano={28} />
      </span>
      {rechazo ? (
        <p>No registramos nada más. Si cambia de opinión, puede volver a abrir el enlace y avisarnos.</p>
      ) : (
        <>
          <p>Sus respuestas quedaron guardadas. Nos ayudan mucho a mejorar MasterPlace.</p>
          <p className="texto-suave">Ya puede cerrar esta página.</p>
        </>
      )}
    </div>
  )
}
