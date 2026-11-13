# Cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y la versión, [SemVer](https://semver.org/lang/es/).

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
