import { useEffect, useState, type FormEvent } from 'react'
import Campo from '../../components/Campo'
import Icono from '../../components/Icono'
import { supabase } from '../../lib/supabase'
import { buscarComuna, COMUNAS_PILOTO, type ComunaPiloto } from '../../lib/catalogos/comunas'
import type { ErroresFormulario } from '../../lib/auth/validacion'
import {
  ANIOS_MAXIMOS,
  LARGO_MAXIMO_DESCRIPCION,
  mensajeErrorDatos,
  puntoEWKT,
  redondearCoordenada,
  validarPerfilMaestro,
  type DatosPerfilMaestro,
} from '../../lib/maestros/validacion'

type Oficio = { id: number; nombre: string }
type Punto = { lat: number; lng: number }
type EstadoUbicacion = 'inactiva' | 'buscando' | 'lista' | 'denegada' | 'no-disponible'

type Props = {
  maestroId: string
  /** Comuna del perfil (paso 1): se marca como cobertura y da el punto por defecto. */
  comunaHogarId: number | null
  /** true si la fila de `maestros` ya existe (vuelve desde el paso 3): se actualiza en vez de insertar. */
  maestroCreado: boolean
  inicial: DatosPerfilMaestro | null
  alGuardar: (datos: DatosPerfilMaestro) => void
}

