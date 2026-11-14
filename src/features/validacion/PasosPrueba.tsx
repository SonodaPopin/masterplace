import { useState, type FormEvent, type ReactNode } from 'react'
import Icono from '../../components/Icono'
import {
  APARATOS,
  COMUNAS,
  CONSENTIMIENTO,
  ESCALA_LOGRO,
  ITEMS_SUS,
  PREGUNTA_A2,
  PREGUNTA_A3,
  PREGUNTA_A4,
  PREGUNTA_ANTES,
  PREGUNTA_SENALES,
  SENALES_A2,
  USO_2X3,
  correoPrueba,
  puntajeSus,
  validarOrdenSenales,
  type Logro,
  type Perfil,
  type Tarea,
} from '../../lib/validacion/guion'

// Formularios de cada paso de la prueba con usuarios. Los usa la página /prueba/<token> y, para evaluar una tarea,
// el panel que acompaña al participante mientras usa MasterPlace. Todos reciben `alGuardar`, que persiste la respuesta.

type AlGuardar = (valor: unknown) => Promise<void>

/** Tras un envío con errores, lleva el foco a la primera pregunta sin responder (como el registro, RNF-7). */
function enfocarPrimerError(formulario: HTMLFormElement) {
  window.requestAnimationFrame(() => {
    formulario
      .querySelector<HTMLElement>('.campo-con-error input, .campo-con-error textarea, .campo-con-error select')
      ?.focus()
  })
}

function useEnvio(alGuardar: AlGuardar) {
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  async function enviar(valor: unknown) {
    setEnviando(true)
    setErrorEnvio(null)
    try {
      await alGuardar(valor)
    } catch (e) {
      setErrorEnvio(e instanceof Error ? e.message : 'No pudimos guardar su respuesta.')
    } finally {
      setEnviando(false)
    }
  }
  return { enviando, errorEnvio, enviar }
}

