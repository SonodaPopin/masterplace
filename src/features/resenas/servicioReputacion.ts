import { supabase } from '../../lib/supabase'
import { promedioBayesiano } from '../../lib/reputacion/promedioBayesiano'

export type ResenaPublica = {
  calificacion: number
  comentario: string | null
  creada_en: string
}

export type ReputacionMaestro = {
  resenas: ResenaPublica[]
  cantidadResenas: number
  promedioBruto: number | null
  promedioBayesiano: number | null
}

export async function obtenerReputacionMaestro(
  maestroId: string,
): Promise<ReputacionMaestro> {
  const [respuestaResenas, respuestaEstadisticas] = await Promise.all([
    supabase.rpc('obtener_resenas_maestro', {
      p_maestro_id: maestroId,
    }),
    supabase.rpc('obtener_estadisticas_reputacion', {
      p_maestro_id: maestroId,
    }),
  ])

  if (respuestaResenas.error) {
    throw new Error('No se pudieron obtener las reseñas.')
  }

  if (respuestaEstadisticas.error) {
    throw new Error('No se pudieron obtener las estadísticas de reputación.')
  }

  const resenas = (respuestaResenas.data ?? []) as ResenaPublica[]

  const estadisticas = respuestaEstadisticas.data?.[0]

  if (!estadisticas) {
    throw new Error('No se encontraron las estadísticas de reputación.')
  }

  const cantidadResenas = Number(estadisticas.cantidad_resenas)
  const promedioBruto = estadisticas.promedio_maestro
  const promedioGlobal = estadisticas.promedio_global

  const bayesiano = promedioBayesiano(
    cantidadResenas,
    promedioBruto ?? 0,
    promedioGlobal,
  )

  return {
    resenas,
    cantidadResenas,
    promedioBruto,
    promedioBayesiano: bayesiano,
  }
}
