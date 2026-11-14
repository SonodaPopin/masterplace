import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import Icono from '../../components/Icono'
import ListaResultados from './ListaResultados'
import './busqueda.css'
import { useSesion } from '../../lib/auth/contexto'
import { buscarComuna, COMUNAS_PILOTO, type ComunaPiloto } from '../../lib/catalogos/comunas'
import { useOficios } from '../../lib/catalogos/oficios'
import type { Punto } from '../../lib/geo/haversine'
import { buscarMaestros } from '../../lib/busqueda/buscarMaestros'
import type { ResultadoBusqueda } from '../../lib/busqueda/resultados'
import { inicioDelRol } from '../../lib/navegacion/menu'

type OrigenPunto = 'comuna' | 'ubicacion' | 'manual'
type EstadoUbicacion = 'inactiva' | 'buscando' | 'denegada' | 'no-disponible'
type EstadoBusqueda =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; resultados: ResultadoBusqueda[]; origen: 'postgis' | 'respaldo' }

const COMUNA_POR_DEFECTO = COMUNAS_PILOTO[0]

// Leaflet pesa ~170 kB: se carga aparte para que la lista aparezca primero en el celular.
const MapaResultados = lazy(() => import('./MapaResultados'))

// La búsqueda es la página de inicio, salvo para el maestro: a él no le sirve buscar a otros maestros, así que va
// a sus mensajes (src/lib/navegacion/menu.ts). Mientras se conoce el rol de la sesión no se consulta nada.
export default function Busqueda() {
  const { cargando, sesion, rol } = useSesion()
  if (sesion && cargando) {
    return (
      <div className="cargando-pantalla" role="status">
        <span className="girador girador-oscuro" aria-hidden="true" />
        Cargando…
      </div>
    )
  }
  const inicio = inicioDelRol(rol)
  if (sesion && inicio !== '/') return <Navigate to={inicio} replace />
  return <BuscadorMaestros />
}