function ErrorCampo({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null
  return (
    <p id={id} className="campo-error">
      <Icono nombre="alerta" tamano={16} />
      {texto}
    </p>
  )
}

function ErrorEnvio({ texto }: { texto: string | null }) {
  if (!texto) return null
  return (
    <div className="alerta-error" role="alert">
      <Icono nombre="alerta" tamano={18} />
      {texto}
    </div>
  )
}

function BotonEnviar({ enviando, children }: { enviando: boolean; children: ReactNode }) {
  return (
    <button type="submit" className="boton boton-primario" disabled={enviando}>
      {enviando ? <span className="girador" aria-hidden="true" /> : <Icono nombre="flecha" tamano={17} />}
      {enviando ? 'Guardando…' : children}
    </button>
  )
}

function GrupoOpciones({
  nombre,
  leyenda,
  opciones,
  valor,
  alCambiar,
  error,
  grilla,
}: {
  nombre: string
  leyenda: string
  opciones: readonly string[]
  valor: string
  alCambiar: (v: string) => void
  error?: string
  grilla?: boolean
}) {
  const idError = `${nombre}-error`
  return (
    <fieldset className={`grupo${error ? ' campo-con-error' : ''}`} aria-describedby={error ? idError : undefined}>
      <legend>{leyenda}</legend>
      <div className={grilla ? 'opciones-grilla' : 'opciones-lista'}>
        {opciones.map((o) => (
          <label key={o} className="opcion">
            <input type="radio" name={nombre} value={o} checked={valor === o} onChange={() => alCambiar(o)} />
            <span className="opcion-marca opcion-marca-radio" aria-hidden="true" />
            <span>{o}</span>
          </label>
        ))}
      </div>
      <ErrorCampo id={idError} texto={error} />
    </fieldset>
  )
}

function AreaTexto({
  id,
  etiqueta,
  valor,
  alCambiar,
  error,
  opcional,
}: {
  id: string
  etiqueta: string
  valor: string
  alCambiar: (v: string) => void
  error?: string
  opcional?: boolean
}) {
  const idError = `${id}-error`
  return (
    <div className={`campo${error ? ' campo-con-error' : ''}`}>
      <label htmlFor={id}>
        {etiqueta}
        {opcional && <span className="campo-opcional"> (opcional)</span>}
      </label>
      <textarea
        id={id}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        rows={4}
        maxLength={2000}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
      />
      <ErrorCampo id={idError} texto={error} />
    </div>
  )
}

const OBLIGATORIA = 'Esta pregunta es obligatoria.'

// --- Consentimiento ---------------------------------------------------------------------------

export function PasoConsentimiento({ alGuardar }: { alGuardar: AlGuardar }) {
  const { enviando, errorEnvio, enviar } = useEnvio(alGuardar)
  return (
    <div className="prueba-tarjeta">
      {CONSENTIMIENTO.map((parrafo) => (
        <p key={parrafo.slice(0, 24)}>{parrafo}</p>
      ))}
      <ErrorEnvio texto={errorEnvio} />
      <div className="prueba-acciones">
        <button
          type="button"
          className="boton boton-primario"
          disabled={enviando}
          onClick={() => enviar({ acepta: true, en: new Date().toISOString() })}
        >
          Sí, acepto participar
        </button>
        <button
          type="button"
          className="boton boton-fantasma"
          disabled={enviando}
          onClick={() => enviar({ acepta: false, en: new Date().toISOString() })}
        >
          No acepto
        </button>
      </div>
    </div>
  )
}

// --- Datos ------------------------------------------------------------------------------------

export function PasoDatos({ alGuardar }: { alGuardar: AlGuardar }) {
  const { enviando, errorEnvio, enviar } = useEnvio(alGuardar)
  const [comuna, setComuna] = useState('')
  const [aparato, setAparato] = useState('')
  const [uso2x3, setUso2x3] = useState('')
  const [intento, setIntento] = useState(false)

  function enviarDatos(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIntento(true)
    if (!comuna || !aparato || !uso2x3) return enfocarPrimerError(e.currentTarget)
    void enviar({ comuna, aparato, uso_2x3: uso2x3 })
  }

  const falta = (v: string) => (intento && !v ? OBLIGATORIA : undefined)
  return (
    <form className="formulario prueba-tarjeta" onSubmit={enviarDatos} noValidate>
      <GrupoOpciones
        nombre="comuna"
        leyenda="¿En qué comuna vive o trabaja?"
        opciones={COMUNAS}
        valor={comuna}
        alCambiar={setComuna}
        error={falta(comuna)}
        grilla
      />
      <GrupoOpciones
        nombre="aparato"
        leyenda="¿Desde qué aparato hace la prueba?"
        opciones={APARATOS}
        valor={aparato}
        alCambiar={setAparato}
        error={falta(aparato)}
      />
      <GrupoOpciones
        nombre="uso2x3"
        leyenda="¿Conoce o ha usado 2x3 u otra página para buscar u ofrecer servicios de maestros?"
        opciones={USO_2X3}
        valor={uso2x3}
        alCambiar={setUso2x3}
        error={falta(uso2x3)}
      />
      <ErrorEnvio texto={errorEnvio} />
      <div className="prueba-acciones">
        <BotonEnviar enviando={enviando}>Continuar</BotonEnviar>
      </div>
    </form>
  )
}

// --- Pregunta abierta (A1 y T5) ------------------------------------------------------------------

function PasoTexto({ id, pregunta, alGuardar }: { id: string; pregunta: string; alGuardar: AlGuardar }) {
  const { enviando, errorEnvio, enviar } = useEnvio(alGuardar)
  const [texto, setTexto] = useState('')
  const [intento, setIntento] = useState(false)

  function enviarTexto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIntento(true)
    if (!texto.trim()) return enfocarPrimerError(e.currentTarget)
    void enviar({ texto: texto.trim() })
  }

  return (
    <form className="formulario prueba-tarjeta" onSubmit={enviarTexto} noValidate>
      <AreaTexto
        id={id}
        etiqueta={pregunta}
        valor={texto}
        alCambiar={setTexto}
        error={intento && !texto.trim() ? OBLIGATORIA : undefined}
      />
      <ErrorEnvio texto={errorEnvio} />
      <div className="prueba-acciones">
        <BotonEnviar enviando={enviando}>Continuar</BotonEnviar>
      </div>
    </form>
  )
}

export function PasoAntes({ perfil, alGuardar }: { perfil: Perfil; alGuardar: AlGuardar }) {
  return <PasoTexto id="a1" pregunta={PREGUNTA_ANTES[perfil]} alGuardar={alGuardar} />
}

