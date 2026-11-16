// D-01: Supabase (PostgREST) devuelve una relación «a uno» (maestros → perfiles, maestros → oficios) como objeto, no
// como lista. El perfil público leía `perfiles[0].nombre` y por eso mostraba «Maestro verificado» y «Oficio no
// disponible». Esta función acepta las dos formas, para no depender de cómo infiera la relación PostgREST.
export type Relacion = { nombre: string | null } | { nombre: string | null }[] | null | undefined

export function nombreDeRelacion(relacion: Relacion): string | null {
  const fila = Array.isArray(relacion) ? relacion[0] : relacion
  const nombre = fila?.nombre?.trim()
  return nombre ? nombre : null
}
