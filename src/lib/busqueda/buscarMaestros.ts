import { supabase } from '../supabase'
import {
  aResultados,
  ordenarPorReputacion,
  type FilaMaestro,
  type FiltrosBusqueda,
  type ResultadoBusqueda,
} from './resultados'

export type RespuestaBusqueda = {
  resultados: ResultadoBusqueda[]
  /** 'postgis' si respondió la función de Pedro; 'respaldo' si se calculó en el navegador con Haversine. */
  origen: 'postgis' | 'respaldo'
}

// Fila que se espera de la función SQL buscar_maestros (Pedro, RF-3).
type FilaFuncion = {
  id: string
  nombre: string | null
  oficio: string
  descripcion: string | null
  anios_experiencia: number | null
  disponible: boolean
  certificado_ok: boolean
  nivel_reputacion: boolean
  lat: number
  lng: number
  distancia_km: number
  cantidad_resenas: number
  promedio_resenas: number | null
  puntaje_laplace: number | null
}

type FilaEstadisticaResena = {
  maestro_id: string
  cantidad: number
  promedio: number | null
}

function calcularLaplace(cantidad: number, promedio: number | null): number | null {
  if (cantidad <= 0 || promedio === null) return null
  return (cantidad * promedio + 15) / (cantidad + 5)
}

function desdeFuncion(f: FilaFuncion): ResultadoBusqueda {
  return {
    id: f.id,
    nombre: f.nombre,
    oficio: f.oficio,
    descripcion: f.descripcion,
    aniosExperiencia: f.anios_experiencia,
    disponible: f.disponible,
    certificado: f.certificado_ok,
    reputacion: f.nivel_reputacion,
    punto: { lat: f.lat, lng: f.lng },
    distanciaKm: Number(f.distancia_km),
    cantidadResenas: Number(f.cantidad_resenas ?? 0),
    promedioResenas: f.promedio_resenas === null ? null : Number(f.promedio_resenas),
    puntajeLaplace: f.puntaje_laplace === null ? null : Number(f.puntaje_laplace),
  }
}

// PGRST202: la función no existe (todavía) en el esquema expuesto.
const FUNCION_INEXISTENTE = 'PGRST202'
// Si la función no existe, no se vuelve a pedir hasta recargar la página (evita un 404 por búsqueda).
let funcionDisponible = true

// Busca maestros verificados que cubren la comuna, ordenados por distancia o reputación (Laplace).
export async function buscarMaestros(filtros: FiltrosBusqueda): Promise<RespuestaBusqueda> {
  const orden = filtros.orden ?? 'distancia'

  if (funcionDisponible) {
    const rpc = await supabase.rpc('buscar_maestros', {
      p_oficio_id: filtros.oficioId,
      p_comuna_id: filtros.comunaId,
      p_lat: filtros.punto.lat,
      p_lng: filtros.punto.lng,
      p_orden: orden,
    })
    if (!rpc.error) {
      return { resultados: (rpc.data as FilaFuncion[]).map(desdeFuncion), origen: 'postgis' }
    }
    if (rpc.error.code !== FUNCION_INEXISTENTE) throw new Error(rpc.error.message)
    funcionDisponible = false
  }

  let consulta = supabase
    .from('maestros')
    .select(
      'id, descripcion, anios_experiencia, referencia, disponible, certificado_ok, nivel_reputacion, perfiles(nombre), oficios(nombre), coberturas!inner(comuna_id)',
    )
    .eq('estado_identidad', 'verificada')
    .gt('identidad_vence_en', new Date().toISOString())
    .eq('coberturas.comuna_id', filtros.comunaId)
  if (filtros.oficioId != null) consulta = consulta.eq('oficio_id', filtros.oficioId)

  const { data, error } = await consulta
  if (error) throw new Error(error.message)

  const base = aResultados(data as unknown as FilaMaestro[], filtros.punto)

  const statsRpc = await supabase.rpc('estadisticas_resenas')
  if (!statsRpc.error && Array.isArray(statsRpc.data)) {
    const porMaestro = new Map<string, FilaEstadisticaResena>()
    for (const fila of statsRpc.data as FilaEstadisticaResena[]) {
      porMaestro.set(fila.maestro_id, fila)
    }

    for (const item of base) {
      const stat = porMaestro.get(item.id)
      const cantidad = stat ? Number(stat.cantidad ?? 0) : 0
      const promedio = stat && stat.promedio !== null ? Number(stat.promedio) : null
      item.cantidadResenas = cantidad
      item.promedioResenas = promedio
      item.puntajeLaplace = calcularLaplace(cantidad, promedio)
    }
  }

  const resultados = orden === 'reputacion' ? ordenarPorReputacion(base) : base
  return { resultados, origen: 'respaldo' }
}