export function PasoSenales({ alGuardar }: { alGuardar: AlGuardar }) {
  return <PasoTexto id="t5" pregunta={PREGUNTA_SENALES} alGuardar={alGuardar} />
}

// --- Tareas -------------------------------------------------------------------------------------

/** Lo que el participante necesita a mano para la tarea: su correo de prueba y, en T1, el carnet de prueba. */
export function AyudaTarea({ tarea, codigo }: { tarea: Tarea; codigo: string }) {
  const correo = correoPrueba(codigo)
  const [copiado, setCopiado] = useState(false)
  const pideCorreo = tarea.id === 't1' || tarea.id === 't2'

  async function copiar() {
    try {
      await navigator.clipboard.writeText(correo)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  if (!pideCorreo && !tarea.carnet) return null
  return (
    <ul className="prueba-ayuda">
      {pideCorreo && (
        <li>
          <Icono nombre="correo" tamano={18} />
          <span>
            Correo de prueba: <strong className="prueba-correo">{correo}</strong>. La contraseña la elige usted.
          </span>
          <button type="button" className="boton boton-fantasma boton-chico" onClick={copiar}>
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
          <span className="solo-lector" aria-live="polite">
            {copiado ? 'Correo copiado' : ''}
          </span>
        </li>
      )}
      {tarea.carnet && (
        <li>
          <Icono nombre="documento" tamano={18} />
          <span>
            Carnet de prueba (dice «DOCUMENTO FICTICIO SIN VALIDEZ»): descárguelo y súbalo cuando la página lo pida.
          </span>
          <a className="boton boton-fantasma boton-chico" href="/carnet_prueba.png" download="carnet_prueba.png">
            Descargar
          </a>
        </li>
      )}
    </ul>
  )
}

/** «¿Pudo hacerlo?» y comentarios, al terminar una tarea. */
export function EvaluacionTarea({
  tarea,
  logroInicial,
  alGuardar,
}: {
  tarea: Tarea
  logroInicial?: Logro
  alGuardar: AlGuardar
}) {
  const { enviando, errorEnvio, enviar } = useEnvio(alGuardar)
  const [logro, setLogro] = useState<string>(logroInicial ?? '')
  const [respuesta, setRespuesta] = useState('')
  const [comentario, setComentario] = useState('')
  const [intento, setIntento] = useState(false)

  function enviarEvaluacion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIntento(true)
    if (!logro || (tarea.preguntaExtra && !respuesta.trim())) return enfocarPrimerError(e.currentTarget)
    void enviar({
      logro,
      ...(tarea.preguntaExtra ? { respuesta: respuesta.trim() } : {}),
      comentario: comentario.trim() || null,
    })
  }

  return (
    <form className="formulario" onSubmit={enviarEvaluacion} noValidate>
      <GrupoOpciones
        nombre={`${tarea.id}-logro`}
        leyenda="¿Pudo hacerlo?"
        opciones={ESCALA_LOGRO}
        valor={logro}
        alCambiar={setLogro}
        error={intento && !logro ? OBLIGATORIA : undefined}
      />
      {tarea.preguntaExtra && (
        <AreaTexto
          id={`${tarea.id}-respuesta`}
          etiqueta={tarea.preguntaExtra}
          valor={respuesta}
          alCambiar={setRespuesta}
          error={intento && !respuesta.trim() ? OBLIGATORIA : undefined}
        />
      )}
      <AreaTexto
        id={`${tarea.id}-comentario`}
        etiqueta="¿Dónde se confundió o qué le faltó?"
        valor={comentario}
        alCambiar={setComentario}
        opcional
      />
      <ErrorEnvio texto={errorEnvio} />
      <div className="prueba-acciones">
        <BotonEnviar enviando={enviando}>Guardar y continuar</BotonEnviar>
      </div>
    </form>
  )
}

// --- SUS ------------------------------------------------------------------------------------------

export function PasoSus({ alGuardar }: { alGuardar: AlGuardar }) {
  const { enviando, errorEnvio, enviar } = useEnvio(alGuardar)
  const [valores, setValores] = useState<(number | null)[]>(() => ITEMS_SUS.map(() => null))
  const [intento, setIntento] = useState(false)

  function elegir(i: number, v: number) {
    setValores((actual) => actual.map((x, j) => (j === i ? v : x)))
  }

  function enviarSus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIntento(true)
    if (valores.some((v) => v == null)) return enfocarPrimerError(e.currentTarget)
    const respuestas = valores as number[]
    void enviar({ respuestas, puntaje: puntajeSus(respuestas) })
  }

  const faltan = valores.filter((v) => v == null).length
  return (
    <form className="formulario prueba-tarjeta" onSubmit={enviarSus} noValidate>
      <p className="texto-suave">
        Marque qué tan de acuerdo está con cada frase. 1 = totalmente en desacuerdo, 5 = totalmente de acuerdo.
      </p>
      {ITEMS_SUS.map((texto, i) => {
        const error = intento && valores[i] == null ? OBLIGATORIA : undefined
        const idError = `sus-${i}-error`
        return (
          <fieldset
            key={texto}
            className={`grupo prueba-escala${error ? ' campo-con-error' : ''}`}
            aria-describedby={error ? idError : undefined}
          >
            <legend>
              {i + 1}. {texto}
            </legend>
            <div className="prueba-escala-opciones">
              {[1, 2, 3, 4, 5].map((v) => (
                <label key={v} className="opcion prueba-escala-opcion">
                  <input
                    type="radio"
                    name={`sus-${i}`}
                    value={v}
                    checked={valores[i] === v}
                    onChange={() => elegir(i, v)}
                    aria-label={`${v}${v === 1 ? ', totalmente en desacuerdo' : v === 5 ? ', totalmente de acuerdo' : ''}`}
                  />
                  <span aria-hidden="true">{v}</span>
                </label>
              ))}
            </div>
            <div className="prueba-escala-extremos" aria-hidden="true">
              <span>En desacuerdo</span>
              <span>De acuerdo</span>
            </div>
            <ErrorCampo id={idError} texto={error} />
          </fieldset>
        )
      })}
      {intento && faltan > 0 && (
        <p className="campo-error" role="alert">
          <Icono nombre="alerta" tamano={16} />
          Faltan {faltan} {faltan === 1 ? 'frase' : 'frases'} por responder.
        </p>
      )}
      <ErrorEnvio texto={errorEnvio} />
      <div className="prueba-acciones">
        <BotonEnviar enviando={enviando}>Continuar</BotonEnviar>
      </div>
    </form>
  )
}

