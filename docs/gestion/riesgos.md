# Registro de riesgos (vivo)

Base: E1 §12, Tabla 37. Se revisa en cada reunión. Estados posibles: Identificado, Vigilado, **Materializado**
(con acción aplicada) y Cerrado.

| ID | Riesgo | P/I | Mitigación | Disparador | Responsable | Estado al 8-11 |
|---|---|---|---|---|---|---|
| R-01 Técnica | Dificultad para integrar React, Supabase, Leaflet y el chat | M/A | Integrar por módulos; Integraciones 1 y 2 (11-11 y 13-11) | Dos tareas críticas bloqueadas más de dos días | Pedro | Vigilado |
| R-02 Datos | Coberturas o coordenadas incorrectas | M/M | Validar comunas; probar referencias conocidas (CI-1) | Dos o más casos de distancia incorrecta | Ignacio y Gabriel | Identificado |
| R-03 Validación | No conseguir participantes o reclutar solo estudiantes | M/A | Agendar el 9-11; suplentes | Menos de 5 confirmados el 12-11 | Gabriel | [CONFIRMAR: ¿se hicieron las entrevistas de concepto del 12 al 18-10? Si no, queda Materializado] |
| R-04 Legal y privacidad | Exposición de cédulas o mensajes | M/A | RLS, buckets privados, borrado al aprobar, TNF-01 | Archivo privado accesible sin autorización | Ignacio | Vigilado |
| R-05 Ética e inclusión | Confundir identidad con calidad garantizada | M/A | Señales separadas; preguntar en la validación | Un participante no distingue identidad de certificación | Hugo y Gabriel | Identificado |
| R-06 Equipo | Sobrecarga o ausencia de un integrante | M/A | Revisión cruzada; seguimiento diario | Tarea sin avance dos días seguidos | Diego | Vigilado |
| R-07 Infraestructura | Caída o pausa de Supabase o Vercel | M/A | Monitor cada 5 min; plan B local para la demo | Disponibilidad < 95 % | Joaquín | Identificado |
| R-08 Terceros y costo | Cuotas o condiciones incompatibles | M/A | Medir cuotas; no activar pagos sin cotizar | Costo previsto > $30.000 al mes | Joaquín | Identificado |
| R-09 Calendario | E3 adelantada al 17-11 sin código iniciado al 8-11 | A/A | Plan de 8 días con recorte definido (`PLAN_E3.md`) | Integración 2 no lista el 13-11 | Diego | **Materializado:** replanificado el 8-11 |
