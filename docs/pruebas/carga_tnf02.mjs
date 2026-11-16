// TNF-02 (parcial): 50 usuarios virtuales contra la API pública de Supabase de MasterPlace.
// Uso: node docs/pruebas/carga_tnf02.mjs <ruta .env.local> <segundos> <usuarios> <salida.json>
import fs from 'node:fs'
import os from 'node:os'

const [envPath, segStr = '900', vuStr = '50', salida = 'carga.json'] = process.argv.slice(2)
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  }),
)
const URL_BASE = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const DURACION = Number(segStr) * 1000
const USUARIOS = Number(vuStr)

const COMUNAS = [
  { id: 8101, lat: -36.8281944, lng: -73.0513694 },
  { id: 8103, lat: -36.917, lng: -73.017 },
  { id: 8107, lat: -36.73861, lng: -72.99389 },
  { id: 8108, lat: -36.84194, lng: -73.10306 },
  { id: 8110, lat: -36.71667, lng: -73.12194 },
  { id: 8112, lat: -36.78833, lng: -73.08667 },
]
const azar = (a) => a[Math.floor(Math.random() * a.length)]
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function pedir(url, init) {
  const r = await fetch(url, { ...init, headers: H })
  const cuerpo = await r.text()
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${cuerpo.slice(0, 120)}`)
  return cuerpo ? JSON.parse(cuerpo) : null
}

// Datos de partida: oficios y maestros verificados (lo que ve un visitante).
const oficios = (await pedir(`${URL_BASE}/rest/v1/oficios?select=id`)).map((o) => o.id)
const maestros = (await pedir(`${URL_BASE}/rest/v1/maestros?select=id&estado_identidad=eq.verificada`)).map((m) => m.id)

async function busqueda() {
  const c = azar(COMUNAS)
  const dLat = (Math.random() - 0.5) * 0.02
  const dLng = (Math.random() - 0.5) * 0.02
  const filas = await pedir(`${URL_BASE}/rest/v1/rpc/buscar_maestros`, {
    method: 'POST',
    body: JSON.stringify({ p_oficio_id: Math.random() < 0.3 ? null : azar(oficios), p_comuna_id: c.id, p_lat: c.lat + dLat, p_lng: c.lng + dLng }),
  })
  return Array.isArray(filas) ? filas.length : 0
}

async function perfil() {
  const id = azar(maestros)
  await Promise.all([
    pedir(`${URL_BASE}/rest/v1/maestros?select=id,descripcion,anios_experiencia,disponible,certificado_ok,perfiles(nombre),oficios(nombre)&id=eq.${id}&estado_identidad=eq.verificada`),
    pedir(`${URL_BASE}/rest/v1/rpc/obtener_resenas_maestro`, { method: 'POST', body: JSON.stringify({ p_maestro_id: id }) }),
    pedir(`${URL_BASE}/rest/v1/rpc/obtener_estadisticas_reputacion`, { method: 'POST', body: JSON.stringify({ p_maestro_id: id }) }),
  ])
  return 1
}

const muestras = { busqueda: [], perfil: [] }
const errores = { busqueda: 0, perfil: 0 }
const ejemplosError = []
const inicio = Date.now()
const fin = inicio + DURACION

async function usuario() {
  await espera(Math.random() * 3000) // arranque escalonado
  while (Date.now() < fin) {
    const op = Math.random() < 0.75 ? 'busqueda' : 'perfil' // 60:20 de la mezcla de E1
    const t0 = performance.now()
    try {
      await (op === 'busqueda' ? busqueda() : perfil())
      muestras[op].push(performance.now() - t0)
    } catch (e) {
      errores[op]++
      if (ejemplosError.length < 5) ejemplosError.push(`${op}: ${e.message}`)
    }
    await espera(1000 + Math.random() * 2000) // tiempo de lectura entre acciones: 1 a 3 s
  }
}

await Promise.all(Array.from({ length: USUARIOS }, usuario))

function resumen(xs, err) {
  const s = [...xs].sort((a, b) => a - b)
  const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] : null)
  const total = s.length + err
  return {
    peticiones: total,
    correctas: s.length,
    errores: err,
    tasa_error_pct: total ? +((100 * err) / total).toFixed(3) : null,
    p50_ms: q(50) && Math.round(q(50)),
    p95_ms: q(95) && Math.round(q(95)),
    p99_ms: q(99) && Math.round(q(99)),
    max_ms: s.length ? Math.round(s[s.length - 1]) : null,
  }
}

const r = {
  fecha_inicio: new Date(inicio).toISOString(),
  duracion_s: Math.round((Date.now() - inicio) / 1000),
  usuarios_virtuales: USUARIOS,
  equipo: `${os.type()} ${os.release()}, ${os.cpus()[0]?.model}, ${os.cpus().length} núcleos, ${Math.round(os.totalmem() / 2 ** 30)} GB`,
  node: process.version,
  datos: { oficios: oficios.length, maestros_verificados: maestros.length },
  busqueda: resumen(muestras.busqueda, errores.busqueda),
  perfil: resumen(muestras.perfil, errores.perfil),
  ejemplos_error: ejemplosError,
}
fs.writeFileSync(salida, JSON.stringify(r, null, 2))
console.log(JSON.stringify(r, null, 2))
