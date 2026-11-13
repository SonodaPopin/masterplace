import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Punto } from '../../lib/geo/haversine'
import { formatearDistancia, type ResultadoBusqueda } from '../../lib/busqueda/resultados'

type Props = {
  resultados: ResultadoBusqueda[]
  punto: Punto
  /** Maestro resaltado (al pasar sobre la lista o tocar su marcador). */
  resaltadoId: string | null
  /** Pedido de «ver en el mapa»: centra y abre la ficha. `vez` permite repetir el mismo maestro. */
  enfoque: { id: string; vez: number } | null
  alElegirMarcador: (id: string) => void
  /** Punto manual: clic en el mapa o arrastrar el marcador de búsqueda. */
  alCambiarPunto: (punto: Punto) => void
  /** En móvil el mapa se oculta tras una pestaña; al mostrarse hay que recalcular su tamaño. */
  visible: boolean
}

// Marcadores dibujados con HTML/CSS (divIcon): no dependen de las imágenes de Leaflet, que Vite no resuelve.
function iconoResultado(numero: number, activo: boolean): L.DivIcon {
  return L.divIcon({
    className: `pin${activo ? ' pin-activo' : ''}`,
    html: `<span class="pin-forma"><span class="pin-numero">${numero}</span></span>`,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -42],
  })
}

const ICONO_PUNTO = L.divIcon({
  className: 'pin-busqueda',
  html: '<span class="pin-busqueda-halo"></span><span class="pin-busqueda-centro"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

// Encuadra el punto y los resultados cuando cambia el conjunto de resultados (no al seleccionar uno) y
// cuando el mapa pasa a verse: en móvil se crea oculto tras la pestaña «Lista» y su tamaño es 0.
function Encuadre({ punto, resultados, visible }: { punto: Punto; resultados: ResultadoBusqueda[]; visible: boolean }) {
  const mapa = useMap()
  const clave = resultados.map((r) => r.id).join(',')
  const ultimo = useRef({ punto, resultados })
  ultimo.current = { punto, resultados }

  useEffect(() => {
    mapa.invalidateSize()
    const tamano = mapa.getSize()
    if (tamano.x === 0 || tamano.y === 0) return
    const { punto: p, resultados: rs } = ultimo.current
    if (!rs.length) {
      mapa.setView([p.lat, p.lng], 14, { animate: false })
      return
    }
    const limites = L.latLngBounds([[p.lat, p.lng], ...rs.map((r): [number, number] => [r.punto.lat, r.punto.lng])])
    mapa.fitBounds(limites, { padding: [48, 48], maxZoom: 15, animate: false })
  }, [mapa, clave, visible])
  return null
}

function ClicParaElegirPunto({ alCambiarPunto }: { alCambiarPunto: (p: Punto) => void }) {
  useMapEvents({ click: (e) => alCambiarPunto({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

// Lleva el mapa al maestro elegido en la lista y abre su ficha.
function EnfocarSeleccion({
  enfoque,
  marcadores,
}: {
  enfoque: Props['enfoque']
  marcadores: React.RefObject<Map<string, L.Marker>>
}) {
  const mapa = useMap()
  useEffect(() => {
    if (!enfoque) return
    const marcador = marcadores.current?.get(enfoque.id)
    if (!marcador) return
    // Después del encuadre (que corre en el mismo ciclo cuando el mapa recién se muestra en móvil).
    const espera = setTimeout(() => {
      mapa.invalidateSize()
      mapa.setView(marcador.getLatLng(), 16)
      marcador.openPopup()
    }, 0)
    return () => clearTimeout(espera)
  }, [mapa, enfoque, marcadores])
  return null
}

export default function MapaResultados({ resultados, punto, resaltadoId, enfoque, alElegirMarcador, alCambiarPunto, visible }: Props) {
  const marcadores = useRef(new Map<string, L.Marker>())

  const eventosPunto = useMemo(
    () => ({
      dragend: (e: L.LeafletEvent) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng()
        alCambiarPunto({ lat, lng })
      },
    }),
    [alCambiarPunto],
  )

  return (
    <MapContainer
      center={[punto.lat, punto.lng]}
      zoom={14}
      scrollWheelZoom={false}
      className="mapa"
      attributionControl
    >
      {/* Teselas de OpenStreetMap: gratis con atribución y uso moderado (política de uso de OSMF). */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Encuadre punto={punto} resultados={resultados} visible={visible} />
      <ClicParaElegirPunto alCambiarPunto={alCambiarPunto} />
      <EnfocarSeleccion enfoque={enfoque} marcadores={marcadores} />

      <Marker
        position={[punto.lat, punto.lng]}
        icon={ICONO_PUNTO}
        draggable
        eventHandlers={eventosPunto}
        title="Punto de búsqueda. Arrástralo o toca el mapa para moverlo."
        alt="Punto de búsqueda"
        zIndexOffset={-1000}
      />

      {resultados.map((r, i) => (
        <Marker
          key={r.id}
          position={[r.punto.lat, r.punto.lng]}
          icon={iconoResultado(i + 1, r.id === resaltadoId)}
          title={`${i + 1}. ${r.nombre ?? 'Maestro verificado'}, a ${formatearDistancia(r.distanciaKm)}`}
          alt={`${i + 1}. ${r.nombre ?? 'Maestro verificado'}`}
          zIndexOffset={r.id === resaltadoId ? 500 : 0}
          eventHandlers={{ click: () => alElegirMarcador(r.id) }}
          ref={(m) => {
            if (m) marcadores.current.set(r.id, m)
            else marcadores.current.delete(r.id)
          }}
        >
          <Popup>
            <strong className="popup-nombre">
              {i + 1}. {r.nombre ?? 'Maestro verificado'}
            </strong>
            <span className="popup-detalle">
              {r.oficio} · {formatearDistancia(r.distanciaKm)}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
