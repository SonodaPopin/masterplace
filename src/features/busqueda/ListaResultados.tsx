
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icono from '../../components/Icono'
import SellosConfianza from '../../components/SellosConfianza'
import { sellosDeMaestro } from '../../lib/maestros/sellos'
import { useSesion } from '../../lib/auth/contexto'
import { crearOReutilizarContacto } from '../contacto/servicioContactos.ts'
import {
  formatearDistancia,
  iniciales,
  type ResultadoBusqueda,
} from '../../lib/busqueda/resultados'

type Props = {
  resultados: ResultadoBusqueda[]
  resaltadoId: string | null
  alResaltar: (id: string) => void
  alVerEnMapa: (id: string) => void
}

export default function ListaResultados({
  resultados,
  resaltadoId,
  alResaltar,
  alVerEnMapa,
}: Props) {
  const { usuario, rol } = useSesion()
  const navigate = useNavigate()
  const location = useLocation()

  const [contactandoId, setContactandoId] = useState<string | null>(null)
  const [errorContacto, setErrorContacto] = useState<string | null>(null)

  async function contactar(maestroId: string) {
    // Si no inició sesión, lo enviamos al login.
    if (!usuario) {
      navigate('/ingresar', {
        state: { desde: location.pathname },
      })
      return
    }

    // Solo los clientes pueden iniciar contactos.
    if (rol !== 'cliente') {
      setErrorContacto('Solo las cuentas de cliente pueden contactar a un maestro.')
      return
    }

    setContactandoId(maestroId)
    setErrorContacto(null)

    try {
      // Crea o reutiliza el contacto en Supabase.
      const contactoId = await crearOReutilizarContacto(maestroId)

      // Abre la conversación correspondiente.
      navigate(`/contactos/${contactoId}`)
    } catch (error) {
      setErrorContacto(
        error instanceof Error
          ? error.message
          : 'No fue posible contactar al maestro.'
      )
    } finally {
      setContactandoId(null)
    }
  }

  return (
    <>
      {errorContacto && (
        <p className="alerta-error" role="alert">
          {errorContacto}
        </p>
      )}

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
                      <span className="solo-lector">
                        Resultado {i + 1}:{' '}
                      </span>
                      {r.nombre ?? 'Maestro verificado'}
                    </h3>

                    <p className="resultado-oficio">
                      {r.oficio}
                      {r.aniosExperiencia != null &&
                        ` · ${r.aniosExperiencia} ${
                          r.aniosExperiencia === 1 ? 'año' : 'años'
                        } de experiencia`}
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

                {r.descripcion && (
                  <p className="resultado-descripcion">
                    {r.descripcion}
                  </p>
                )}

                <SellosConfianza sellos={sellosDeMaestro(r)} />

                <div className="resultado-acciones">
                  <button
                    type="button"
                    className="boton boton-primario boton-chico"
                    onClick={() => void contactar(r.id)}
                    disabled={contactandoId !== null || !r.disponible}
                    aria-busy={contactandoId === r.id}
                  >
                    {contactandoId === r.id
                      ? 'Contactando...'
                      : 'Contactar'}
                  </button>
		<Link
		  to={`/maestros/${r.id}`}
		  className="boton boton-chico"
		>
		  Ver perfil
		</Link>
                  <button
                    type="button"
                    className="resultado-ver-mapa"
                    onClick={() => alVerEnMapa(r.id)}
                  >
                    <Icono nombre="ubicacion" tamano={16} />
                    Ver en el mapa
                    <span className="solo-lector">
                      {' '}a {r.nombre ?? 'este maestro'}
                    </span>
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}
