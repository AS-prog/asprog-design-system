# Reglas de delphos-check

Las nueve reglas que aplica `scripts/delphos-check` a una página HTML. Cada una cita la sección de `skills/document/guide.md` de la que sale. Un fragmento suelto (`figure.figwrap` sin `<html>`) solo pasa por las reglas 1, 2, 3, 7 y 8.

| Regla | Qué busca | De dónde sale |
| --- | --- | --- |
| 1 | `style=""` en cualquier etiqueta, `<style>` propios, y `<filter>` o `<image>` dentro de un SVG | §4.1 y §4.3 |
| 2 | Colores a mano: `#hex`, `rgb()`, `hsl()` o un nombre de color en `fill`, `stroke`, `color` y similares (valen `currentColor`, `none` e `inherit`) | §4.1 y §4.2 |
| 3 | `<link>`, `<script src>`, `<img src>`, `<iframe>`, `@import` o `url()` a cualquier host. Las hojas van copiadas en el repo o salen del propio sistema en jsDelivr (`https://cdn.jsdelivr.net/gh/AS-prog/asprog-design-system@vX.Y.Z/…`); `--allow-host` admite otro host concreto | §1 |
| 4 | Las tres hojas en orden, `tokens.css`, `css/base.css` y `css/document.css`; detrás, solo `css/view.css` (vista) y `css/library.css` (sitio), en ese orden. `site.css` nunca | §1 |
| 5 | Esqueleto: `html[data-theme="auto"]`, `.doc`, `header.doc-bar`, `header.doc-header` con un solo `h1`, `article.doc-prose`, `footer.doc-footer`. Una vista lleva `.view` y no necesita `article` | §2 |
| 6 | `nav.doc-toc` solo con cuatro `h2` o más, y cada `h2` del cuerpo con `id` (los de `nav.doc-toc` y `nav.lib-nav` no cuentan) (en una vista, los `h2` de panel no lo necesitan) | §2 y §3 |
| 7 | `<img>` sin `alt`, `<svg>` sin `role="img"` (salvo los decorativos con `aria-hidden`), un diagrama sin `<title>` y `<desc>`, y una imagen en la barra o la cabecera (logo) | §4.5 |
| 8 | Clases con prefijo `doc-`, `d-`, `hl-`, `g-`, `lib-` o `notice` que no existen en las hojas (`classes.json`, generado). Si la página enlaza el sistema en jsDelivr, las del `classes.json` de ese tag | §5 |
| 9 | `<title>` y `meta[name=description]` con texto, y ningún marcador `{{…}}` sin rellenar | §2 |

Lo que no comprueba: el contenido del `.md`, la calidad de un diagrama ni los contrastes (eso lo mide `npm test` en el repo del sistema sobre los tokens).
