// Acceso a datos de la validación con usuarios (migración 20261114000000_validacion_usuarios.sql).
// La app nunca lee ni escribe las tablas directamente: solo usa las dos funciones, que exigen un token válido.

import { supabase } from '../../lib/supabase'
import type { Perfil, Respuestas } from '../../lib/validacion/guion'

export type Participante = { codigo: string; perfil: Perfil; respuestas: Respuestas }

const FORMATO_TOKEN = /^[a-f0-9]{24}$/

export function tokenValido(token: string): boolean {
  return FORMATO_TOKEN.test(token)
}

/** Datos y avance del participante, o null si el enlace no existe. */
export async function obtenerParticipante(token: string): Promise<Participante | null> {
  if (!tokenValido(token)) return null
  const { data, error } = await supabase.rpc('validacion_obtener', { p_token: token })
  if (error) throw new Error('No pudimos cargar la prueba. Revise su conexión e intente de nuevo.')
  if (!data) return null
  const fila = data as { codigo: string; perfil: Perfil; respuestas: Respuestas | null }
  return { codigo: fila.codigo, perfil: fila.perfil, respuestas: fila.respuestas ?? {} }
}

export async function guardarRespuesta(token: string, clave: string, valor: unknown): Promise<void> {
  const { error } = await supabase.rpc('validacion_guardar', { p_token: token, p_clave: clave, p_valor: valor })
  if (!error) return
  if (error.message.includes('ENLACE_INVALIDO')) throw new Error('Este enlace de prueba no es válido.')
  throw new Error('No pudimos guardar su respuesta. Revise su conexión e intente de nuevo.')
}
