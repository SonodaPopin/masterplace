/**
 * Reglas de tiempo de las solicitudes de servicio.
 * Son las MISMAS cifras que aplica la base de datos:
 *   - marcar_realizada: now() >= fecha_acordada + interval '2 hours'
 *   - reseña (tarea 2): realizada_en >= now() - interval '30 days'
 * Si cambias una cifra aquí, cámbiala también en la migración.
 */

export const HORAS_ESPERA_REALIZADA = 2;
export const DIAS_PLAZO_RESENA = 30;

const MS_POR_HORA = 60 * 60 * 1000;
const MS_POR_DIA = 24 * MS_POR_HORA;

type Fecha = Date | string;

function aMs(fecha: Fecha): number {
  return (fecha instanceof Date ? fecha : new Date(fecha)).getTime();
}

/** Desde 2 horas después de la fecha acordada (el límite exacto ya vale). */
export function puedeMarcarseRealizada(
  fechaAcordada: Fecha,
  ahora: Fecha = new Date(),
): boolean {
  return aMs(ahora) >= aMs(fechaAcordada) + HORAS_ESPERA_REALIZADA * MS_POR_HORA;
}

/** Hasta 30 días después de realizada (el límite exacto todavía vale). */
export function dentroDelPlazoDeResena(
  realizadaEn: Fecha | null | undefined,
  ahora: Fecha = new Date(),
): boolean {
  if (!realizadaEn) return false;
  return aMs(ahora) <= aMs(realizadaEn) + DIAS_PLAZO_RESENA * MS_POR_DIA;
}