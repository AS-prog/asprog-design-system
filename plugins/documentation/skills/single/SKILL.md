---
name: single
description: "Escribe un documento Delphos en un solo fichero HTML, sin sitio ni carpeta al lado: una página de Artifact en claude.ai, un informe que se sube a una issue, un explicador que se manda por enlace o un adjunto de correo. Úsala cuando pidan «artifact», «artefacto», «un solo html», «página suelta para compartir», «autocontenido» o cuando la página no vaya a vivir en el sitio del proyecto."
argument-hint: ruta/al/documento.md
---

# single

Un documento de un solo fichero tiene el mismo esqueleto, las mismas clases y los mismos diagramas que una página del sitio. Lo único que cambia es de dónde salen los estilos. No enlaza hojas: lleva dentro un bloque generado, `<!-- single:style … -->`, con los tokens, `base.css` y `document.css`. Nada se copia ni se escribe a mano.

Si la página va a vivir en el sitio del proyecto, no es esta skill: es `document`. Si ya existe en el sitio y solo hay que sacarla como artefacto de una issue, es `change/scripts/standalone-html`.

`<skills>` es la carpeta que contiene esta skill y sus hermanas `document`, `check` y `site` (como plugin, `${CLAUDE_PLUGIN_ROOT}/skills`; con APM, `.claude/skills` o `~/.claude/skills`).

## Pasos

1. **Elige el destino** con [reference/destinations.md](reference/destinations.md): `file` (fichero suelto, adjunto o artefacto de una issue) o `artifact` (Artifact de claude.ai). El destino decide las fuentes: `file` las mete como data URI y se ve sin red; `artifact` las pide a Google Fonts, que es lo único que deja cargar su CSP.
2. **Crea la página desde la plantilla**, no a mano:
   `node <skills>/single/scripts/single-html new <ruta.html> --title "…" --target file|artifact [--fonts embed|google]`.
   Trae el bloque de estilo, el conmutador de tema y el esqueleto de `document`.
3. **Rellena** lo que va entre `{{…}}` desde el `.md`, con la regla visual de [`document/guide.md`](../document/guide.md) §2 a §5: el mismo esqueleto, la misma conversión del Markdown y lo mismo que no se hace. Lo que no aplica se quita.
4. **Diagramas** con la skill `diagram` del plugin `diagrams`: SVG en línea con clases `.d-*`. Nunca un color en un atributo, tampoco `fill="var(--x)"`: muchos navegadores no resuelven `var()` ahí y el diagrama sale en negro o vacío.
5. **Imágenes**, como `data:` URI. Un solo fichero no tiene nada al lado.
6. **Comprueba**: `node <skills>/check/scripts/delphos-check <ruta.html>`. Reconoce el bloque y aplica las reglas de un solo fichero (`--single` las fuerza). No entregues una página que no pase.
7. **Ábrela** en claro y en oscuro, y a 400 px. Con `file`, también sin red.
8. **Entrega** según el destino: el Artifact se publica con su herramienta, el fichero va al issue con `gh issue artifact create <N> <ruta.html>` (gh 2.103.0 o posterior), y el adjunto va al correo.

## El bloque de estilo

- Lo escribe `single-html` y lleva en el comentario la versión del sistema, las fuentes y un `sha256` de su contenido. `delphos-check` lo recalcula: si alguien toca el bloque a mano, falla.
- Para pasar a la versión nueva del sistema, o cambiar de fuentes: `single-html build <ruta.html> [--fonts embed|google]`. Solo cambia el bloque.
- Los temas siguen al sistema: el claro en `:root`, el oscuro con `prefers-color-scheme` salvo que se fuerce el claro, y el oscuro forzado con `data-theme="dark"`. El botón escribe `light` o `dark` en `<html>` y lo recuerda en `localStorage` si puede.
- No hay paletas de marca: el bloque lleva la paleta de Delphos.

## Lista

- [ ] El destino está elegido y la página salió de `single-html new`.
- [ ] No queda ningún `{{…}}` y el esqueleto es el de `document`.
- [ ] Los diagramas usan clases `.d-*`, sin colores ni `var()` en atributos.
- [ ] `delphos-check` pasa.
- [ ] Se ha visto en claro, en oscuro y a 400 px; con `file`, también sin red.
