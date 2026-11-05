# Forma de la salida

Sustituye al `output-spec.md` de diagram-design (formatos, presets de tamaño, exportación). Aquí hay una sola forma: **un fragmento dentro del documento**.

## El fragmento

```html
<figure class="figwrap">
  <svg viewBox="0 0 640 240" role="img" aria-labelledby="{slug}-title {slug}-desc">
    <title id="{slug}-title">Nombre corto del asunto</title>
    <desc id="{slug}-desc">Una frase que dice qué muestra el diagrama, no su geometría.</desc>
    <defs>…marcadores…</defs>
    …flechas antes que cajas…
  </svg>
  <figcaption>Pie en español, opcional. <strong>Lo importante</strong> en negrita.</figcaption>
</figure>
```

- `{slug}` es único en el documento (`auth-flow`, `ventas-q3`): dos diagramas en la misma página no pueden compartir ids.
- `<title>` es el primer hijo del `svg`, antes de `<defs>`; 60 caracteres o menos.
- Sin `width`/`height` en el `svg`: `figure svg { width: 100% }` lo escala. Sin `<style>`, sin `style=""`, sin `<script>`, sin `<image>`, sin `<filter>`.
- Sin título ni antetítulo dentro del SVG: el título lo da el `h2` del documento o el `figcaption`.
- Sin leyenda si las formas ya se explican; si hace falta, una fila horizontal al pie del `viewBox` con `d-sm` (60 unidades más de alto), nunca flotando entre los nodos.

## Dónde se pega

| Destino | Cómo |
|---|---|
| Publicación de la web (`sitio-personal`, `.md` en `src/content/publicaciones/`) | El `figure` en línea dentro del Markdown, en su propio párrafo |
| Página Astro con Delphos (`DocumentLayout`) | Igual, dentro del `.md` o del `.astro` |
| HTML suelto de la biblioteca | Dentro de `article.doc-prose`, donde toque en la prosa |

El documento ya carga `tokens.css`, `css/base.css` y `css/document.css`: el fragmento no enlaza nada.

## Tamaño

El ancho útil del documento es `--doc-width` (47 rem, unos 750 px). Un `viewBox` de **560 a 760 unidades de ancho** se ve a escala 1 o algo menor; con más de 760 los textos de 13 px se encogen al escalar y dejan de leerse en móvil. Si el diagrama necesita más ancho, es que sobran nodos (presupuesto de `layout-budget.md`) o son dos diagramas.

Alto libre: el que pida el contenido más 16 unidades de margen arriba y abajo.

## Comprobar

1. `delphos-check ruta/al/fragmento.html` (está en el plugin `documentation`, `scripts/delphos-check`); si el fragmento se escribe como `.html`, el hook de ese plugin lo pasa solo. Sin ese plugin, la skill `check` o la lista de reglas de abajo.
2. A mano: ninguna clase que no esté en [style-guide.md](style-guide.md); ningún `fill`, `stroke`, `font-*`, `rx`, `style`; `role="img"`, `<title>`, `<desc>` con ids prefijados; flechas dibujadas antes que cajas; las seis reglas de conectores de [primitives-core.md](primitives-core.md).