// --- Preguntas finales (A2 a A4) ------------------------------------------------------------------

export function PasoFinales({ alGuardar }: { alGuardar: AlGuardar }) {
  const { enviando, errorEnvio, enviar } = useEnvio(alGuardar)
  const [orden, setOrden] = useState<Partial<Record<string, number>>>({})
  const [a3, setA3] = useState('')
  const [a4, setA4] = useState('')
  const [intento, setIntento] = useState(false)
  const errorOrden = intento ? validarOrdenSenales(orden) : null

  function enviarFinales(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIntento(true)
    if (validarOrdenSenales(orden)) return enfocarPrimerError(e.currentTarget)
    void enviar({ orden, a3: a3.trim() || null, a4: a4.trim() || null })
  }

  return (
    <form className="formulario prueba-tarjeta" onSubmit={enviarFinales} noValidate>
      <fieldset
        className={`grupo${errorOrden ? ' campo-con-error' : ''}`}
        aria-describedby={errorOrden ? 'a2-error' : undefined}
      >
        <legend>{PREGUNTA_A2}</legend>
        {SENALES_A2.map((s) => (
          <div key={s.clave} className="prueba-orden">
            <label htmlFor={`a2-${s.clave}`}>{s.texto}</label>
            <select
              id={`a2-${s.clave}`}
              value={orden[s.clave] ?? ''}
              onChange={(e) =>
                setOrden((o) => ({ ...o, [s.clave]: e.target.value ? Number(e.target.value) : undefined }))
              }
            >
              <option value="">Elegir</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        ))}
        <ErrorCampo id="a2-error" texto={errorOrden ?? undefined} />
      </fieldset>
      <AreaTexto id="a3" etiqueta={PREGUNTA_A3} valor={a3} alCambiar={setA3} opcional />
      <AreaTexto id="a4" etiqueta={PREGUNTA_A4} valor={a4} alCambiar={setA4} opcional />
      <ErrorEnvio texto={errorEnvio} />
      <div className="prueba-acciones">
        <BotonEnviar enviando={enviando}>Enviar respuestas</BotonEnviar>
      </div>
    </form>
  )
}
