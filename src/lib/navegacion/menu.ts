import type { Rol } from '../auth/contexto'

export type EnlaceMenu = { a: string; texto: string; fin: boolean }

const BUSCAR: EnlaceMenu = { a: '/', texto: 'Buscar maestros', fin: true }
const SOY_MAESTRO: EnlaceMenu = { a: '/registro/maestro', texto: 'Soy maestro', fin: false }
const MI_REGISTRO: EnlaceMenu = { a: '/registro/maestro', texto: 'Mi registro', fin: false }
const MENSAJES: EnlaceMenu = { a: '/contactos', texto: 'Mensajes', fin: false }
const MODERACION: EnlaceMenu = { a: '/admin', texto: 'Moderación', fin: false }

/**
 * Enlaces del menú principal según quién está conectado. Solo ordena la interfaz: el acceso real lo deciden las
 * políticas RLS y cada página.
 *  - Visitante: buscar y la invitación a registrarse como maestro.
 *  - Cliente: buscar, sus mensajes y «Soy maestro» (le explica que necesita otra cuenta para ofrecer servicios).
 *  - Maestro: no busca a otros maestros; ve sus mensajes y el estado de su registro.
 *  - Admin: moderación primero y la búsqueda para revisar lo publicado.
 * Mientras se conoce el rol de una sesión, el menú queda vacío para no mostrar enlaces que luego desaparecen.
 */
export function enlacesDelMenu(estado: { conSesion: boolean; cargando: boolean; rol: Rol | null }): EnlaceMenu[] {
  if (!estado.conSesion) return estado.cargando ? [] : [BUSCAR, SOY_MAESTRO]
  if (estado.cargando) return []
  switch (estado.rol) {
    case 'cliente':
      return [BUSCAR, MENSAJES, SOY_MAESTRO]
    case 'maestro':
      return [MENSAJES, MI_REGISTRO]
    case 'admin':
      return [MODERACION, BUSCAR]
    default:
      return [BUSCAR]
  }
}

/** Página de inicio de cada rol: el maestro empieza en sus mensajes; el resto, en la búsqueda. */
export function inicioDelRol(rol: Rol | null): string {
  return rol === 'maestro' ? '/contactos' : '/'
}
