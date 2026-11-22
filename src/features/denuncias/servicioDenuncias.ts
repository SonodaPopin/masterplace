// RF-12 (denunciar reseñas) y RF-8 (moderación de denuncias). Responsable: Diego.
//
// Contrato para las pantallas (Gabriel) y las pruebas (Hugo). La base aplica las reglas en
// supabase/migrations/20261123000000_denuncias.sql: solo el maestro reseñado denuncia, una vez por reseña,
// y solo el admin lista y resuelve. Si se acepta, la reseña se oculta y deja de contar en el promedio.

import { supabase } from '../../lib/supabase'

export type MotivoDenuncia = 'ofensiva' | 'falsa' | 'datos_personales' | 'otro'

export type DenunciaPendiente = {
  id: string
  motivo: MotivoDenuncia
  detalle: string | null
  creadaEn: string
  resena: { id: string; calificacion: number; comentario: string | null; creadaEn: string }
  maestroNombre: string
}

/** Textos para el selector de motivo. */
export const MOTIVOS_DENUNCIA: { valor: MotivoDenuncia; texto: string }[] = [
  { valor: 'ofensiva', texto: 'Es ofensiva o usa insultos' },
  { valor: 'falsa', texto: 'Es falsa: el servicio no fue así' },
  { valor: 'datos_personales', texto: 'Publica datos personales' },
  { valor: 'otro', texto: 'Otro motivo' },
]

export const MAX_DETALLE_DENUNCIA = 500

type FilaDenuncia = {
  id: string
  motivo: MotivoDenuncia
  detalle: string | null
  creada_en: string
  resena_id: string
  resena_calificacion: number
  resena_comentario: string | null
  resena_creada_en: string
  maestro_nombre: string
}

/** Convierte los errores de las funciones de la base en mensajes para la interfaz. */
export function traducirErrorDenuncia(mensaje: string): string {
  if (mensaje.includes('USUARIO_NO_AUTENTICADO')) return 'Debes iniciar sesión para denunciar una reseña.'
  if (mensaje.includes('SOLO_MAESTRO_RESENADO')) return 'Solo el maestro que recibió la reseña puede denunciarla.'
  if (mensaje.includes('YA_DENUNCIADA')) return 'Ya denunciaste esta reseña. El equipo la está revisando.'
  if (mensaje.includes('DETALLE_MUY_LARGO')) return `El detalle no puede superar los ${MAX_DETALLE_DENUNCIA} caracteres.`
  if (mensaje.includes('SOLO_ADMIN')) return 'Solo un administrador puede revisar denuncias.'
  if (mensaje.includes('DENUNCIA_NO_EXISTE')) return 'La denuncia ya no existe.'
  if (mensaje.includes('DENUNCIA_YA_RESUELTA')) return 'Otra persona ya resolvió esta denuncia.'
  if (mensaje.includes('row-level security') || mensaje.includes('permission denied')) {
    return 'No tienes permiso para realizar esta acción.'
  }
  return 'No fue posible completar la acción. Inténtalo nuevamente.'
}

/** RF-12: el maestro denuncia una reseña de su perfil. `detalle` es opcional (máximo 500 caracteres). */
export async function denunciarResena(resenaId: string, motivo: MotivoDenuncia, detalle?: string): Promise<void> {
  const texto = detalle?.trim()
  if (texto && texto.length > MAX_DETALLE_DENUNCIA) throw new Error(traducirErrorDenuncia('DETALLE_MUY_LARGO'))

  const { error } = await supabase.rpc('denunciar_resena', {
    p_resena_id: resenaId,
    p_motivo: motivo,
    p_detalle: texto || null,
  })
  if (error) throw new Error(traducirErrorDenuncia(error.message))
}

/** RF-8: denuncias pendientes, de la más antigua a la más reciente. Solo admin. */
export async function listarDenunciasPendientes(): Promise<DenunciaPendiente[]> {
  const { data, error } = await supabase.rpc('listar_denuncias_pendientes')
  if (error) throw new Error(traducirErrorDenuncia(error.message))

  return ((data ?? []) as FilaDenuncia[]).map((fila) => ({
    id: fila.id,
    motivo: fila.motivo,
    detalle: fila.detalle,
    creadaEn: fila.creada_en,
    resena: {
      id: fila.resena_id,
      calificacion: fila.resena_calificacion,
      comentario: fila.resena_comentario,
      creadaEn: fila.resena_creada_en,
    },
    maestroNombre: fila.maestro_nombre,
  }))
}

/** RF-8: el admin acepta (la reseña se oculta) o descarta una denuncia. Queda en `auditoria`. */
export async function resolverDenuncia(id: string, aceptar: boolean): Promise<void> {
  const { error } = await supabase.rpc('resolver_denuncia', { p_id: id, p_aceptar: aceptar })
  if (error) throw new Error(traducirErrorDenuncia(error.message))
}
