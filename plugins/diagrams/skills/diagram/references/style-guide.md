# Contrato de estilo Delphos

Sustituye al `style-guide.md` de diagram-design. Allí el estilo son valores (hex, familias, radios) que se escriben en el SVG; aquí **no se escribe ningún valor**: el diagrama hereda `currentColor` y los tokens del documento que lo contiene, y solo lleva clases. Cambiar un color o un tamaño es cambiar `tokens.json` del sistema de diseño, nunca el diagrama.

## Las clases

Todas están en `system/css/base.css` de este repo (`asprog-design-system`); `delphos-check` rechaza cualquier clase `d-*` o `g-*` que no esté en esa lista.

| Clase | Qué hace | Para qué |
|---|---|---|
| `d-box` | Sin relleno, trazo `currentColor` | Caja de nodo, marco, celda vacía |
| `d-fill` | Relleno papel (`--ground`) + trazo | Nodo opaco sobre el que pasan líneas; **el nodo focal** |
| `d-mask` | Relleno papel, sin trazo | Máscara opaca bajo una etiqueta de flecha o bajo un nodo |
| `d-line` | Trazo continuo, sin relleno | Conector, eje, línea de serie |
| `d-dash` | Trazo discontinuo `4 4`, opacidad .7 | Conector opcional, de retorno o asíncrono; línea de vida; retícula |
| `d-bar` | Relleno pleno `currentColor` | Barra, punto, punta de flecha (`<polygon>` dentro de `<marker>`) |
| `d-wash-1` | Relleno al 8 % | Franja de carril, fondo de zona, área de un marco |
| `d-wash-2` | Relleno al 20 % | Celda baja, área bajo una línea, banda de Sankey secundaria |
| `d-wash-3` | Relleno al 40 % | Celda media, serie secundaria |
| `d-wash-4` | Relleno al 65 % | Celda alta; si lleva texto encima, el texto va sobre un `d-mask` |
| `d-t` | Texto sans 13 px (Hanken Grotesk) | Nombre de nodo, actor, categoría |
| `d-sm` | Texto sans 12,5 px | Etiqueta pequeña: eje, leyenda, pie de carril |
| `d-tm` | Texto mono 12,5 px (DM Mono) | **Solo dato**: ruta, identificador, cifra, puerto, etiqueta de flecha en mayúsculas |
| `d-mid`, `d-end` | `text-anchor` centro / fin | Se combinan con una clase de texto |
| `g-ok`, `g-warn`, `g-stop` | Color del grupo: la misma tinta en tres coberturas | Estado de un nodo o de un camino; **siempre con una palabra o una forma**, nunca solo el color |
| `d-solution`, `d-pending-a`, `d-pending-b` | Fijan `color`: verde (`--solution`), ámbar (`--pending-a`), violeta (`--pending-b`) | **Solo en el mapa de ramas de git**: la solución implementada y dos pendientes. Se combinan con lo que usa `currentColor` (`d-line d-solution`, `d-fill d-pending-a`, un `<tspan class="d-pending-b">`) y valen en un `<span>` del texto. Siempre con el nombre de la rama |

Las clases de relleno (`d-bar`, `d-wash-N`) no fijan trazo: `d-wash-2 d-box` es una caja con trazo y lavado al 20 %.

## Traducción desde diagram-design

Las referencias `type-*.md` ya vienen traducidas por `scripts/vendor-diagram-design.mjs`, pero la prosa sigue hablando en los términos de upstream. Esta es la equivalencia:

| Upstream dice | Delphos hace |
|---|---|
| `paper`, `paper-2`, `accent-tint` como relleno | `d-fill` (con trazo) o `d-mask` (sin trazo). No hay segunda superficie. |
| `ink`, `muted`, `soft` como trazo | `d-line` / `d-box`. La jerarquía la da la forma (continuo, discontinuo, lavado), no el tono. |
| `accent` / «coral» (1-2 elementos focales) | **La misma tinta.** El foco se marca con `d-fill` (nodo opaco entre nodos `d-box`), con una palabra, o con `g-ok`. Nunca un segundo color. |
| `link` (llamadas HTTP, externas) | `d-dash` |
| `{ink @ 0.NN}` como relleno | `d-wash-1` (≤ .10), `d-wash-2` (≤ .22), `d-wash-3` (≤ .45), `d-wash-4` (> .45) |
| `{ink @ 0.NN}` como trazo | `d-dash` si es una línea de apoyo (línea de vida, retícula); `d-line` si es estructural |
| `series-1…5` | No hay paleta. Hasta 3 series: `d-line`, `d-dash` y `d-line` con puntos `d-bar`; o las bandas `d-wash-2/3/4`. Más de 3 series es otro diagrama o una tabla. |
| `node-name`, `title`, `name` (Geist, Instrument Serif) | `d-t` |
| `sublabel`, `eyebrow`, `arrow-label` (Geist Mono) | `d-tm`, solo si es dato; si es una palabra («Fase», «Legend»), `d-sm` |
| `callout` (cursiva Instrument Serif) | `d-sm`; o mejor, el `figcaption` |
| `rx="6"`, `rx="2"` | Nada: radio 0 |
| `stroke-width="…"` | Nada: `--diagram-stroke` |
| `fill="#f5f5f5"` de las máscaras | `d-mask` |
| Fondo `<rect width="100%" height="100%">` | Nada: el diagrama se apoya en la página |
| Dark mode, inversión | Nada: `data-theme` del documento y los tokens |
| Iconos (`primitive-icons`), logotipos | Nada: el nombre en texto |
| Sombras, filtros, `<image>` | Prohibidos (`delphos-check` regla 1) |

## Los marcadores

El SVG define sus puntas de flecha con ids prefijados por diagrama:

```svg
<defs>
  <marker id="{slug}-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polygon class="d-bar" points="0 0, 8 3, 0 6"/>
  </marker>
  <marker id="{slug}-open" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polyline class="d-line" points="0 0, 8 3, 0 6"/>
  </marker>
</defs>
```

`{slug}-arrow` para llamadas y retornos; `{slug}-open` (hueco) para asíncrono. Un marcador hereda el color del lugar donde está definido: para que una flecha de un grupo `g-stop` lleve la punta en su cobertura, el `<marker>` se define dentro de ese grupo.

## Tipografía y medidas

Las clases fijan familia y tamaño; el diagrama no lleva `font-size`. Presupuesto de ancho por carácter para no recortar etiquetas: **0,60 em** en sans (`d-t`, `d-sm`) y **0,62 em** en mono (`d-tm`); con 13 px, unos 8 px por carácter sans. Las etiquetas de flecha, 14 caracteres como máximo.

Geometría en rejilla de 4 px (`layout-budget.md`); el `viewBox` se dimensiona para un ancho de documento de 47 rem (`--doc-width`): entre 560 y 760 unidades de ancho para un diagrama en línea.

## Lo que no cambia de upstream

Las seis reglas de conectores (`primitives-core.md`), el presupuesto de complejidad (9 nodos, 12 flechas), la rejilla de 4 px, la filosofía de borrar antes que añadir y el contrato de SVG accesible. Lo único que Delphos añade a ese contrato: `<title>` y `<desc>` son obligatorios en todo diagrama (`delphos-check` regla 7), y el pie va en `figcaption`, en español.
