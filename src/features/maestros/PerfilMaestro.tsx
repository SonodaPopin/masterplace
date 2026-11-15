import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, supabaseConfigurado } from '../../lib/supabase'
import {
  obtenerReputacionMaestro,
  type ReputacionMaestro,
} from '../resenas/servicioReputacion'

type MaestroPublico = {
  id: string
  descripcion: string | null
  anios_experiencia: number | null
  disponible: boolean
  certificado_ok: boolean
  perfiles: { nombre: string }[]
  oficios: { nombre: string }[]
}

export default function PerfilMaestro() {
  const { maestroId } = useParams<{ maestroId: string }>()

  const [maestro, setMaestro] = useState<MaestroPublico | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reputacion, setReputacion] = useState<ReputacionMaestro | null>(null)
  const [cargandoResenas, setCargandoResenas] = useState(true)
  const [errorResenas, setErrorResenas] = useState<string | null>(null)

  useEffect(() => {
    if (!maestroId || !supabaseConfigurado) return

    let vigente = true

    async function cargarMaestro() {
      setCargando(true)
      setError(null)

      const { data, error: errorConsulta } = await supabase
        .from('maestros')
        .select(`
          id,
          descripcion,
          anios_experiencia,
          disponible,
          certificado_ok,
          perfiles(nombre),
          oficios(nombre)
        `)
        .eq('id', maestroId!)
        .eq('estado_identidad', 'verificada')
        .maybeSingle()

      if (!vigente) return

      if (errorConsulta) {
        setError('No se pudo cargar el perfil del maestro.')
      } else if (!data) {
        setError('No se encontró un maestro verificado con ese identificador.')
      } else {
        setMaestro(data as MaestroPublico)
      }

      setCargando(false)
    }

    void cargarMaestro()

async function cargarReputacion() {
  setCargandoResenas(true)
  setErrorResenas(null)
  setReputacion(null)

  try {
    const datos = await obtenerReputacionMaestro(maestroId!)

    if (vigente) {
      setReputacion(datos)
    }
  } catch {
    if (vigente) {
      setErrorResenas('No se pudieron cargar las reseñas.')
    }
  } finally {
    if (vigente) {
      setCargandoResenas(false)
    }
  }
}

void cargarReputacion()
    return () => {
      vigente = false
    }
  }, [maestroId])

  if (!maestroId) {
    return <p>No se especificó un maestro válido.</p>
  }

  if (!supabaseConfigurado) {
    return <p>Falta configurar la conexión con Supabase.</p>
  }

  return (
    <section className="perfil-maestro">
      <Link to="/">Volver a la búsqueda</Link>

      {cargando && <p>Cargando perfil del maestro…</p>}

      {error && (
        <p className="alerta-error" role="alert">
          {error}
        </p>
      )}

      {!cargando && maestro && (
        <>
          <h1>{maestro.perfiles?.[0]?.nombre ?? 'Maestro verificado'}</h1>

          <p>{maestro.oficios?.[0]?.nombre ?? 'Oficio no disponible'}</p>

          <h2>Información profesional</h2>

          <p>
            {maestro.descripcion || 'Sin descripción profesional.'}
          </p>

          <p>
            Experiencia: {maestro.anios_experiencia ?? 'No indicada'}
            {maestro.anios_experiencia != null ? ' años' : ''}
          </p>

          <p>
            Disponibilidad: {maestro.disponible ? 'Disponible' : 'Sin cupo'}
          </p>

          {maestro.certificado_ok && (
            <p>Certificado verificado</p>
          )}

<h2>Calificaciones y reseñas</h2>

{cargandoResenas && <p>Cargando reseñas…</p>}

{errorResenas && (
  <p className="alerta-error" role="alert">
    {errorResenas}
  </p>
)}

{!cargandoResenas && reputacion && (
  <>
    {reputacion.cantidadResenas === 0 ? (
      <p>Este maestro todavía no tiene reseñas.</p>
    ) : (
      <>
        <p>
          <strong>
            {reputacion.promedioBayesiano?.toFixed(2) ?? 'Sin datos'}
          </strong>
          {' '}★ Promedio bayesiano
        </p>

        <p>
          {reputacion.cantidadResenas}{' '}
          {reputacion.cantidadResenas === 1 ? 'reseña' : 'reseñas'}
        </p>

        <p>
          Promedio bruto:{' '}
          {reputacion.promedioBruto?.toFixed(2) ?? 'Sin datos'} ★
        </p>

        <ul className="resenas-lista">
          {reputacion.resenas.map((resena, indice) => (
            <li key={`${resena.creada_en}-${indice}`}>
              <p>
                <strong>
                  {resena.calificacion} de 5 estrellas
                </strong>
              </p>

              {resena.comentario && (
                <p>{resena.comentario}</p>
              )}

              <time dateTime={resena.creada_en}>
                {new Date(resena.creada_en).toLocaleDateString('es-CL')}
              </time>
            </li>
          ))}
        </ul>
      </>
    )}
  </>
)}
        </>
      )}
    </section>
  )
}
