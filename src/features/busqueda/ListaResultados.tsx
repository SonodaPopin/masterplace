import Icono from '../../components/Icono'
import { formatearDistancia, iniciales, type ResultadoBusqueda } from '../../lib/busqueda/resultados'

type Props = {
  resultados: ResultadoBusqueda[]
  resaltadoId: string | null
  alResaltar: (id: string) => void
  alVerEnMapa: (id: string) => void
}

// Lista equivalente al mapa (RNF-7): mismo orden y el mismo número que el marcador, con toda la información
// que da el mapa en texto. Es la forma principal de recorrer los resultados con teclado o lector de pantalla.
export default function ListaResultados({ resultados, resaltadoId, alResaltar, alVerEnMapa }: Props) {
  return (
    <ol className="resultados-lista">
      {resultados.map((r, i) => {
        const activo = r.id === resaltadoId
        return (
          <li
            key={r.id}
            id={`resultado-${r.id}`}
            className={`resultado${activo ? ' resultado-activo' : ''}`}
            onMouseEnter={() => alResaltar(r.id)}
          >
            <span className="resultado-numero" aria-hidden="true">
              {i + 1}
            </span>
            <div className="resultado-cuerpo">
              <div className="resultado-cabecera">
                <span className="resultado-avatar" aria-hidden="true">
                  {iniciales(r.nombre)}
                </span>
                <div className="resultado-identidad">
                  <h3 className="resultado-nombre">
                    <span className="solo-lector">Resultado {i + 1}: </span>
                    {r.nombre ?? 'Maestro verificado'}
                  </h3>
                  <p className="resultado-oficio">
                    {r.oficio}
                    {r.aniosExperiencia != null && ` · ${r.aniosExperiencia} ${r.aniosExperiencia === 1 ? 'año' : 'años'} de experiencia`}
                  </p>
                </div>
                <span className="resultado-distancia">
                  <Icono nombre="ubicacion" tamano={14} />
                  <span>
                    <span className="solo-lector">A </span>
                    {formatearDistancia(r.distanciaKm)}
                  </span>
                </span>
              </div>

              {r.descripcion && <p className="resultado-descripcion">{r.descripcion}</p>}

              <ul className="resultado-sellos" aria-label="Señales de confianza">
                <li className="sello-chip sello-chip-identidad">
                  <Icono nombre="escudo" tamano={14} />
                  Identidad verificada
                </li>
                {r.certificado && (
                  <li className="sello-chip sello-chip-certificado">
                    <Icono nombre="herramienta" tamano={14} />
                    Certificado
                  </li>
                )}
                {r.reputacion && (
                  <li className="sello-chip sello-chip-reputacion">
                    <Icono nombre="estrella" tamano={14} />
                    Buena reputación
                  </li>
                )}
                <li className={`sello-chip ${r.disponible ? 'sello-chip-disponible' : 'sello-chip-ocupado'}`}>
                  <span className="punto-estado" aria-hidden="true" />
                  {r.disponible ? 'Disponible' : 'Sin cupo por ahora'}
                </li>
              </ul>

              <button type="button" className="resultado-ver-mapa" onClick={() => alVerEnMapa(r.id)}>
                <Icono nombre="ubicacion" tamano={16} />
                Ver en el mapa<span className="solo-lector"> a {r.nombre ?? 'este maestro'}</span>
              </button>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
