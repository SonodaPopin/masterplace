import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import Icono from './Icono'

type Props = {
  id: string
  etiqueta: string
  error?: string
  ayuda?: ReactNode
} & InputHTMLAttributes<HTMLInputElement>

// Campo de formulario accesible (RNF-7): etiqueta asociada, ayuda y error leídos por el lector de pantalla.
// Si es de tipo contraseña, agrega un botón para mostrarla u ocultarla.
export default function Campo({ id, etiqueta, error, ayuda, type, required, ...input }: Props) {
  const [visible, setVisible] = useState(false)
  const esContrasena = type === 'password'
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined

  return (
    <div className={`campo${error ? ' campo-con-error' : ''}`}>
      <label htmlFor={id}>
        {etiqueta}
        {!required && <span className="campo-opcional"> (opcional)</span>}
      </label>
      <div className="campo-control">
        <input
          id={id}
          name={id}
          type={esContrasena && visible ? 'text' : type}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={[idError, idAyuda].filter(Boolean).join(' ') || undefined}
          {...input}
        />
        {esContrasena && (
          <button
            type="button"
            className="campo-ver"
            aria-label={visible ? `Ocultar ${etiqueta.toLowerCase()}` : `Mostrar ${etiqueta.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            <Icono nombre={visible ? 'ojoTachado' : 'ojo'} tamano={18} />
          </button>
        )}
      </div>
      {error && (
        <p id={idError} className="campo-error">
          <Icono nombre="alerta" tamano={16} />
          {error}
        </p>
      )}
      {ayuda && (
        <p id={idAyuda} className="campo-ayuda">
          {ayuda}
        </p>
      )}
    </div>
  )
}
