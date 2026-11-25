# Cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y la versión, [SemVer](https://semver.org/lang/es/).

## 0.20.0 · 2026-11-25

### Añadido
- Los seis colores de serie (`color.tokens`: `series-1` … `series-6`), la rampa para gráficos con varias series (#29). Se leen como seis tonos distintos, no como seis claridades de la tinta: verde, índigo, ladrillo, violeta, ámbar y celeste. Van ordenados por luminancia y las series vecinas se distinguen en deuteranopía y protanopía. En claro cada tono alcanza al menos 4,69:1 sobre `ground`; en oscuro, 4,96:1. En `merkle`, al menos 5,59:1 sobre el blanco en claro y 4,82:1 sobre su azul en oscuro. En impresión son seis grises de valor creciente, de 19,80:1 a 4,54:1 sobre el blanco.
- Un par de contraste por serie (`series-N` / `ground`, mínimo 3:1), medido también en cada paleta de marca.
- `.chart-series-1` … `.chart-series-6` en `css/view.css`: fijan `color` con el token de su serie para que lo hereden las marcas de `.view-chart` (línea, área, banda, punto, pico y barra) y la muestra de `.view-legend`, sin añadir coberturas ni reglas en la página.

### Corregido
- `site-md`: las reglas de dibujo de `figure`, avisos y columnas se atan al `Renderer` propio y no al `RendererHTML` de markdown-it-py, que las reenlaza al registrarlas. Sin esto, `npm test` fallaba en las pruebas de `site-md`.

## 0.19.0 · 2026-11-23

### Añadido
- `scripts/publish-draft` en la skill `change`: publica un borrador de `.scratch/<tema>/borrador.md` como issue con una orden. Sin `--apply` enseña el plan y no escribe nada en GitHub. Con `--apply` crea el issue con el cuerpo sin frontmatter y sus etiquetas, lo enlaza como sub-issue de `parent`, sube la vista como artefacto y borra el borrador.
- No publica si al frontmatter le falta `title` o `repo`, si queda un `<…>` de la plantilla de su tipo o si la página no pasa `delphos-check`. Si un paso falla, se para, dice qué quedó hecho y no borra nada.
- `parent` admite un número o `dueño/nombre#N`, para un padre en otro repo.
- `npm test` pasa las pruebas del script con un `gh` doble (`scripts/test-publish-draft.mjs`).

### Cambiado
- `change/SKILL.md`: el paso «Publicar» manda usar el script.

## 0.18.0 · 2026-11-19

### Añadido
- `system/design/`: el sistema en formato design.md, un fichero por paleta y tema (`delphos-light.md`, `delphos-dark.md`, `merkle-light.md`, `merkle-dark.md`). Lo genera `npm run build` desde `tokens.json` con `scripts/design-md.mjs`. Es el formato que leen HyperFrames (heygen-com/hyperframes) y otras herramientas que hacen vídeo o imagen a partir de HTML.
- El frontmatter lleva todos los colores resueltos para ese tema y esa paleta; la tipografía con los tamaños de la familia `slide` (px de 1920×1080) y el peso, el interlineado y el tracking de su estilo en `type.groups`; los espaciados de la diapositiva, el radio y el movimiento. En `components`: el papel de puntos (nunca la cuadrícula de líneas), las dos líneas del marco, el número de página y lo pendiente a trazos.
- El paquete exporta `./design/*`.
- `npm test` comprueba que los DESIGN.md coinciden con `tokens.json` y que no sobra ninguno.

## 0.17.0 · 2026-11-19

### Añadido
- Familia de tokens `slide` en `tokens.json`: los parámetros de las diapositivas. Una diapositiva es un escenario fijo de 1920×1080 que se escala entero; no se recoloca en el móvil. Por eso sus medidas van en px del escenario y no dependen de `--unit` ni del ancho de la ventana.
- Escenario: `--slide-width`, `--slide-height`, `--slide-ratio` y `--slide-unit` (40 px, un papel de puntos de 48 × 27). `--slide-dot` (1,5 px) es el radio del punto: el papel es el de puntos de `base.css`, con el punto un poco más grueso para que se siga viendo al escalar.
- Márgenes y separaciones: `--slide-edge`, `--slide-edge-inner`, `--slide-pad-top`, `--slide-pad-bottom` y de `--slide-gap-lg` a `--slide-gap-xs`. Marco: `--slide-rule-top`, `--slide-rule-bottom` y `--slide-chrome-bottom`.
- Escala de tipos, de `--slide-t-numeral` (232 px) a `--slide-t-chrome` (18 px). Hay dos cuerpos: `--slide-t-body` (28 px) para exponer y `--slide-t-body-dense` (24 px) para leer. Parte de Cobalt Grid evaluada a 1920×1080, con el texto subido para que se lea proyectado.
- Decoración: `--slide-glitch-compact`, `--slide-glitch-cover` y `--slide-qr`. Fundido: `--slide-dur` (280 ms).
- Los colores, las fuentes, las líneas y el tracking son los del sistema. Una diapositiva hereda `data-theme` y `data-palette`. Todavía no hay hoja ni clases: solo los parámetros.

## 0.16.0 · 2026-11-19

### Añadido
- `skills/site/scripts/site-md`: el sitio de un proyecto escrito en Markdown y SVG. `check` valida el mapa, el frontmatter, las figuras y los avisos. `build` genera todo el HTML (portada, barra lateral, ficha, índice) con las hojas del sistema y le pasa `delphos-check`. `migrate` pasa un artefacto HTML a `.md` y SVG y comprueba que el texto queda idéntico. Viene del sitio de `AS-prog/platform` (`site/src/site_build`), que lo usa con 33 páginas. Es el modo por defecto para la documentación de un repo (ADR 0011 de platform).
- Extensiones de Markdown de `site-md`: `## Título {#ancla}`, bloque `figure` (SVG en línea con su pie), avisos `> [!NOTE|IMPORTANT|WARNING|pending]`, estado en la primera celda (`✓ ` `✗ ` `~ `), columnas numéricas, bloques con `title="…"`, `::::: compare` y clases del sistema con `[texto]{.clase}`.
- `site-md` usa la copia del sistema de la skill y `delphos-check` de la skill hermana `check`. Un sitio puede fijar otra en `vendor/`. Si `system` de `site.toml` no coincide con la versión de la copia, avisa.
- Plantilla `skills/site/templates/site-md/`: `site.toml`, `home.md` y una primera página.
- Los tipos de página de `site.toml` de `site-md` son los de `site.py`: cómo funciona, implementación, diseño, historia, método, guía, generada.
- `npm test` pasa las pruebas de `site-md` (`tests/site-md/`, con `uv`).

## 0.15.0 · 2026-11-19

### Añadido
- Paletas de marca (`color.palettes` en `tokens.json`): un tema de colores que se pone encima del claro y el oscuro sin sustituirlos. Cada paleta sobrescribe solo los colores que nombra, en `light` y `dark`; la impresión sigue siendo la de la base. Se activa con `data-palette="<id>"` en `<html>`, junto a `data-theme`. Sin `data-palette` manda la base y, sin `data-theme`, el claro.
- Paleta `merkle`, con los colores de la guía de marca de Merkle (Frontify, «Colors»). Claro: fondo blanco, texto negro, acento Cobalt `#0328D1`, secundario Dark Gray `#60607D`, lo nuevo en Merkle Red `#DD3039` (4,61:1). Oscuro: fondo Merkle Blue `#040E4B`, texto blanco, secundario Mid Gray `#AEAEBC`, acento Sky Blue `#0391F2` (5,42:1), notas en Gulf Blue.
- Par de contraste `accent / ground` (4,5:1), porque una paleta puede dar al acento un color distinto de la tinta.
- `npm test` mide todos los pares también en cada paleta, en claro y en oscuro, y comprueba que una paleta solo nombra colores que existen.
- `site.toml` acepta `palette` en `[project]`: `site.py build` (y `new`) lo pone como `data-palette` en `<html>` de la portada y de cada página del mapa, o lo quita si no hay.
- `DocumentLayout` y `SiteLayout` aceptan la prop `palette`; `DocumentLayout` también la lee del frontmatter.

## 0.14.0 · 2026-11-19

### Añadido
- El sistema se puede importar desde jsDelivr fijado a un tag, en lugar de copiarlo en el repo (#13). En `site.toml`, `system = "https://cdn.jsdelivr.net/gh/AS-prog/asprog-design-system@v0.14.0/system"`: `vendor` no copia nada, la barra lateral y `library.css` salen de esa URL, `new` escribe las plantillas con ella y `build` lleva a ese tag las hojas del sistema de cada página del mapa. Sin red no hay estilos; la copia sigue siendo el modo por defecto. El README del plugin y la skill `site` explican cuándo usar cada uno.
- `delphos-check` acepta el sistema en jsDelivr y comprueba las clases contra el `classes.json` del tag de la página; si no puede descargarlo, avisa y usa las del plugin.
- `standalone-html` y `figure-png` sirven páginas que piden el sistema a jsDelivr: las hojas de la misma versión que el plugin salen de su copia, sin red, y las demás se descargan.

### Cambiado
- `scripts/test.mjs` construye el ejemplo con el sistema como URL y comprueba que no queda copia ni ruta local.

## 0.13.1 · 2026-11-16

### Corregido
- El plugin `documentation` se instala también con APM (0.35). El `description` del frontmatter de `change`, `document`, `method`, `site` y `check` va entre comillas: con dos puntos sin comillas APM no lo lee («mapping values are not allowed here»).
- Las skills ya no dependen de `${CLAUDE_PLUGIN_ROOT}`, que solo existe en Claude Code. Cada una lleva lo que usa: `check/scripts/delphos-check`; `site/scripts/site.py`, `site/templates/` y `site/system/`; `change/scripts/` (`figure-png`, `standalone-html`) y `change/templates/` (PR e issues). Las demás lo piden por la carpeta hermana. El hook pasa a `${CLAUDE_PLUGIN_ROOT}/skills/check/scripts/delphos-check`. Con APM, que copia el script del hook a `.claude/hooks/` sin `classes.json`, `delphos-check` busca la lista de clases también en las skills instaladas (`.claude/skills/check/`, `.agents/skills/check/`, en el proyecto o en `~`), para que la regla 8 no se quede muda.

## 0.13.0 · 2026-11-13

### Añadido
- Plantilla de PR (`plugins/documentation/templates/pull_request_template.md`), que un proyecto copia a `.github/pull_request_template.md`, con el formato de nano-harness: qué cambia, cómo se comprobó, avisos, cómo revisarlo y `Closes #N`. «Cómo cambia el desarrollo» (la figura y la tabla de páginas con su estado al fusionar) es opcional, para las PR que tocan páginas.
- Plantillas de issue `templates/issues/build.md` (problema, alcance, fuera, artefactos) y `templates/issues/design.md` (temas con propuesta y preguntas abiertas, orden, referencias), que se copian a `.github/ISSUE_TEMPLATE/`.
- Token de color `proposal` (rojo de propuesta: `#b3261e` en claro, 5,49:1; `#ff8a80` en oscuro, 8,10:1) y token `compare-width` (87.5rem).
- Clases `d-new` (`css/base.css`) para lo nuevo en un diagrama, y `doc-new`, `doc-compare`, `doc-compare-col` y `doc-compare-label` (`css/document.css`) para comparar hoy y propuesta lado a lado y marcar lo nuevo en el texto y en las tablas. Salen del «Flujo de la v3» de nano-harness, que las tenía en un estilo propio.
- Guía `skills/method/reference/change-figures.md`: el estándar para dibujar un cambio. Qué forma según el tamaño (hoy y propuesta lado a lado, lo nuevo marcado, tabla o architecture delta), las marcas en el rojo de propuesta con borde discontinuo o issue, cuánto texto cabe en una caja (ancho ≥ caracteres × 8 + 16) y cómo llega la figura a la PR.
- Script `scripts/figure-png`: guarda las figuras de una página como PNG a doble resolución, todas o una con `--figure N`. Necesita Playwright.
- Script `scripts/standalone-html`: una página del sitio en un solo HTML, con las hojas, las fuentes y las imágenes dentro y sin barra lateral, para subirla como artefacto de una issue (`gh issue artifact create`, gh 2.103.0+).
- Ejemplo en `examples/sample-project/registro/sensores/2026-11-10-implementacion-lectura-lotes/`: una página de implementación con antes y después según `change-figures.md` (SE VA, NUEVO, CAMBIA), su PNG y la PR rellena (`pr-ejemplo.md`).
- Skill `change`: lleva un cambio de la issue a la PR en cinco pasos (issue con su plantilla, comparación hoy | propuesta, PNG y artefacto, PR con su plantilla, estado al fusionar), con su criterio de hecho en cada uno. `method` remite a ella en lugar de repetir la guía.
- Guía `skills/method/reference/pull-requests.md`: qué lleva la PR y la issue, cómo se enseña un cambio grande (antes y después) y uno acotado (lo nuevo marcado), y en qué estado queda cada página al fusionar.

### Cambiado
- `scripts/delphos-check` tiene permiso de ejecución.
- `document-types.md` apunta a la plantilla de PR en lugar de a una plantilla «de abajo» que no existía. La skill `method` la enlaza en el paso 5 y en la lista final.

## 0.12.0 · 2026-11-10

### Añadido
- `::cubos[torre]` en `markdown-cubes.mjs`: tres cubos apilados uno sobre otro (`figure/tower.js`), con la rampa de color de la pila. En reposo, la torre hecha; al tocarla, se deshace en una fila y se vuelve a apilar. Fase 2 de #7, para la Nota sobre APM.
- `figure/timeline.js`: el reloj que comparten la pila (`flat.js`) y la torre.

### Cambiado
- Las figuras de `markdown-cubes.mjs` salen sin los id del SVG, así que caben varias en una Nota; `figure/flat.js` encuentra el grupo de los cubos por `#cube-field` o por `[data-cube-field]`.

## 0.11.0 · 2026-11-10

### Añadido
- `astro/markdown-cubes.mjs`: plugin de Markdown (Sätteri) que convierte un párrafo `::cubos` en la figura de los cubos dentro de una Nota, sin pasar a MDX; lo que sigue al marcador es el pie. Sale como fotograma fijo, la pila hecha, que es lo que se ve sin JavaScript, con `prefers-reduced-motion` y al imprimir; tocarla la deshace y la rehace. Sigue el tema claro y oscuro. Es la primera fase de #7.
- `Prose` monta las figuras de cubos que trae su cuerpo (con `figure/flat-mount.js`, que solo se pide si las hay).
- `CubeFigure` acepta `autoplay`: con `engine={false}` y `autoplay={false}`, la figura empieza quieta y solo se mueve al tocarla.
- Clases `cube-note` (la figura dentro de una Nota) en `css/site.css`.

### Cambiado
- Las páginas interiores de la web (una Nota, el índice de Notas, el currículum) centran su contenido como la portada, en vez de quedarse pegadas a la izquierda (#6). `main` dentro de `.page` es una columna de `--measure-wide` centrada; el currículum toma `--doc-width` para la columna de fechas y la portada sigue centrando su propio bloque. La navegación y el pie siguen a todo el ancho.
- Los estilos de `CubeFigure` pasan de su `<style>` a `css/site.css`, para que valgan también en la figura que no pinta el componente. Los valores no cambian.
- El montaje de la figura plana y su gesto de tocar salen de `CubeFigure.astro` a `figure/flat-mount.js`, que comparten el componente y las Notas.
- `CubeFigure` con `engine={false}`: tocar la figura (o Intro y Espacio) mientras los cubos se mueven pausa la animación y otro toque la reanuda; con la figura quieta, el toque le da la vuelta como antes. La entrada dura unos 12 s, así que se puede parar sin botones (WCAG 2.2.2). El nombre accesible de la figura dice qué hará el siguiente toque.

## 0.10.0 · 2026-11-10

### Añadido
- La capa web vuelve desde `delphos-design-system` v0.5.0 (`62af94c`), que se archiva: `system/astro/` (componentes Astro: `SiteLayout`, `HomeIntro`, `CubeFigure`, `Resume` y el resto; `grid.js` y `figure/`), `system/assets/` (la figura de los cubos y los iconos del tema) y `system/css/site.css`. Es la capa de andresrsotelo.dev; sus clases siguen sin prefijo, como en Delphos.
- El repo es un paquete npm: `npm install github:AS-prog/asprog-design-system#vX.Y.Z` y `import { SiteLayout } from 'asprog-design-system/astro'`. `exports` publica `./astro`, `./tokens.css`, `./tokens.json`, `./css/*`, `./fonts/*`, `./assets/*` y `./js/*`; `astro` y `three` son dependencias opcionales (`three` solo para el motor de `CubeFigure`).
- CI en GitHub Actions: `npm run build` sin cambios pendientes y `npm test` en cada PR y en `main`.

## 0.9.0 · 2026-11-09

### Añadido
- Tokens de color `pending-a` (ámbar) y `pending-b` (violeta) para las soluciones pendientes, con valores en claro, oscuro e impresión y sus pares de contraste sobre `ground` (5,52:1 y 6,08:1 en claro; 10,31:1 y 8,74:1 en oscuro).
- Clases `d-solution`, `d-pending-a` y `d-pending-b` en `css/base.css`: fijan `color` para las ramas de un mapa de git, así que sirven con todo lo que usa `currentColor` y en un `<span>`.
- Niveles plegables en la barra lateral: `js/library-fold.js` (viaja con el sistema y lo copia `site.py vendor`) y las clases `lib-foldable` y `lib-fold` en `css/library.css`. `site.py build` carga el script en la barra. Sin JavaScript todo queda desplegado.
- Las secciones de la página abierta (`ul[aria-label="Secciones de esta página"]`) cuelgan un nivel por debajo de su enlace.
- En móvil (por debajo de 56rem), la flecha de plegar crece a 28 px para el dedo, y la barra abierta deja aire antes de la página.

### Cambiado
- Grupo «Solución» en la barra lateral: la propuesta es una entrada normal y su solución cuelga de ella dentro de `ul.lib-solutions`, como `li.lib-solution` con una etiqueta `<span>Solución</span>` y sus páginas. El marcado anterior, con `li.lib-solution` como la propia entrada de la propuesta, deja de usarse.

## 0.8.0 · 2026-11-09

### Añadido
- Tokens de color `solution` y `solution-bg` (verde y su sombra, con valores para claro, oscuro e impresión) y tres pares de contraste que `npm test` comprueba.
- Clase `lib-solution` en `css/library.css`: marca en la barra lateral el grupo de páginas de una solución implementada, con una sombra verde y una línea verde a la izquierda. Es el único color que no es la tinta.

## 0.7.1 · 2026-11-05

### Cambiado
- Skill `document`: toda página vive en un sitio con barra lateral. Si el proyecto no tiene `docs/site/site.toml`, se monta con la skill `site` antes de la primera página, y una página no está terminada hasta que tiene la barra y sale en la portada. Una entrega de varias páginas fuera del repo lleva también su portada y su barra.

## 0.7.0 · 2026-11-05

Primera versión de `asprog-design-system`: une en un repo el sistema Delphos (de `delphos-design-system` 0.6.0), el marketplace (`delphos-inc`) y el método de documentación de los proyectos, reescrito sin nada de un cliente concreto.

### Añadido
- `system/css/library.css`: la capa de sitio (barra lateral y portada) con prefijo `lib-`. Tokens nuevos `nav-width` y `nav-break`.
- Plugin `documentation` con cuatro skills: `method` (dónde va cada documento, los tipos, la voz, las páginas de implementación y técnicas, el alineamiento entre diseño y código), `document` (la regla visual), `check` y `site`.
- `scripts/site.py`: `vendor` copia el sistema al proyecto, `new` crea una página desde su plantilla con las rutas calculadas, `build` escribe la portada y la barra lateral desde `docs/site/site.toml` (y `--check` para CI).
- Plantillas de página: implementación, técnica, diseño y documento.
- `examples/sample-project/`: un proyecto ficticio con su sitio.
- `npm test` comprueba tokens, hojas, copias del plugin, el ejemplo y los diagramas con `delphos-check`, y que el sitio del ejemplo está al día.

### Cambiado
- `delphos-check` ya no admite ningún host externo por defecto: las hojas van copiadas en el repo. Admite `css/library.css` como última hoja, vigila el prefijo `lib-` y no cuenta los `h2` de la barra lateral.
- El plugin `diagrams` pasa a este marketplace (`diagrams@asprog`) y remite a `documentation` para la comprobación.

### Quitado
- La capa de la web (`css/site.css`, componentes Astro, figura de cubos, catálogo): sigue en `delphos-design-system` para `sitio-personal`.
- El design system propio del plugin `documentacion` (tokens, `componentes.css`, `estilo.py`): las vistas generadas usan `css/view.css`.
