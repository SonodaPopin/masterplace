import { createClient } from '@supabase/supabase-js'

// Solo la URL y la clave pública (anon). Nunca poner la service_role en el frontend (RNF-1).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigurado = Boolean(url && anonKey)

export const supabase = createClient(
  url ?? 'http://127.0.0.1:54321',
  anonKey ?? 'falta-configurar-VITE_SUPABASE_ANON_KEY',
)
