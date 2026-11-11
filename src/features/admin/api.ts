// Acceso a datos del panel de moderación (RF-2, RF-8). Responsable: Diego.
//
// Requiere en la base (Ignacio): es_admin(), políticas RLS que dejen al admin leer maestros pendientes con su
// perfil y documentos, actualizar documentos y maestros, e insertar en auditoría; y el bucket privado `cedulas`
// con lectura solo para admin. Sin esas políticas las consultas devuelven listas vacías o un error de permiso.
//
// Nota: aprobar y rechazar se hacen en varios pasos desde el cliente. Si Ignacio publica una función
// `revisar_identidad(...)` que lo haga en una sola transacción, basta con reemplazar el cuerpo de
// aprobarIdentidad y rechazarIdentidad por un `supabase.rpc(...)`; la pantalla no cambia.

import { supabase } from '../../lib/supabase'
import {
  cedulaPorRevisar,
  normalizarMotivo,
  SEGUNDOS_URL_FIRMADA,
  textoAuditoria,
  type DocumentoResumen,
} from '../../lib/moderacion/moderacion'

export type MaestroPendiente = {
  id: string
  nombre: string
  comunaId: number | null
  oficio: string
  registradoEn: string
  cedula: DocumentoResumen | null
}

type FilaMaestro = {
  id: string
  perfil: { nombre: string; comuna_id: number | null; creado_en: string } | null
  oficio: { nombre: string } | null
  documentos: DocumentoResumen[] | null
}

/** Rol real del usuario según `perfiles` (no según los metadatos, que el usuario puede editar). */
export async function obtenerRolReal(usuarioId: string): Promise<string | null> {
  const { data, error } = await supabase.from('perfiles').select('rol').eq('id', usuarioId).maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.rol as string | undefined) ?? null
}

/** Maestros con identidad pendiente, del que lleva más tiempo esperando al más reciente. */
export async function listarPendientes(): Promise<MaestroPendiente[]> {
  const { data, error } = await supabase
    .from('maestros')
    .select(
      // El hint `!maestros_id_fkey` evita la ambigüedad con otras rutas maestros→perfiles (contactos, documentos).
      'id, perfil:perfiles!maestros_id_fkey(nombre, comuna_id, creado_en), oficio:oficios(nombre), documentos(id, tipo, estado, ruta_archivo, creado_en)',
    )
    .eq('estado_identidad', 'pendiente')
  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as FilaMaestro[])
    .map((fila) => ({
      id: fila.id,
      nombre: fila.perfil?.nombre ?? 'Sin nombre',
      comunaId: fila.perfil?.comuna_id ?? null,
      oficio: fila.oficio?.nombre ?? 'Sin oficio',
      registradoEn: fila.perfil?.creado_en ?? '',
      cedula: cedulaPorRevisar(fila.documentos ?? []),
    }))
    .sort((a, b) => Date.parse(a.registradoEn) - Date.parse(b.registradoEn))
}

/** URL firmada de corta duración para ver la cédula en el bucket privado. */
export async function urlFirmadaCedula(ruta: string): Promise<string> {
  const { data, error } = await supabase.storage.from('cedulas').createSignedUrl(ruta, SEGUNDOS_URL_FIRMADA)
  if (error || !data) throw new Error(error?.message ?? 'No se pudo generar el enlace a la cédula.')
  return data.signedUrl
}

type Revision = { documentoId: string; maestroId: string; ruta: string; revisorId: string }

async function marcarDocumento(
  documentoId: string,
  cambios: Record<string, unknown>,
): Promise<void> {
  // Solo actualiza si sigue pendiente: evita que dos admins revisen el mismo documento a la vez.
  const { data, error } = await supabase
    .from('documentos')
    .update(cambios)
    .eq('id', documentoId)
    .eq('estado', 'pendiente')
    .select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('Este documento ya fue revisado o no tienes permiso para revisarlo.')
}

async function marcarMaestro(maestroId: string, estado: 'verificada' | 'rechazada'): Promise<void> {
  const { error } = await supabase.from('maestros').update({ estado_identidad: estado }).eq('id', maestroId)
  if (error) throw new Error(error.message)
}

async function auditar(actorId: string, accion: string, objeto: string): Promise<void> {
  const { error } = await supabase.from('auditoria').insert({ actor_id: actorId, accion, objeto })
  if (error) throw new Error(`La revisión se guardó, pero no quedó en auditoría: ${error.message}`)
}

/**
 * Aprueba la identidad: documento aprobado sin archivo (check de la tabla), maestro verificado, archivo
 * borrado del bucket y registro en auditoría (RF-2, §5.3). Si el trigger de Ignacio ya borró el archivo,
 * el `remove` no hace nada.
 */
export async function aprobarIdentidad({ documentoId, maestroId, ruta, revisorId }: Revision): Promise<void> {
  await marcarDocumento(documentoId, {
    estado: 'aprobado',
    ruta_archivo: null,
    revisor_id: revisorId,
    revisado_en: new Date().toISOString(),
  })
  await marcarMaestro(maestroId, 'verificada')

  const { error: errorBorrado } = await supabase.storage.from('cedulas').remove([ruta])
  await auditar(revisorId, 'aprobar_cedula', textoAuditoria(documentoId, maestroId))
  if (errorBorrado) {
    throw new Error(`El maestro quedó verificado, pero el archivo no se pudo borrar: ${errorBorrado.message}`)
  }
}

/**
 * Rechaza la identidad con motivo. La cédula rechazada conserva su archivo hasta la eliminación programada
 * (30 días, según el comentario del esquema). El motivo queda en auditoría, porque `documentos` no tiene columna.
 */
export async function rechazarIdentidad({ documentoId, maestroId, revisorId, motivo }: Revision & { motivo: string }) {
  await marcarDocumento(documentoId, {
    estado: 'rechazado',
    revisor_id: revisorId,
    revisado_en: new Date().toISOString(),
  })
  await marcarMaestro(maestroId, 'rechazada')
  await auditar(revisorId, 'rechazar_cedula', textoAuditoria(documentoId, maestroId, normalizarMotivo(motivo)))
}
