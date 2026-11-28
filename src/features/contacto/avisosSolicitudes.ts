import { supabase } from '../../lib/supabase'
import { avisoDeContacto, type AvisoBandeja, type FilaAviso } from '../../lib/solicitudes/presentacion'

type FilaConContacto = FilaAviso & { contacto_id: string }

/**
 * Aviso de cada conversación de la bandeja («Solicitud pendiente» o «Puedes dejar una reseña»).
 * Dos consultas para toda la bandeja, no una por conversación. RLS solo deja ver las solicitudes propias.
 */
export async function avisosPorContacto(
  contactoIds: string[],
  usuarioId: string,
): Promise<Map<string, AvisoBandeja>> {
  const avisos = new Map<string, AvisoBandeja>()
  if (contactoIds.length === 0) return avisos

  const { data, error } = await supabase
    .from('solicitudes_servicio')
    .select('id, contacto_id, estado, cliente_id, realizada_en')
    .in('contacto_id', contactoIds)
    .in('estado', ['pendiente', 'realizada'])
  if (error) throw new Error(error.message)

  const filas = (data ?? []) as FilaConContacto[]
  const realizadas = filas.filter((f) => f.estado === 'realizada').map((f) => f.id)

  let conResena = new Set<string>()
  if (realizadas.length > 0) {
    const resenas = await supabase.from('resenas').select('solicitud_id').in('solicitud_id', realizadas)
    if (resenas.error) throw new Error(resenas.error.message)
    conResena = new Set(
      (resenas.data ?? []).map((r: { solicitud_id: string | null }) => r.solicitud_id).filter(Boolean) as string[],
    )
  }

  const ahora = new Date()
  for (const id of contactoIds) {
    avisos.set(id, avisoDeContacto(filas.filter((f) => f.contacto_id === id), usuarioId, conResena, ahora))
  }
  return avisos
}
