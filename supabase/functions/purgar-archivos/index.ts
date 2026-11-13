// Borra de Storage los archivos anotados en `archivos_por_borrar` (cédulas aprobadas, RF-2).
// Usa la API de Storage porque borrar por SQL deja el archivo físico huérfano.
// Es idempotente y segura de llamar varias veces: solo toca archivos ya marcados para borrar.
//
// Despliegue:  supabase functions deploy purgar-archivos
// Llamada (después de aprobar una cédula, o por cron como reintento):
//   await supabase.functions.invoke('purgar-archivos')

import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async () => {
  // SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las inyecta Supabase en las Edge Functions.
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: filas, error } = await sb
    .from('archivos_por_borrar')
    .select('id, bucket, ruta')
    .is('borrado_en', null)
    .order('id')
    .limit(200)

  if (error) return json({ error: error.message }, 500)
  if (!filas?.length) return json({ pendientes: 0, borrados: 0 })

  // remove() acepta hasta 1000 rutas por llamada; una llamada por bucket.
  const porBucket = new Map<string, { id: number; ruta: string }[]>()
  for (const f of filas) {
    porBucket.set(f.bucket, [...(porBucket.get(f.bucket) ?? []), { id: f.id, ruta: f.ruta }])
  }

  const confirmados: number[] = []
  const fallos: string[] = []
  for (const [bucket, items] of porBucket) {
    const { error: e } = await sb.storage.from(bucket).remove(items.map((i) => i.ruta))
    if (e) fallos.push(`${bucket}: ${e.message}`)      // queda pendiente: se reintenta
    else confirmados.push(...items.map((i) => i.id))
  }

  if (confirmados.length) {
    const { error: e } = await sb.rpc('confirmar_borrado_archivos', { p_ids: confirmados })
    if (e) fallos.push(`confirmar: ${e.message}`)
  }

  return json({ pendientes: filas.length, borrados: confirmados.length, fallos }, fallos.length ? 207 : 200)
})