import type { InputHTMLAttributes, ReactNode } from 'react'

type Props = {
  id: string
  etiqueta: string
  error?: string
  ayuda?: ReactNode
} & InputHTMLAttributes<HTMLInputElement>

// Campo de formulario accesible (RNF-7): etiqueta asociada, ayuda y error leídos por el lector de pantalla.
export default function Campo({ id, etiqueta, error, ayuda, ...input }: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
        {...input}
      />
      {ayuda && (
        <p id={idAyuda} className="campo-ayuda">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="campo-error">
          {error}
        </p>
      )}
    </div>
  )
}
