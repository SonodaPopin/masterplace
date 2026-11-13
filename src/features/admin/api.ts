// Acceso a datos del panel de moderación (RF-2, RF-8). Responsable: Diego.
//
// Usa es_admin() y las políticas de 20261110000000 (el admin lee maestros pendientes, sus perfiles y documentos,
// y lee y borra en el bucket privado `cedulas`).
//
// Aprobar y rechazar pasan por la función `revisar_identidad` (supabase/migrations/20261113120000).

import { supabase } from '../../lib/supabase'
import {
  cedulaPorRevisar,
  normalizarMotivo,
  SEGUNDOS_URL_FIRMADA,
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

// La revisión la hace la función `revisar_identidad` en la base (migración 20261113120000): comprueba que quien
// llama es admin y, en una sola transacción, actualiza el documento y el maestro y registra en auditoría.
async function revisar(documentoId: string, aprobar: boolean, motivo?: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('revisar_identidad', {
    p_documento_id: documentoId,
    p_aprobar: aprobar,
    p_motivo: motivo ?? null,
  })
  if (error) throw new Error(error.message)
  return (data as string | null) ?? null
}

/**
 * Aprueba la identidad: la cédula queda aprobada y sin ruta, el maestro queda verificado (aparece en la búsqueda)
 * y la revisión queda en auditoría. Después se borra el archivo del bucket (§5.3).
 */
export async function aprobarIdentidad({ documentoId, ruta }: Revision): Promise<void> {
  const rutaGuardada = await revisar(documentoId, true)
  const { error } = await supabase.storage.from('cedulas').remove([rutaGuardada ?? ruta])
  if (error) {
    throw new Error(`El maestro quedó verificado, pero el archivo no se pudo borrar: ${error.message}`)
  }
}

/**
 * Rechaza la identidad con motivo. La cédula rechazada conserva su archivo hasta la eliminación programada.
 * El motivo queda en auditoría, porque `documentos` no tiene columna para él.
 */
export async function rechazarIdentidad({ documentoId, motivo }: Revision & { motivo: string }): Promise<void> {
  await revisar(documentoId, false, normalizarMotivo(motivo))
}
