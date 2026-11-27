import type { NombreIcono } from '../../components/Icono'

export type TipoSello = 'identidad' | 'certificado' | 'reputacion' | 'disponible' | 'ocupado'

type DefinicionSello = { etiqueta: string; ayuda: string; icono?: NombreIcono }

// Texto de cada sello y su explicación (H-03). Lo usa src/components/SellosConfianza.tsx.
export const SELLOS: Record<TipoSello, DefinicionSello> = {
  identidad: {
    etiqueta: 'Identidad verificada',
    ayuda: 'Un administrador de MasterPlace revisó su cédula de identidad.',
    icono: 'escudo',
  },
  certificado: {
    etiqueta: 'Certificado',
    ayuda: 'Acreditó su oficio con un certificado que revisamos.',
    icono: 'herramienta',
  },
  reputacion: {
    etiqueta: 'Buena reputación',
    ayuda: 'Tiene al menos 5 reseñas de clientes, con un promedio de 4 estrellas o más.',
    icono: 'estrella',
  },
  disponible: {
    etiqueta: 'Disponible',
    ayuda: 'Está aceptando trabajos nuevos.',
  },
  ocupado: {
    etiqueta: 'Sin cupo por ahora',
    ayuda: 'Por ahora no está aceptando trabajos nuevos.',
  },
}

// Sellos de un maestro que se muestra en público: la búsqueda y el perfil solo devuelven maestros con la identidad
// verificada y vigente, así que ese sello siempre va.
export function sellosDeMaestro(m: { certificado: boolean; reputacion: boolean; disponible: boolean }): TipoSello[] {
  const sellos: TipoSello[] = ['identidad']
  if (m.certificado) sellos.push('certificado')
  if (m.reputacion) sellos.push('reputacion')
  sellos.push(m.disponible ? 'disponible' : 'ocupado')
  return sellos
}
