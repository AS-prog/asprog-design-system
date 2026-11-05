---
name: document
description: Escribe la página HTML de un documento con el sistema de diseño (identidad Delphos): la versión .html de un .md, una página de implementación, técnica o de diseño, o una entrega suelta. Úsala cuando pidan «página html», «versión html de este .md», «documento de la biblioteca» o al cerrar una ficha que deja página.
argument-hint: ruta/al/documento.md
---

# document

**Toda página vive en un sitio con barra lateral.** No hay páginas sueltas sin navegación: desde cualquier documento se llega a los demás y a la portada. Si el proyecto aún no tiene sitio (`docs/site/site.toml`), móntalo con la skill `site` antes de escribir la primera página.

La regla visual está en [guide.md](guide.md): qué hojas cargar, el esqueleto, cómo pasa cada pieza del Markdown al HTML y lo que nunca se hace. Léela entera antes de empezar (es corta). Qué tipo de documento es y qué secciones lleva lo dice la skill `method`.

## Pasos

1. **Sitio y copia del sistema.** Si el proyecto no tiene `docs/site/site.toml`, créalo con la skill `site`. Si no tiene `docs/design-system/vX.Y/` (o la carpeta que diga `site.toml`), ejecuta `site.py vendor`. Una página nunca enlaza el plugin ni una URL externa.
2. **Crea la página desde su plantilla**, no a mano: `site.py new <implementation|technical|design|document> <ruta.html> --title "…"`. La plantilla ya trae las rutas relativas al sistema, el conmutador de tema y las secciones del tipo.
3. **Rellena** todo lo que va entre `{{…}}` con el contenido del `.md`, que es la fuente. Las secciones que no aplican se quitan; no se dejan vacías. El índice (`nav.doc-toc`) solo va con cuatro `h2` o más.
4. **Diagramas** con la skill `diagram` del plugin `diagrams`: SVG en línea con clases `.d-*`, cada uno con su pie.
5. **Comprueba**: `node ${CLAUDE_PLUGIN_ROOT}/scripts/delphos-check <ruta.html>` (el hook lo pasa solo al escribir). No entregues una página que no pase.
6. **Al sitio, siempre**: añádela a `docs/site/site.toml` en su sección y ejecuta `site.py build` (skill `site`). La página no está terminada hasta que tiene la barra lateral y sale en la portada.
7. Ábrela en el navegador y mírala en claro y en oscuro.

## Una entrega suelta

Si el documento sale del repo (adjunto a un correo, para negocio), sigue llevando su sitio: si son varias páginas, la entrega es la carpeta con la portada y la barra. Copia junto a él `tokens.css`, `css/` y `fonts/` de `${CLAUDE_PLUGIN_ROOT}/system/` y usa rutas relativas a esa copia. Sigue sin pedir nada a terceros.
