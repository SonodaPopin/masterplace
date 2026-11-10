import type { ReactNode } from 'react'
import Icono, { type NombreIcono } from '../../components/Icono'

type Beneficio = { icono: NombreIcono; titulo: string; texto: string }

const BENEFICIOS_CLIENTE: Beneficio[] = [
  { icono: 'escudo', titulo: 'Maestros verificados', texto: 'Identidad revisada y, cuando corresponde, certificación del oficio.' },
  { icono: 'ubicacion', titulo: 'Cerca de ti', texto: 'Resultados ordenados por distancia en tu comuna.' },
  { icono: 'chat', titulo: 'Conversa antes de contratar', texto: 'Chat dentro de la plataforma, sin dar tu número.' },
]

const BENEFICIOS_MAESTRO: Beneficio[] = [
  { icono: 'herramienta', titulo: 'Tu oficio a la vista', texto: 'Perfil con tu oficio, experiencia y comunas donde trabajas.' },
  { icono: 'escudo', titulo: 'Sellos de confianza', texto: 'Identidad, reputación y certificación como señales separadas.' },
  { icono: 'estrella', titulo: 'Reseñas reales', texto: 'Solo opinan clientes con un servicio confirmado.' },
]

type Props = {
  titulo: string
  subtitulo?: ReactNode
  publico?: 'cliente' | 'maestro'
  /** Indicador "Paso X de Y" junto al título (solo si se pasan ambos). */
  pasoActual?: number
  pasoTotal?: number
  children: ReactNode
}

// Diseño de dos columnas para las pantallas de cuenta: panel de marca con beneficios y tarjeta con el
// formulario. En móvil el panel se reduce a una franja sobre el formulario.
export default function DisenoCuentas({ titulo, subtitulo, publico = 'cliente', pasoActual, pasoTotal, children }: Props) {
  const beneficios = publico === 'maestro' ? BENEFICIOS_MAESTRO : BENEFICIOS_CLIENTE
  return (
    <div className="cuentas">
      <aside className="cuentas-panel" aria-label="Por qué MasterPlace">
        <div>
          <p className="cuentas-panel-eyebrow">{publico === 'maestro' ? 'Para maestros' : 'Para clientes'}</p>
          <p className="cuentas-panel-titulo">
            {publico === 'maestro'
              ? 'Consigue trabajos cerca de donde vives.'
              : 'Encuentra maestros de confianza en el Gran Concepción.'}
          </p>
          <ul className="cuentas-beneficios">
            {beneficios.map((b) => (
              <li key={b.titulo}>
                <span className="cuentas-beneficio-icono">
                  <Icono nombre={b.icono} />
                </span>
                <span>
                  <strong>{b.titulo}</strong>
                  <span>{b.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {publico === 'cliente' && (
          <div className="cuentas-mockup" aria-hidden="true">
            <div className="cuentas-mockup-fila">
              <span className="cuentas-mockup-avatar">
                <Icono nombre="usuarioVerificado" tamano={20} />
              </span>
              <span className="cuentas-mockup-datos">
                <span className="cuentas-mockup-nombre">Marco Sepúlveda</span>
                <span className="cuentas-mockup-oficio">Gasfitero verificado</span>
              </span>
              <span className="cuentas-mockup-rating">
                <Icono nombre="estrella" tamano={12} /> 4.9
              </span>
            </div>
            <div className="cuentas-mockup-barras">
              <span className="cuentas-mockup-barra" style={{ width: '100%' }} />
              <span className="cuentas-mockup-barra" style={{ width: '70%' }} />
            </div>
            <div className="cuentas-mockup-chat">
              <span className="cuentas-mockup-burbuja">¡Hola! ¿Cuándo puedes revisar la llave?</span>
            </div>
          </div>
        )}
      </aside>

      <section className="cuentas-tarjeta" aria-labelledby="titulo-cuenta">
        <div className="cuentas-encabezado-form">
          <div>
            <h1 id="titulo-cuenta">{titulo}</h1>
            {subtitulo && <p className="cuentas-subtitulo">{subtitulo}</p>}
          </div>
          {pasoActual != null && pasoTotal != null && (
            <div className="cuentas-paso">
              <span className="cuentas-paso-etiqueta">
                Paso {pasoActual} de {pasoTotal}
              </span>
              <span className="cuentas-paso-barra">
                <span className="cuentas-paso-progreso" style={{ width: `${(pasoActual / pasoTotal) * 100}%` }} />
              </span>
            </div>
          )}
        </div>
        {children}
      </section>
    </div>
  )
}
