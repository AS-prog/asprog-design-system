# La regla visual

Lo que hay que saber para escribir una página HTML con el sistema. Si algo de aquí contradice otra guía, manda esto; si falta algo, se añade al sistema (`system/` del repo `asprog-design-system`) y no se improvisa en la página.

La identidad es **Delphos** sobre **Cobalt Grid**: papel crema, una sola tinta (el cobalto), retícula, Newsreader para el texto, Hanken Grotesk para la interfaz y DM Mono para el dato, radio 0.

## 1. Qué cargar y en qué orden

```html
<link rel="stylesheet" href="<sistema>/tokens.css" />
<link rel="stylesheet" href="<sistema>/css/base.css" />
<link rel="stylesheet" href="<sistema>/css/document.css" />
```

`<sistema>` es la copia fijada del proyecto, `docs/design-system/vX.Y/`, con ruta relativa a la página. La pone `site.py vendor` y la calcula `site.py new`.

- Una **vista generada** (tablero, panel) añade `css/view.css` en cuarto lugar y usa `.view` en lugar de `.doc`.
- Una página de un **sitio** lleva al final `css/library.css`, entre `<!-- site:css -->` y `<!-- /site:css -->`. No se escribe a mano: la pone `site.py build`.
- Nada más. Ninguna página pide nada a un tercero: ni fuentes de Google, ni CDN, ni iconos.
- Subir de versión es un cambio propio: `site.py vendor` deja la nueva al lado y las páginas se mueven cuando alguien las regenera.

## 2. El esqueleto

```
<html lang="es" data-theme="auto">
  .doc
    header.doc-bar        span.doc-brand «<repo> / <área>» · button.doc-theme
    header.doc-header     h1 · p.eyebrow (opcional, las fichas) · p.lede · dl.doc-meta
    nav.doc-toc           solo con cuatro h2 o más
    article.doc-prose     el cuerpo del .md convertido, empieza en h2
    footer.doc-footer     «Fuente: ruta.md» · «asprog-design-system»
```

- `data-theme="auto"`: la página sigue al sistema; el botón escribe `light` o `dark` y lo recuerda en `localStorage` (`tema`).
- `title` y `meta[name=description]` salen del título y la entrada del `.md`.
- `dl.doc-meta` lleva un `div` por fila (`dt` + `dd`): fecha, estado, fichas, código, diseño, según el tipo.

## 3. Del `.md` al HTML

| En el `.md` | En el HTML |
|---|---|
| `# Título` (el primero) | `h1` de la cabecera. No se repite en la prosa |
| El primer párrafo | `p.lede` |
| `## Sección` y siguientes | `h2`… dentro de `article.doc-prose`, cada `h2` con `id` |
| `> [!NOTE]`, `> [!TIP]` | `div.notice` + `span.notice-title` («Nota») |
| `> [!IMPORTANT]` | `div.notice.notice-important` («Importante») |
| `> [!WARNING]`, `> [!CAUTION]` | `div.notice.notice-risk` («Riesgo») |
| Un hueco sin decidir con ficha | `div.notice.notice-pending` («Pendiente · ficha NN») |
| Tabla | `table` tal cual; columnas numéricas con `td.num`; si es ancha, dentro de `div.table-wrap` |
| Bloque de código con nombre de fichero | `p.code-title` justo antes del `pre` |
| Resaltado | `.hl-k` palabra clave, `.hl-s` cadena, `.hl-n` número, `.hl-c` comentario |
| `- [ ]` / `- [x]` | `li > input[type=checkbox][disabled]` |
| Cita de remate | `blockquote.pull-quote` + `p.attrib` |
| Imagen | `img` con `alt`; con pie, `figure` + `figcaption` |
| Diagrama | `figure.figwrap` + `svg` en línea con `.d-box`, `.d-fill`, `.d-line`, `.d-dash`, `.d-t`, `.d-tm`; en gráficos de datos, `.d-bar`, `.d-mask` y `.d-wash-1…4` |
| Estado en una tabla | `.g-ok`, `.g-warn`, `.g-stop`, siempre con una palabra |
| Rama en un mapa de git | `.d-solution` (implementada), `.d-pending-a`, `.d-pending-b` (pendientes), en el SVG o en un `<span>` de la leyenda, siempre con el nombre de la rama |

Todo lo demás que produce un conversor (párrafos, listas, `hr`, `details`, `kbd`, `mark`, `abbr`, `dl`) ya tiene estilo sin clases.

## 4. Lo que no se hace

1. **Ningún valor a mano.** Ni tamaños, ni distancias, ni colores, ni radios en `style=""` o en un `<style>` propio. Si falta un paso, se añade a `system/tokens.json`.
2. **Ningún color nuevo.** El tipo de un aviso lo dice su etiqueta, no un rojo o un verde. `ok`/`warn`/`stop` son la misma tinta en tres coberturas y siempre van con una palabra o una forma. Las únicas excepciones son el verde de una solución y los dos colores de rama pendiente (`.d-solution`, `.d-pending-a`, `.d-pending-b`), solo para el mapa de ramas y la barra lateral.
3. **Sin antetítulos** encima del `h1`. Sin tarjetas como estructura, sin sombras, sin esquinas redondeadas, sin un aviso dentro de otro. La separación la hacen las reglas.
4. **Mono solo para dato**: código, rutas, identificadores, fechas, etiquetas.
5. **Sin logo ni iconos.** La marca es texto en mono. Las flechas son el carácter `→`. Los únicos SVG son los diagramas.
6. **No inventar**: ni métricas, ni clientes, ni fechas. Lo que no se sabe va en un aviso pendiente con su ficha.

## 5. Nombres

- El código va en inglés y los comentarios en español: carpetas y ficheros del sistema, clases, tokens, variables. En español, todo texto visible de una página.
- Clases nuevas, en inglés y en `system/css/`: `doc-` para el esqueleto, `lib-` para el sitio, `hl-` para el resaltado, `d-` para los diagramas. Una clase con esos prefijos que no esté en las hojas es un invento y `delphos-check` la rechaza.
