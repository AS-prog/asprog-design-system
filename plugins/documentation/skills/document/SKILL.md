---
name: document
description: "Escribe la página HTML de un documento con el sistema de diseño (identidad Delphos): la versión .html de un .md, una página de implementación, técnica o de diseño, o una entrega de varias páginas. Úsala cuando pidan «página html», «versión html de este .md», «documento de la biblioteca» o al cerrar una ficha que deja página. Si la página es un solo fichero que no vive en el sitio (un Artifact, un adjunto, una página suelta para compartir), usa la skill single."
argument-hint: ruta/al/documento.md
---

# document

**Toda página del proyecto vive en un sitio con barra lateral.** Desde cualquier documento se llega a los demás y a la portada. Si el proyecto aún no tiene sitio (`docs/site/site.toml`), móntalo con la skill `site` antes de escribir la primera página.

La excepción es un documento de **un solo fichero** que no va a vivir en el sitio: un Artifact de claude.ai, un informe para una issue, un explicador que se manda por enlace o un adjunto de correo. Ese lo escribe la skill `single`, con el mismo esqueleto y la regla visual de [guide.md](guide.md).

La regla visual está en [guide.md](guide.md): qué hojas cargar, el esqueleto, cómo pasa cada pieza del Markdown al HTML y lo que nunca se hace. Léela entera antes de empezar (es corta). Qué tipo de documento es y qué secciones lleva lo dice la skill `method`.

`<skills>` es la carpeta que contiene esta skill y sus hermanas `check`, `site` y `single` (como plugin, `${CLAUDE_PLUGIN_ROOT}/skills`; instaladas con APM, `.claude/skills` o `~/.claude/skills`).

## Pasos

1. **Sitio y copia del sistema.** Si el proyecto no tiene `docs/site/site.toml`, créalo con la skill `site`. Si no tiene `docs/design-system/vX.Y/` (o la carpeta que diga `site.toml`), ejecuta `site.py vendor`. Una página nunca enlaza el plugin ni una URL externa.
2. **Crea la página desde su plantilla**, no a mano: `site.py new <implementation|technical|design|document> <ruta.html> --title "…"`. La plantilla ya trae las rutas relativas al sistema, el conmutador de tema y las secciones del tipo.
3. **Rellena** todo lo que va entre `{{…}}` con el contenido del `.md`, que es la fuente. Las secciones que no aplican se quitan; no se dejan vacías. El índice (`nav.doc-toc`) solo va con cuatro `h2` o más.
4. **Diagramas** con la skill `diagram` del plugin `diagrams`: SVG en línea con clases `.d-*`, cada uno con su pie.
5. **Comprueba**: `node <skills>/check/scripts/delphos-check <ruta.html>` (el hook lo pasa solo al escribir). No entregues una página que no pase.
6. **Al sitio, siempre**: añádela a `docs/site/site.toml` en su sección y ejecuta `site.py build` (skill `site`). La página no está terminada hasta que tiene la barra lateral y sale en la portada.
7. Ábrela en el navegador y mírala en claro y en oscuro.

## Una entrega suelta

Si es **una sola página**, usa la skill `single`: un único `.html` con los estilos dentro y sin nada al lado.

Si son **varias páginas** que salen del repo (adjuntas a un correo, para negocio), la entrega sigue llevando su sitio: la carpeta con la portada y la barra. Copia junto a ella `tokens.css`, `css/` y `fonts/` de `<skills>/site/system/` y usa rutas relativas a esa copia. Sigue sin pedir nada a terceros.
