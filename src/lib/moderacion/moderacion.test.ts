import { describe, expect, it } from 'vitest'
import {
  cedulaPorRevisar,
  diasEsperando,
  MOTIVO_MAX,
  normalizarMotivo,
  textoAuditoria,
  textoEspera,
  tipoArchivo,
  validarMotivo,
  type DocumentoResumen,
} from './moderacion'

const doc = (parcial: Partial<DocumentoResumen>): DocumentoResumen => ({
  id: 'd1',
  tipo: 'cedula',
  estado: 'pendiente',
  ruta_archivo: 'maestro-1/cedula.jpg',
  creado_en: '2026-11-10T10:00:00Z',
  ...parcial,
})

describe('cedulaPorRevisar (RF-2)', () => {
  it('devuelve null si no hay documentos', () => {
    expect(cedulaPorRevisar([])).toBeNull()
  })

  it('ignora certificados, cédulas ya revisadas y cédulas sin archivo', () => {
    expect(
      cedulaPorRevisar([
        doc({ id: 'cert', tipo: 'certificado' }),
        doc({ id: 'aprob', estado: 'aprobado', ruta_archivo: null }),
        doc({ id: 'rech', estado: 'rechazado' }),
        doc({ id: 'borrada', ruta_archivo: null }),
      ]),
    ).toBeNull()
  })

  it('elige la cédula pendiente más reciente', () => {
    const elegida = cedulaPorRevisar([
      doc({ id: 'vieja', creado_en: '2026-11-09T10:00:00Z' }),
      doc({ id: 'nueva', creado_en: '2026-11-10T12:00:00Z' }),
      doc({ id: 'media', creado_en: '2026-11-10T08:00:00Z' }),
    ])
    expect(elegida?.id).toBe('nueva')
  })
})

describe('validarMotivo (RF-8)', () => {
  it('exige motivo', () => {
    expect(validarMotivo('')).toBeDefined()
    expect(validarMotivo('    \n ')).toBeDefined()
  })

  it('rechaza motivos muy cortos o muy largos', () => {
    expect(validarMotivo('borrosa')).toMatch(/al menos/)
    expect(validarMotivo('a'.repeat(MOTIVO_MAX + 1))).toMatch(/superar/)
  })

  it('acepta un motivo claro', () => {
    expect(validarMotivo('La foto está borrosa y no se lee el número')).toBeUndefined()
  })
})

describe('normalizarMotivo y textoAuditoria', () => {
  it('colapsa espacios y saltos de línea', () => {
    expect(normalizarMotivo('  no   coincide\n\nel nombre ')).toBe('no coincide el nombre')
  })

  it('identifica documento y maestro sin incluir la ruta del archivo', () => {
    const texto = textoAuditoria('d1', 'm1')
    expect(texto).toBe('documento:d1 maestro:m1')
    expect(texto).not.toMatch(/\.jpg|\//)
  })

  it('agrega el motivo normalizado cuando es rechazo', () => {
    expect(textoAuditoria('d1', 'm1', ' foto   borrosa ')).toBe('documento:d1 maestro:m1 motivo: foto borrosa')
  })
})

describe('tipoArchivo', () => {
  it('reconoce imágenes y PDF sin importar mayúsculas', () => {
    expect(tipoArchivo('m1/cedula.JPG')).toBe('imagen')
    expect(tipoArchivo('m1/cedula.webp')).toBe('imagen')
    expect(tipoArchivo('m1/cedula.pdf')).toBe('pdf')
  })

  it('ignora la query de una URL firmada', () => {
    expect(tipoArchivo('https://x.supabase.co/storage/v1/object/sign/cedulas/m1/c.png?token=abc')).toBe('imagen')
  })

  it('devuelve otro para extensiones desconocidas o sin extensión', () => {
    expect(tipoArchivo('m1/cedula.heic')).toBe('otro')
    expect(tipoArchivo('m1/cedula')).toBe('otro')
  })
})

describe('diasEsperando y textoEspera', () => {
  const ahora = new Date('2026-11-12T12:00:00Z')

  it('cuenta días completos', () => {
    expect(diasEsperando('2026-11-12T08:00:00Z', ahora)).toBe(0)
    expect(diasEsperando('2026-11-11T11:00:00Z', ahora)).toBe(1)
    expect(diasEsperando('2026-11-09T12:00:00Z', ahora)).toBe(3)
  })

  it('no devuelve negativos ni NaN', () => {
    expect(diasEsperando('2026-11-13T00:00:00Z', ahora)).toBe(0)
    expect(diasEsperando('no es fecha', ahora)).toBe(0)
  })

  it('redacta la espera', () => {
    expect(textoEspera(0)).toBe('Hoy')
    expect(textoEspera(1)).toBe('Hace 1 día')
    expect(textoEspera(4)).toBe('Hace 4 días')
  })
})
