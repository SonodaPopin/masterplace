import { matchPath } from 'react-router-dom'

const MARCA = 'MasterPlace'

// Título de cada ruta (WCAG 2.4.2). La primera que coincide gana.
const TITULOS: { patron: string; titulo: string }[] = [
  { patron: '/', titulo: 'Maestros verificados cerca de ti' },
  { patron: '/registro/cliente', titulo: 'Crear cuenta de cliente' },
  { patron: '/registro/maestro', titulo: 'Registro de maestro' },
  { patron: '/ingresar', titulo: 'Ingresar' },
  { patron: '/admin', titulo: 'Moderación' },
  { patron: '/contactos', titulo: 'Mensajes' },
  { patron: '/contactos/:contactoId/resena', titulo: 'Nueva reseña' },
  { patron: '/contactos/:contactoId', titulo: 'Conversación' },
  { patron: '/prueba/:token', titulo: 'Prueba de la página' },
]

export function tituloDeRuta(pathname: string): string {
  const ruta = TITULOS.find((t) => matchPath({ path: t.patron, end: true }, pathname))
  return ruta ? `${ruta.titulo} · ${MARCA}` : MARCA
}
