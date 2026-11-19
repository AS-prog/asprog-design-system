---
title: Cómo se documenta
lede: La documentación de este repo es este sitio. Se escribe en Markdown y se cambia por PR.
date: {{AAAA-MM-DD}}
---

## Dónde va cada cosa

- El texto, en `docs/site/content/<sección>/<página>.md`, con su frontmatter (`title`, `lede`, `date`).
- Los diagramas, en `docs/site/figs/` como SVG con `role="img"`, `<title>`, `<desc>` y clases `d-*`. Se insertan con un bloque `figure`.
- El mapa, en `docs/site/site.toml`. Cada `.md` tiene que estar en él, y al revés.

## Cómo se comprueba

`site-md check` valida sin escribir. `site-md build` genera `docs/site/dist/` y le pasa `delphos-check`.

## Un artefacto suelto

Es un borrador. Si queda, se migra aquí con `site-md migrate` y el artefacto se marca como movido.