// RF-1 · Paso 2 de 3: oficio, experiencia, comunas de cobertura (RB-9) y punto de referencia.
export default function PasoPerfilMaestro({ maestroId, comunaHogarId, maestroCreado, inicial, alGuardar }: Props) {
  const comunaHogar: ComunaPiloto = buscarComuna(comunaHogarId ?? 0) ?? COMUNAS_PILOTO[0]

  const [oficios, setOficios] = useState<Oficio[] | null>(null)
  const [errorOficios, setErrorOficios] = useState<'error' | 'vacio' | null>(null)
  const [intentoOficios, setIntentoOficios] = useState(0)

  const [datos, setDatos] = useState<DatosPerfilMaestro>(
    inicial ?? { oficioId: '', aniosExperiencia: '', descripcion: '', coberturas: [comunaHogar.id] },
  )
  const [errores, setErrores] = useState<ErroresFormulario<DatosPerfilMaestro>>({})
  const [usarUbicacion, setUsarUbicacion] = useState(false)
  const [ubicacion, setUbicacion] = useState<Punto | null>(null)
  const [estadoUbicacion, setEstadoUbicacion] = useState<EstadoUbicacion>('inactiva')
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  // Si el paso 2 ya se guardó (volvió desde el paso 3 después de recargar), se cargan sus datos para no partir vacío.
  const [cargandoGuardado, setCargandoGuardado] = useState(maestroCreado && !inicial)

  useEffect(() => {
    if (!maestroCreado || inicial) return
    let activo = true
    Promise.all([
      supabase.from('maestros').select('oficio_id, anios_experiencia, descripcion').eq('id', maestroId).maybeSingle(),
      supabase.from('coberturas').select('comuna_id').eq('maestro_id', maestroId),
    ]).then(([maestro, coberturas]) => {
      if (!activo) return
      if (maestro.data) {
        setDatos({
          oficioId: maestro.data.oficio_id != null ? String(maestro.data.oficio_id) : '',
          aniosExperiencia: maestro.data.anios_experiencia != null ? String(maestro.data.anios_experiencia) : '',
          descripcion: maestro.data.descripcion ?? '',
          coberturas: coberturas.data?.length
            ? coberturas.data.map((c: { comuna_id: number }) => c.comuna_id)
            : [comunaHogar.id],
        })
      }
      setCargandoGuardado(false)
    })
    return () => {
      activo = false
    }
  }, [maestroCreado, inicial, maestroId, comunaHogar.id])

  useEffect(() => {
    let activo = true
    supabase
      .from('oficios')
      .select('id, nombre')
      .order('nombre')
      .then(({ data, error }) => {
        if (!activo) return
        if (error) setErrorOficios('error')
        else if (!data?.length) setErrorOficios('vacio')
        else setOficios(data as Oficio[])
      })
    return () => {
      activo = false
    }
  }, [intentoOficios])

  function cambiar<K extends keyof DatosPerfilMaestro>(campo: K, valor: DatosPerfilMaestro[K]) {
    setDatos((d) => ({ ...d, [campo]: valor }))
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  function alternarCobertura(id: number) {
    const marcadas = datos.coberturas.includes(id)
      ? datos.coberturas.filter((c) => c !== id)
      : [...datos.coberturas, id]
    cambiar('coberturas', marcadas)
  }

  function pedirUbicacion() {
    setUsarUbicacion(true)
    if (!('geolocation' in navigator)) {
      setEstadoUbicacion('no-disponible')
      return
    }
    setEstadoUbicacion('buscando')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacion({ lat: redondearCoordenada(pos.coords.latitude), lng: redondearCoordenada(pos.coords.longitude) })
        setEstadoUbicacion('lista')
      },
      (err) => setEstadoUbicacion(err.code === err.PERMISSION_DENIED ? 'denegada' : 'no-disponible'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErrorGeneral(null)

    const nuevosErrores = validarPerfilMaestro(datos)
    setErrores(nuevosErrores)
    const conError = Object.keys(nuevosErrores)
    if (conError.length) {
      // Foco al primer campo con error que pueda recibirlo (el select de oficio está deshabilitado si no cargó).
      const destino = conError
        .map((id) => document.getElementById(id))
        .find((el) => el && !(el as HTMLSelectElement).disabled)
      destino?.focus()
      return
    }

    // Si la ubicación no se pudo obtener, se usa el punto de la comuna (alternativa sin permisos, RNF-7).
    const punto = usarUbicacion && ubicacion ? ubicacion : { lat: comunaHogar.lat, lng: comunaHogar.lng }
    const fila = {
      oficio_id: Number(datos.oficioId),
      anios_experiencia: datos.aniosExperiencia.trim() ? Number(datos.aniosExperiencia) : null,
      descripcion: datos.descripcion.trim() || null,
      referencia: puntoEWKT(punto.lat, punto.lng),
    }

    setEnviando(true)
    // Sin upsert: la actualización no tiene permiso sobre la columna `id` (GRANT por columna de Ignacio).
    const guardado = maestroCreado
      ? await supabase.from('maestros').update(fila).eq('id', maestroId)
      : await supabase.from('maestros').insert({ id: maestroId, ...fila, disponible: true })
    if (guardado.error) {
      setEnviando(false)
      setErrorGeneral(mensajeErrorDatos(guardado.error.message))
      return
    }

    // Cobertura: se reemplaza completa para reflejar exactamente lo marcado.
    const borrado = await supabase.from('coberturas').delete().eq('maestro_id', maestroId)
    const insertado = borrado.error
      ? borrado
      : await supabase
          .from('coberturas')
          .insert(datos.coberturas.map((comuna_id) => ({ maestro_id: maestroId, comuna_id })))
    setEnviando(false)
    if (insertado.error) {
      setErrorGeneral(mensajeErrorDatos(insertado.error.message))
      return
    }
    alGuardar(datos)
  }

  const largoDescripcion = datos.descripcion.trim().length

  if (cargandoGuardado) {
    return (
      <p className="texto-suave" role="status">
        Cargando lo que ya guardaste…
      </p>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="formulario">
      <div className={`campo${errores.oficioId ? ' campo-con-error' : ''}`}>
        <label htmlFor="oficioId">Oficio</label>
        <select
          id="oficioId"
          name="oficioId"
          value={datos.oficioId}
          onChange={(e) => cambiar('oficioId', e.target.value)}
          aria-invalid={errores.oficioId ? true : undefined}
          aria-describedby={errores.oficioId ? 'oficioId-error' : undefined}
          disabled={!oficios}
          required
        >
          <option value="">{oficios ? 'Elige tu oficio' : errorOficios ? 'Sin oficios para elegir' : 'Cargando oficios…'}</option>
          {oficios?.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </select>
        {errores.oficioId && (
          <p id="oficioId-error" className="campo-error">
            <Icono nombre="alerta" tamano={16} />
            {errores.oficioId}
          </p>
        )}
        {errorOficios && (
          <p className="campo-error" role="alert">
            <Icono nombre="alerta" tamano={16} />
            {errorOficios === 'vacio' ? 'Aún no hay oficios disponibles.' : 'No pudimos cargar los oficios.'}
            <button
              type="button"
              className="enlace-boton"
              onClick={() => {
                setErrorOficios(null)
                setIntentoOficios((n) => n + 1)
              }}
            >
              Reintentar
            </button>
          </p>
        )}
      </div>

      <Campo
        id="aniosExperiencia"
        etiqueta="Años de experiencia"
        type="number"
        inputMode="numeric"
        min={0}
        max={ANIOS_MAXIMOS}
        step={1}
        className="campo-corto"
        value={datos.aniosExperiencia}
        onChange={(e) => cambiar('aniosExperiencia', e.target.value)}
        error={errores.aniosExperiencia}
      />

      <div className={`campo${errores.descripcion ? ' campo-con-error' : ''}`}>
        <label htmlFor="descripcion">
          Qué trabajos haces<span className="campo-opcional"> (opcional)</span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          placeholder="Ejemplo: instalación de calefont, cambio de llaves, detección de fugas."
          value={datos.descripcion}
          onChange={(e) => cambiar('descripcion', e.target.value)}
          aria-invalid={errores.descripcion ? true : undefined}
          aria-describedby={['descripcion-contador', errores.descripcion && 'descripcion-error'].filter(Boolean).join(' ')}
        />
        <p
          id="descripcion-contador"
          className={`campo-ayuda campo-contador${largoDescripcion > LARGO_MAXIMO_DESCRIPCION ? ' campo-contador-excedido' : ''}`}
        >
          {largoDescripcion} de {LARGO_MAXIMO_DESCRIPCION} caracteres
        </p>
        {errores.descripcion && (
          <p id="descripcion-error" className="campo-error">
            <Icono nombre="alerta" tamano={16} />
            {errores.descripcion}
          </p>
        )}
      </div>

      <fieldset
        id="coberturas"
        tabIndex={-1}
        className={`grupo${errores.coberturas ? ' campo-con-error' : ''}`}
        aria-describedby={['coberturas-ayuda', errores.coberturas && 'coberturas-error'].filter(Boolean).join(' ')}
      >
        <legend>Comunas donde trabajas</legend>
        <p id="coberturas-ayuda" className="campo-ayuda">
          Te encontrarán los clientes de estas comunas. Marca todas las que quieras.
        </p>
        <div className="opciones-grilla">
          {COMUNAS_PILOTO.map((c) => (
            <label key={c.id} className="opcion">
              <input
                type="checkbox"
                name="coberturas"
                value={c.id}
                checked={datos.coberturas.includes(c.id)}
                onChange={() => alternarCobertura(c.id)}
              />
              <span className="opcion-marca" aria-hidden="true" />
              <span>{c.nombre}</span>
            </label>
          ))}
        </div>
        {errores.coberturas && (
          <p id="coberturas-error" className="campo-error">
            <Icono nombre="alerta" tamano={16} />
            {errores.coberturas}
          </p>
        )}
      </fieldset>

      <fieldset className="grupo" aria-describedby="punto-ayuda">
        <legend>¿Desde dónde sales a trabajar?</legend>
        <p id="punto-ayuda" className="campo-ayuda">
          Así te mostramos primero a los clientes que están cerca. Nunca mostramos tu dirección.
        </p>
        <div className="opciones-lista">
          <label className="opcion opcion-tarjeta">
            <input type="radio" name="punto" checked={!usarUbicacion} onChange={() => setUsarUbicacion(false)} />
            <span className="opcion-marca opcion-marca-radio" aria-hidden="true" />
            <span className="opcion-texto">
              <strong>El centro de {comunaHogar.nombre}</strong>
              <span>Tu comuna. No necesita permisos.</span>
            </span>
          </label>
          <label className="opcion opcion-tarjeta">
            <input type="radio" name="punto" checked={usarUbicacion} onChange={pedirUbicacion} />
            <span className="opcion-marca opcion-marca-radio" aria-hidden="true" />
            <span className="opcion-texto">
              <strong>Mi ubicación actual</strong>
              <span>Aproximada a unos 100 m. Te pediremos permiso.</span>
            </span>
          </label>
        </div>
        {usarUbicacion && estadoUbicacion !== 'inactiva' && (
          <p className={`estado-ubicacion estado-ubicacion-${estadoUbicacion}`} role="status">
            <Icono nombre={estadoUbicacion === 'lista' ? 'ubicacion' : 'alerta'} tamano={16} />
            {estadoUbicacion === 'buscando' && 'Buscando tu ubicación…'}
            {estadoUbicacion === 'lista' && 'Listo: usaremos tu ubicación aproximada.'}
            {estadoUbicacion === 'denegada' &&
              `No diste permiso de ubicación. Usaremos el centro de ${comunaHogar.nombre}; puedes cambiarlo después.`}
            {estadoUbicacion === 'no-disponible' &&
              `No pudimos obtener tu ubicación. Usaremos el centro de ${comunaHogar.nombre}.`}
          </p>
        )}
      </fieldset>

      {errorGeneral && (
        <p className="alerta-error" role="alert">
          <Icono nombre="alerta" tamano={18} />
          {errorGeneral}
        </p>
      )}

      <button
        type="submit"
        className="boton boton-primario boton-ancho"
        disabled={enviando || estadoUbicacion === 'buscando'}
        aria-busy={enviando}
      >
        {enviando && <span className="girador" aria-hidden="true" />}
        {enviando ? 'Guardando…' : 'Continuar'}
        {!enviando && (
          <span className="icono-flecha">
            <Icono nombre="flecha" tamano={18} />
          </span>
        )}
      </button>
    </form>
  )
}
