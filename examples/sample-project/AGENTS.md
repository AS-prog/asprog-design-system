# AGENTS.md

## Rol

Este repo (`riego-management`) es el punto de diseño y gestión del controlador de riego y la fuente de verdad de `riego-controller`. Es un **proyecto de ejemplo** del plugin `documentation`: el contenido es ficticio.

## Dónde escribe cada agente

| Qué | Dónde | Repo |
|---|---|---|
| Diseño de nivel 1 y nivel 2 | `diseno/nivel-1/`, `diseno/nivel-2/` | riego-management |
| Decisiones y ADR | `decisiones/` | riego-management |
| Documentos fechados | `registro/<tema>/<AAAA-MM-DD>-<tipo>-<objeto>/` | riego-management |
| Páginas técnicas vivas | `tecnica/<componente>/` | riego-management |
| Fichas e incidencias | `.scratch/<área>/<tema>/` | riego-management |
| Código, tests, configuración y glosario | raíz | riego-controller |

## Cómo trabajas

- Idioma: español. Código en inglés, comentarios en español, logs en inglés.
- El método es el del plugin `documentation` (skill `method`).
- El sitio: `docs/site/site.toml`, regenerado con la skill `site`.
