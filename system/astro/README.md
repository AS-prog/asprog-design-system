# Componentes Astro

Delphos para proyectos Astro. Viven en el mismo paquete que las hojas, así que hay una sola fuente: los componentes pintan el marcado que estilan `tokens.css`, `css/base.css` y `css/document.css`, y un documento hecho con ellos es idéntico a uno hecho con `template.html`. Quien no usa Astro no necesita nada de esta carpeta.

## Instalar

```sh
npm install github:AS-prog/asprog-design-system astro three
```

`astro` y `three` son dependencias opcionales del paquete: `three` solo hace falta para `CubeFigure`.

```astro
---
import { DocumentLayout, Notice, Table } from 'asprog-design-system/astro';
---
```

`DocumentLayout` importa las tres hojas. Si usas las piezas sueltas dentro de otro layout, importa tú `asprog-design-system/tokens.css`, `…/css/base.css` y `…/css/document.css`, en ese orden.

## Piezas

| Componente | Marcado | Props |
|---|---|---|
| `DocumentLayout` | la página entera: `<html data-theme="auto">`, `<head>` y `Document` | las de `Document` + `description`, `lang`; como `layout:` de un `.md`, `frontmatter` y `headings` llegan solos. Slots `head`, `header`, `footer` |
| `Document` | `.doc` con barra, cabecera, índice, prosa y pie | `title`, `lede`, `meta` (`source`, `agent`, `date`, `status`, `extra`), `tags`, `toc`, `brand`, `brandHref`, `credit` |
| `Prose` | `article.doc-prose` | slot |
| `Toc` | `nav.doc-toc`, solo con cuatro entradas o más | `items` (`id`, `text`), `min`, `title` |
| `Notice` | `div.notice` + `span.notice-title` | `type` (`note`, `important`, `risk`, `pending`), `title`, `ticket` |
| `Table` | `table`, en `div.table-wrap` si es ancha | `caption`, `columns` (texto o `{ label, numeric }`), `rows`, `rowHeader`, `wide`; o el `thead`/`tbody` en el slot |
| `Code` | `p.code-title` + `pre > code` | `code` (texto), o `html` (marcado con `.hl-k`, `.hl-s`, `.hl-n`, `.hl-c`), `title`, `lang` |
| `Tag`, `Tags` | `a.tag` / `span.tag`, `ul.tags` | `href`, `solid`; `items`, `hrefBase` |
| `Collection` | `ul.collection` | `items` (`title`, `href`, `summary`, `date`, `meta`), `sort` |
| `ThemeToggle` | `button.doc-theme` (documento) o `button.theme` con sol y luna (web) | `variant` (`document`, `site`), `label` |
| `ThemeScript` | el `<script>` que aplica el tema guardado antes de pintar | — |
| `CubeFigure` | la figura de los catorce cubos: SVG en línea, lienzo WebGL y, debajo, los botones de girar, restablecer y pausar; la instancia montada queda en la propiedad `figure` del contenedor | `label`, `id` (el lienzo lleva `<id>-canvas`), `controls`, `fit`, `engine` (con `false`, la figura es el SVG), `animate` (con `engine={false}`, la entrada de los cubos sobre el SVG; por defecto sí), `autoplay` (con `false`, la pila queda hecha hasta que alguien la toca), `class` |

### La web

Las piezas de la web (las usa andresrsotelo.dev). Pintan el marcado que estila `css/site.css` (más `.eyebrow` y `.btn` de `base.css`); los textos que son del proyecto (destinos, pie, correo) llegan por props o slots.

| Componente | Marcado | Props |
|---|---|---|
| `SiteLayout` | la página entera: `<html>` sin `data-theme` (parte del claro), las hojas tokens → base → site, `a.skip-link`, `header.nav` con `ThemeToggle variant="site"`, `main#main`, `footer.site-footer`; carga `grid.js` | `title`, `description`, `links` (`href`, `label`), `nav`, `lang`, `skipLabel`. Slots `head`, `footer` |
| `PageHead` | `header.page-head` | `title`, `lede`. Slot `meta` |
| `HomeIntro` | `section.home-intro` a dos columnas | `title`, `lede`, `align` (`start`, `center`). Slot por defecto (tras la entradilla) y slot `figure` |
| `Eyebrow` | `p.eyebrow` | slot |
| `CaseCard` | `article.case` con `details` | `context`, `title`, `summary`, `href`, `details` (`term`, `text`), `closing`, `headingLevel`, `detailsLabel`, `moreLabel` |
| `CaseHeader` | `a.back` + `header.case-head` con ficha | `context`, `title`, `meta` (`term`, `text`), `backHref`, `backLabel` |
| `CaseSection` | `section.case-section` | `title`, `paragraphs` (admiten marcado en línea). Slot |
| `Results` | `div.results` | `items` (`title`, `text`) |
| `Steps` | `ol.steps` numerada | `items` (`title`, `text`, `href`, `linkLabel`), `headingLevel`, `linkLabel` |
| `TechList` | `ul.tech` | `items` |
| `Resume` | `article.resume` con `header.resume-head` (nombre, lugar, declaración, `ul.resume-contact`) | `name`, `where`, `claim`, `contact` (`href`, `label`). Slot |
| `ResumeSection` | `section.resume-section` con `h2` | `title`. Slot |
| `ResumeEntries` | `ul.resume-entries`: fecha y duración en mono a la izquierda, cuerpo a la derecha, regla entre entradas | `items` (`when`, `duration`, `title`, `meta`, `lead`, `points` con `label` y `text`), `headingLevel` |
| `ResumeTools` | `dl.resume-tools` en dos columnas | `items` (`area`, `items`) |
| `ContactCta` | `section.close` con `.btn` | `title`, `href`, `label`, `text`, `email`, `headingLevel`. Slot |

