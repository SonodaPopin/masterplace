# Registro de decisiones de arquitectura (ADR)

Un archivo por decisión: `ADR-NNN-titulo-corto.md`. Una vez aceptado, un ADR no se edita; si la decisión cambia, se
escribe uno nuevo que lo reemplaza. La bitácora de ADR "completa y fechada" se evalúa en R4-C4.

| ADR | Título | Estado | Fecha |
|---|---|---|---|
| [001](ADR-001-arquitectura-alt2.md) | Arquitectura ALT-2: React + TypeScript + Supabase | Aceptado | E2 |

## Plantilla

```markdown
# ADR-NNN · Título

- Estado: Propuesto | Aceptado | Reemplazado por ADR-XXX
- Fecha:
- Autor:

## Contexto
Qué problema o restricción obliga a decidir. Requisitos y restricciones involucrados (RF, RNF, Tabla 11).

## Alternativas
1. ...
2. ...

## Decisión
Qué se eligió.

## Consecuencias y trade-off
"Se sacrificó X para obtener Y, por la restricción Z." Riesgos nuevos.

## Verificación
Cómo se comprobará que fue la decisión correcta (prueba, medición).
```
