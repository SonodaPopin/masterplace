import { supabase } from '../../lib/supabase'

/** Convierte errores controlados por la función RF-4 en mensajes para la interfaz. */
export function traducirErrorContacto(mensaje: string): string {
  if (mensaje.includes('USUARIO_NO_AUTENTICADO')) {
    return 'Debes iniciar sesión para contactar a un maestro.'
  }
  if (mensaje.includes('SOLO_CLIENTE')) {
    return 'Solo las cuentas de cliente pueden iniciar un contacto.'
  }
  if (mensaje.includes('MAESTRO_NO_CONTACTABLE')) {
    return 'Este maestro no está disponible o todavía no tiene su identidad verificada.'
  }
  if (mensaje.includes('row-level security') || mensaje.includes('permission denied')) {
    return 'No tienes permiso para realizar esta acción.'
  }
  return 'No fue posible iniciar el contacto. Inténtalo nuevamente.'
}

/**
 * RF-4: crea o reutiliza el contacto abierto entre el cliente autenticado y el maestro.
 * La base de datos obtiene al cliente desde auth.uid() y valida identidad/disponibilidad.
 */
export async function crearOReutilizarContacto(maestroId: string): Promise<string> {
  const { data, error } = await supabase.rpc('crear_o_reutilizar_contacto', {
    p_maestro_id: maestroId,
  })

  if (error) throw new Error(traducirErrorContacto(error.message))
  if (typeof data !== 'string' || data.length === 0) {
    throw new Error('Supabase no devolvió un identificador de contacto válido.')
  }

  return data
}
