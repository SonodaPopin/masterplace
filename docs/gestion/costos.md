# Costos: estimado versus ejecutado

Responsable: Joaquín. Insumo de R3-C6 ("costo estimado versus ejecutado con desglose, desviaciones y su causa").

## Dinero (techo E1: $30.000 CLP al mes, $90.000 en 3 meses)

| Ítem | Estimado mensual (E1, Tabla 32) | Ejecutado a la fecha | Plan o cuota usada | Observación |
|---|---|---|---|---|
| Supabase (Auth, PostgreSQL, Storage, Realtime) | $0 (plan Free) | $0 | Plan Free. Ciclo 25-10 a 25-11: base de datos 34,98 MB de 500 MB (7 %); Storage < 0,1 MB de 1 GB; tráfico 0,003 GB; 15 usuarios activos; pico de 2 conexiones Realtime | Lectura del panel de uso el 15-11. Muy lejos de los límites |
| Vercel (frontend) | $0 (Hobby) | $0 | Hobby [confirmar en el panel de Vercel, Joaquín] | Uso académico, no comercial |
| Respaldos | $5.000 | $0 | No contratado | El plan Free no incluye respaldos descargables; para E4, exportar la base con `pg_dump` sin costo |
| Correo y cartografía | $10.000 | $0 | Correo de Supabase Auth (incluido) y teselas de OpenStreetMap | Sin costo; se respeta la política de uso de OSM |
| Contingencia | $15.000 | $0 | Sin uso | |
| **Total** | **$30.000** | **$0** | | Desviación: −$30.000 al mes |

## Esfuerzo

| Concepto | Estimado | Ejecutado | Fuente |
|---|---|---|---|
| Horas-persona a la fecha (S6, 9 al 15-11) | 240 h | ≈ 82 h | `registro_horas.md` (Ignacio y Diego registradas; el resto estimadas desde los commits) |
| Valor ($5.000 por hora) | $1.200.000 | ≈ $410.000 | |

## Desviaciones y causa

- **Dinero (−$30.000 al mes):** todo el prototipo cabe en los planes gratuitos de Supabase y Vercel, y el uso real está
  muy lejos de sus límites. Los ítems de respaldos, correo y contingencia no se necesitaron en el piloto. Si en E4 crece
  el uso, el primer límite cercano sería el de la base de datos (hoy 7 %).
- **Esfuerzo (≈ −158 h en la semana 6):** la implementación empezó el 9-11 y no el 12-10, como indicaba la Gantt de E1
  (R-09), y el registro de horas es parcial: salvo Ignacio y Diego, se estimó desde los commits y no incluye reuniones ni
  trabajo sin commit. Cada integrante debe confirmar o corregir sus horas.
