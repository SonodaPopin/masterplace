import { supabase } from '../supabase'
import { aResultados, type FilaMaestro, type FiltrosBusqueda, type ResultadoBusqueda } from './resultados'

export type RespuestaBusqueda = {
  resultados: ResultadoBusqueda[]
  /** 'postgis' si respondió la función de Pedro; 'respaldo' si se calculó en el navegador con Haversine. */
  origen: 'postgis' | 'respaldo'
}

// Fila que se espera de la función SQL buscar_maestros (Pedro, RF-3). Acordar con Pedro los nombres;
// si cambian, solo hay que ajustar desdeFuncion().
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
  }
}

// PGRST202: la función no existe (todavía) en el esquema expuesto.
const FUNCION_INEXISTENTE = 'PGRST202'
// Si la función no existe, no se vuelve a pedir hasta recargar la página (evita un 404 por búsqueda).
let funcionDisponible = true

// Busca maestros verificados que cubren la comuna, ordenados por distancia al punto.
// Usa buscar_maestros (PostGIS, ST_Distance) si está disponible; si no, consulta las tablas con RLS
// (anon solo ve verificados) y calcula la distancia con haversineKm. El resultado tiene la misma forma.
export async function buscarMaestros(filtros: FiltrosBusqueda): Promise<RespuestaBusqueda> {
  if (funcionDisponible) {
    const rpc = await supabase.rpc('buscar_maestros', {
      p_oficio_id: filtros.oficioId,
      p_comuna_id: filtros.comunaId,
      p_lat: filtros.punto.lat,
      p_lng: filtros.punto.lng,
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
  return { resultados: aResultados(data as unknown as FilaMaestro[], filtros.punto), origen: 'respaldo' }
}
