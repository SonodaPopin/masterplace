import { useId, useState } from 'react'
import Icono from './Icono'
import { SELLOS, type TipoSello } from '../lib/maestros/sellos'
import './sellosConfianza.css'

type Props = {
  sellos: TipoSello[]
  className?: string
}

// H-03 (validación de E3): ningún cliente distinguió los sellos. Cada sello explica qué significa al tocarlo,
// con teclado o con el lector de pantalla; no depende de pasar el mouse.
export default function SellosConfianza({ sellos, className }: Props) {
  const idAyuda = useId()
  const [abierto, setAbierto] = useState<TipoSello | null>(null)
  const seleccionado = abierto && sellos.includes(abierto) ? SELLOS[abierto] : null

  return (
    <div className={`sellos-confianza${className ? ` ${className}` : ''}`}>
      <ul className="sellos-confianza-lista" aria-label="Señales de confianza">
        {sellos.map((tipo) => {
          const sello = SELLOS[tipo]
          return (
            <li key={tipo}>
              <button
                type="button"
                className={`sello-chip sello-chip-${tipo}`}
                aria-expanded={abierto === tipo}
                aria-controls={idAyuda}
                onClick={() => setAbierto((actual) => (actual === tipo ? null : tipo))}
                onKeyDown={(evento) => {
                  if (evento.key === 'Escape') setAbierto(null)
                }}
              >
                {sello.icono ? (
                  <Icono nombre={sello.icono} tamano={14} />
                ) : (
                  <span className="punto-estado" aria-hidden="true" />
                )}
                {sello.etiqueta}
                <span className="sello-chip-pregunta" aria-hidden="true">?</span>
                <span className="solo-lector">: ¿qué significa?</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p id={idAyuda} className="sellos-confianza-ayuda" aria-live="polite">
        {seleccionado && (
          <span>
            <strong>{seleccionado.etiqueta}:</strong> {seleccionado.ayuda}
          </span>
        )}
      </p>
    </div>
  )
}
