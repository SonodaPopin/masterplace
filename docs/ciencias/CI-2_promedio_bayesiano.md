# CI-2 · Promedio bayesiano de estrellas

Responsable: Hugo. R3-C3 pide: formulación, supuestos, procedimiento, resultados y cómo influyó en el sistema.

## Formulación

B = (n·r + m·C) / (n + m)

n = reseñas válidas del maestro; r = su promedio bruto; C = promedio global de la plataforma; m = peso del promedio
global (E1 propone m = 5).

B es un promedio ponderado entre r y C: con pocas reseñas se acerca a C y con muchas converge a r. Evita que un maestro
con una sola reseña de 5 estrellas aparezca por sobre otro con 40 reseñas de 4,8.

## Supuestos

- Las reseñas válidas están ligadas a un contacto con servicio confirmado (RB-2, RB-7).
- Si no hay reseñas en la plataforma no existe C: se muestra «sin reseñas» y no se inventa un valor.
- B se usa solo para ordenar; no reemplaza la regla del Nivel 2 (≥ 5 reseñas y promedio bruto ≥ 4, RB-3).

## Procedimiento

1. Implementación en `src/lib/reputacion/promedioBayesiano.ts` con pruebas n = 0, 1, 5 y 50.
2. Escenario sintético con varios maestros (por ejemplo, 1 reseña de 5,0; 5 de 4,6; 40 de 4,8) y C = 4,3.
3. Sensibilidad: ordenar con m = 1, 5 y 10 y comparar el orden resultante.

## Resultados

| Maestro | n | r | B (m=1) | B (m=5) | B (m=10) |
|---|---|---|---|---|---|
| A | 1 | 5,0 | | | |
| B | 5 | 4,6 | | | |
| C | 40 | 4,8 | | | |

## Decisión e influencia en el sistema

[Qué m se adopta y por qué; dónde se calcula (TypeScript o SQL) y qué ve el usuario: B, promedio bruto y cantidad.]