`grid.js` sube a la línea de retícula de debajo cada bloque marcado con `data-rule` (dos pasadas: medir y luego escribir) y se rehace con las fuentes, el tamaño y al abrir un `details`. Expone `window.gridRules` (`fit`, `schedule`).

La figura precalcula sus trayectorias en `astro/figure/path-controls.json`; si cambia el modelo, `npm run figure-path` las regenera y CI (`site.yml`, con `node scripts/figure-path.mjs --check`) falla mientras no coincidan.

## Markdown

Un `.md` se convierte en documento con su frontmatter (la tabla de `AGENTS.md` §3):

```md
---
layout: asprog-design-system/astro/DocumentLayout.astro
title: Análisis del repositorio
description: Diagnóstico del estado del repo.
source: analisis/ANALISIS.md
agent: Claude
date: 2026-10-21
status: vigente
tags: [analisis]
---

## Resumen

> [!IMPORTANT]
> El canon es el repo.
```

El índice sale de los `h2`. Para que los callouts salgan como avisos, añade el plugin al procesador de Markdown de Astro 7 (Sätteri):

```js
import { satteri } from '@astrojs/markdown-satteri';
import markdownNotice from 'asprog-design-system/astro/markdown-notice.mjs';

export default defineConfig({
  markdown: { processor: satteri({ hastPlugins: [markdownNotice] }), syntaxHighlight: false },
});
```

`syntaxHighlight: false` porque Delphos no tiene colores de lenguaje.

### La figura de los cubos en una Nota

Una Nota en Markdown puede llevar la figura de los cubos sin pasar a MDX. Un párrafo que solo tenga el marcador la pone, y lo que siga al marcador es el pie:

```md
::cubos Catorce piezas sueltas acaban en una sola pila.
```

Sale como fotograma fijo, con la pila hecha. Es lo que se ve sin JavaScript, con `prefers-reduced-motion` y al imprimir, así que nunca queda un hueco. Al tocarla (o con Intro y Espacio), la pila se deshace por el camino de la portada, y otro toque la rehace; si está en marcha, el toque la pausa. Sigue el tema claro y oscuro, porque el dibujo usa `currentColor` y los tokens `--cube-*`.

Para activarlo, añade el plugin junto al de los avisos. `Prose` monta las figuras que encuentre en su cuerpo, y `css/site.css` las estila (`.cube-note`):

```js
import markdownCubes from 'asprog-design-system/astro/markdown-cubes.mjs';
// …
markdown: { processor: satteri({ hastPlugins: [markdownNotice, markdownCubes] }) },
```

Con `::cubos[antes-ahora]` salen dos fotogramas uno junto al otro, rotulados «Antes» y «Ahora»: los catorce cubos sueltos y torcidos, como empieza la animación, y la pila hecha. El primero es un dibujo fijo que se calcula al construir, con la misma pose que `figure/flat.js` pinta al arrancar; el segundo se puede tocar como la pila sola. Una variante que no existe para el build con un error que dice cuáles hay.

```md
::cubos[antes-ahora] Antes, copias sueltas; ahora, una cadena.
```

Caben varias figuras en una Nota: el plugin quita los id del SVG y marca el grupo de los cubos con `data-cube-field`.

## La figura

`CubeFigure` es el componente de la portada de la web (`sitio-personal`, `src/components/CubeFigure.astro`) empaquetado. `figure/engine.js` y `figure/trajectories.js` son copias de `docs/cube-figure/` con un solo cambio: Three.js se importa como `three` (0.181.2). Si la web cambia el motor, se copian de nuevo. Cómo está hecha: [`docs/cube-figure.md`](../docs/cube-figure.md).

## Reglas

Las de `AGENTS.md` §4 valen igual: los componentes no aceptan `style` ni colores, y lo que falte se añade a `tokens.json` o a `css/`, nunca a un componente. `CubeFigure` ya no tiene hoja propia: lo que coloca el lienzo y el respaldo está en `css/site.css`.