// RF-3 · Búsqueda de maestros por oficio, comuna y cercanía. Consulta: Pedro. Mapa, lista y punto: Gabriel.
// Los filtros viven en la URL (?oficio=1&comuna=8101) para poder compartir o recargar una búsqueda.
function BuscadorMaestros() {
  const { usuario } = useSesion()
  const oficios = useOficios()
  const [parametros, setParametros] = useSearchParams()

  const comunaUsuario = buscarComuna(Number(usuario?.user_metadata?.comuna_id))
  const comuna: ComunaPiloto = buscarComuna(Number(parametros.get('comuna'))) ?? comunaUsuario ?? COMUNA_POR_DEFECTO
  const oficioId = Number(parametros.get('oficio')) || null

  const [punto, setPunto] = useState<Punto>({ lat: comuna.lat, lng: comuna.lng })
  const [origenPunto, setOrigenPunto] = useState<OrigenPunto>('comuna')
  const [estadoUbicacion, setEstadoUbicacion] = useState<EstadoUbicacion>('inactiva')
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const [busqueda, setBusqueda] = useState<EstadoBusqueda>({ estado: 'cargando' })
  const [intento, setIntento] = useState(0)
  const [resaltadoId, setResaltadoId] = useState<string | null>(null)
  const [enfoque, setEnfoque] = useState<{ id: string; vez: number } | null>(null)
  const [vistaMovil, setVistaMovil] = useState<'lista' | 'mapa'>('lista')

  // Al cambiar de comuna, el punto vuelve a su centro (salvo que la persona use su ubicación).
  const [comunaAnterior, setComunaAnterior] = useState(comuna.id)
  if (comunaAnterior !== comuna.id) {
    setComunaAnterior(comuna.id)
    if (origenPunto !== 'ubicacion') {
      setPunto({ lat: comuna.lat, lng: comuna.lng })
      setOrigenPunto('comuna')
    }
  }

  // Busca de nuevo cuando cambian los filtros o el punto. La espera corta evita una consulta por cada
  // pequeño movimiento al arrastrar el marcador.
  useEffect(() => {
    let activo = true
    setBusqueda((b) => (b.estado === 'listo' ? b : { estado: 'cargando' }))
    const espera = setTimeout(() => {
      buscarMaestros({ oficioId, comunaId: comuna.id, punto })
        .then((r) => activo && setBusqueda({ estado: 'listo', ...r }))
        .catch(() => activo && setBusqueda({ estado: 'error' }))
    }, 250)
    return () => {
      activo = false
      clearTimeout(espera)
    }
  }, [oficioId, comuna.id, punto, intento])

  const resultados = useMemo(() => {
    if (busqueda.estado !== 'listo') return []
    return soloDisponibles ? busqueda.resultados.filter((r) => r.disponible) : busqueda.resultados
  }, [busqueda, soloDisponibles])

  function cambiarFiltro(clave: 'oficio' | 'comuna', valor: string) {
    const nuevos = new URLSearchParams(parametros)
    if (valor) nuevos.set(clave, valor)
    else nuevos.delete(clave)
    setParametros(nuevos, { replace: true })
  }

  const elegirPuntoManual = useCallback((p: Punto) => {
    setPunto(p)
    setOrigenPunto('manual')
  }, [])

  function usarMiUbicacion() {
    if (!('geolocation' in navigator)) {
      setEstadoUbicacion('no-disponible')
      return
    }
    setEstadoUbicacion('buscando')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPunto({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setOrigenPunto('ubicacion')
        setEstadoUbicacion('inactiva')
      },
      (err) => setEstadoUbicacion(err.code === err.PERMISSION_DENIED ? 'denegada' : 'no-disponible'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

  function volverAlCentro() {
    setPunto({ lat: comuna.lat, lng: comuna.lng })
    setOrigenPunto('comuna')
    setEstadoUbicacion('inactiva')
  }

  function verEnMapa(id: string) {
    setResaltadoId(id)
    setEnfoque((e) => ({ id, vez: (e?.vez ?? 0) + 1 }))
    setVistaMovil('mapa')
  }

  function elegirMarcador(id: string) {
    setResaltadoId(id)
    document.getElementById(`resultado-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  const nombreOficio =
    oficios.estado === 'listo' ? oficios.oficios.find((o) => o.id === oficioId)?.nombre : undefined
  const descripcionPunto =
    origenPunto === 'comuna'
      ? `el centro de ${comuna.nombre}`
      : origenPunto === 'ubicacion'
        ? 'tu ubicación'
        : 'el punto que elegiste en el mapa'

  return (
    <div className="busqueda">
      <section className="busqueda-cabecera" aria-labelledby="titulo-busqueda">
        <div className="busqueda-cabecera-texto">
          <p className="busqueda-eyebrow">
            <Icono nombre="escudo" tamano={16} />
            Solo maestros con identidad verificada
          </p>
          <h1 id="titulo-busqueda">Encuentra un maestro cerca de ti</h1>
          <p className="busqueda-bajada">
            Elige el oficio y tu comuna. Te mostramos quiénes trabajan ahí, del más cercano al más lejano.
          </p>
        </div>

        <form className="filtros" role="search" aria-label="Filtros de búsqueda" onSubmit={(e) => e.preventDefault()}>
          <div className="filtro">
            <label htmlFor="filtro-oficio">Oficio</label>
            <select
              id="filtro-oficio"
              value={oficioId ?? ''}
              onChange={(e) => cambiarFiltro('oficio', e.target.value)}
              disabled={oficios.estado !== 'listo'}
            >
              <option value="">{oficios.estado === 'cargando' ? 'Cargando…' : 'Todos los oficios'}</option>
              {oficios.estado === 'listo' &&
                oficios.oficios.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
            </select>
          </div>
          <div className="filtro">
            <label htmlFor="filtro-comuna">Comuna</label>
            <select id="filtro-comuna" value={comuna.id} onChange={(e) => cambiarFiltro('comuna', e.target.value)}>
              {COMUNAS_PILOTO.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <label className="filtro-casilla">
            <input type="checkbox" checked={soloDisponibles} onChange={(e) => setSoloDisponibles(e.target.checked)} />
            <span className="filtro-casilla-marca" aria-hidden="true" />
            Solo disponibles
          </label>
        </form>

        <div className="punto-busqueda">
          <p className="punto-busqueda-texto">
            <Icono nombre="ubicacion" tamano={18} />
            <span>
              Distancias desde <strong>{descripcionPunto}</strong>.
              <span className="punto-busqueda-pista"> Toca el mapa o arrastra el punto para cambiarlo.</span>
            </span>
          </p>
          <div className="punto-busqueda-acciones">
            {origenPunto !== 'ubicacion' && (
              <button
                type="button"
                className="boton boton-fantasma boton-chico"
                onClick={usarMiUbicacion}
                disabled={estadoUbicacion === 'buscando'}
                aria-busy={estadoUbicacion === 'buscando'}
              >
                {estadoUbicacion === 'buscando' ? 'Buscando…' : 'Usar mi ubicación'}
              </button>
            )}
            {origenPunto !== 'comuna' && (
              <button type="button" className="boton boton-fantasma boton-chico" onClick={volverAlCentro}>
                Volver al centro de {comuna.nombre}
              </button>
            )}
          </div>
          {(estadoUbicacion === 'denegada' || estadoUbicacion === 'no-disponible') && (
            <p className="punto-busqueda-aviso" role="status">
              <Icono nombre="alerta" tamano={16} />
              {estadoUbicacion === 'denegada'
                ? `No diste permiso de ubicación. Seguimos con ${descripcionPunto}; también puedes tocar el mapa.`
                : `No pudimos obtener tu ubicación. Seguimos con ${descripcionPunto}; también puedes tocar el mapa.`}
            </p>
          )}
        </div>
      </section>

      <div className="vista-conmutador" role="group" aria-label="Cómo ver los resultados">
        <button type="button" aria-pressed={vistaMovil === 'lista'} onClick={() => setVistaMovil('lista')}>
          <Icono nombre="menu" tamano={18} />
          Lista
        </button>
        <button type="button" aria-pressed={vistaMovil === 'mapa'} onClick={() => setVistaMovil('mapa')}>
          <Icono nombre="ubicacion" tamano={18} />
          Mapa
        </button>
      </div>

      <div className={`busqueda-resultados vista-${vistaMovil}`}>
        <section className="panel-lista" aria-labelledby="titulo-resultados">
          <div className="resultados-resumen">
            <h2 id="titulo-resultados" className="solo-lector">
              Resultados
            </h2>
            <p aria-live="polite" aria-atomic="true">
              {busqueda.estado === 'cargando' && 'Buscando maestros…'}
              {busqueda.estado === 'error' && 'No pudimos completar la búsqueda.'}
              {busqueda.estado === 'listo' && (
                <>
                  <strong>
                    {resultados.length} {resultados.length === 1 ? 'maestro' : 'maestros'}
                  </strong>{' '}
                  {nombreOficio ? `de ${nombreOficio.toLowerCase()} ` : ''}en {comuna.nombre}, del más cercano al más
                  lejano
                </>
              )}
            </p>
            {busqueda.estado === 'listo' && busqueda.origen === 'respaldo' && (
              <p className="resultados-origen" title="La función buscar_maestros aún no está en la base de datos">
                Distancia calculada en tu navegador (Haversine)
              </p>
            )}
          </div>

          {busqueda.estado === 'cargando' && (
            <ul className="resultados-esqueleto" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <li key={i} />
              ))}
            </ul>
          )}

          {busqueda.estado === 'error' && (
            <div className="resultados-vacio">
              <Icono nombre="alerta" tamano={28} />
              <p>Revisa tu conexión e inténtalo de nuevo.</p>
              <button type="button" className="boton boton-primario" onClick={() => setIntento((n) => n + 1)}>
                Reintentar
              </button>
            </div>
          )}

          {busqueda.estado === 'listo' && resultados.length === 0 && (
            <div className="resultados-vacio">
              <Icono nombre="buscar" tamano={28} />
              <p>
                <strong>No encontramos maestros {soloDisponibles ? 'disponibles ' : ''}con esos filtros.</strong>
              </p>
              <p className="texto-suave">
                {soloDisponibles
                  ? 'Prueba quitando «Solo disponibles».'
                  : oficioId
                    ? 'Prueba con todos los oficios o con una comuna vecina.'
                    : 'Prueba con una comuna vecina.'}
              </p>
            </div>
          )}

          {busqueda.estado === 'listo' && resultados.length > 0 && (
            <ListaResultados
              resultados={resultados}
              resaltadoId={resaltadoId}
              alResaltar={setResaltadoId}
              alVerEnMapa={verEnMapa}
            />
          )}
        </section>

        <section className="panel-mapa" aria-label="Mapa de resultados">
          <p className="solo-lector">
            El mapa muestra los mismos maestros que la lista, con el mismo número. Puedes usar solo la lista.
          </p>
          <Suspense fallback={<div className="mapa-cargando">Cargando mapa…</div>}>
            <MapaResultados
              resultados={resultados}
              punto={punto}
              resaltadoId={resaltadoId}
              enfoque={enfoque}
              alElegirMarcador={elegirMarcador}
              alCambiarPunto={elegirPuntoManual}
              visible={vistaMovil === 'mapa'}
            />
          </Suspense>
        </section>
      </div>
    </div>
  )
}
