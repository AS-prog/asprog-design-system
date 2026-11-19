---
name: site
description: "Prepara y mantiene el sitio de la documentación de un proyecto: escrito en Markdown y SVG (site-md, el modo por defecto) o en páginas HTML desde plantillas (site.py); enlaza el sistema de diseño, genera la portada y la barra lateral desde docs/site/site.toml y pasa delphos-check. Úsala al montar la documentación de un proyecto nuevo, al añadir una página al sitio, al subir de versión el sistema o cuando pidan «regenera el sitio» o «la barra lateral»."
---

# site

Dos herramientas, el mismo `site.toml` y el mismo aspecto:

- **`scripts/site-md`**: el sitio se escribe en Markdown y SVG, y `build` genera todo el HTML. Es el modo por defecto para la documentación de un repo (ADR 0011 de `AS-prog/platform`). Va en «Un sitio en Markdown».
- **`scripts/site.py`**: páginas HTML escritas desde las plantillas, a las que `build` solo les pone la barra. Para lo que ya está en HTML o se genera fuera.

## Un sitio en Markdown

Necesita `uv` y, para `delphos-check`, `node`. `migrate` necesita además `pandoc`:

```bash
M="uv run --no-project --with markdown-it-py --with mdit-py-plugins --with pyyaml python <site>/scripts/site-md"
$M check --root docs/site     # valida mapa, frontmatter, figuras y avisos, sin escribir
$M build --root docs/site     # genera docs/site/dist/ y le pasa delphos-check
```

Un proyecto nuevo:

1. Copia `<site>/templates/site-md/` a `docs/site/`. Rellena lo que va entre `{{…}}` y pon en `system` la versión de esta skill: `design-system/vX.Y`, la de `<site>/system/VERSION`.
2. `$M build`. `dist/` no entra en git. Se abre con doble clic, o se publica como artefacto o en el tailnet.

Una página: `content/<sección>/<nombre>.md` sale en `dist/<sección>/<nombre>.html`. Lleva frontmatter con `title`, `lede` (admite `código` y enlaces), `date` y, si hace falta, `description`, `meta` (más filas de la ficha) y `source` (el pie). El cuerpo empieza en `##`; con cuatro secciones o más sale el índice. Después se añade al mapa con `path` y `type`.

Lo que Markdown no tiene:

| Quieres | Escribes |
|---|---|
| Ancla fija | `## Título {#ancla}` |
| Diagrama | Bloque ```` ```figure ```` con `src: nombre.svg` y `caption:`. El SVG va en `figs/`, con `role="img"`, `<title>`, `<desc>` y clases `d-*` |
| Aviso | `> [!NOTE]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!pending]`; el texto tras el marcador es su título |
| Estado en una tabla | La primera celda empieza por `✓ ` (`.g-ok`), `✗ ` (`.g-stop`) o `~ ` (`.g-warn`) |
| Columna numérica | Alineada a la derecha (`---:`): sale `td.num` |
| Bloque con nombre de fichero | ```` ```yaml title="ruta/fichero" ```` |
| Hoy frente a propuesta | `::::: compare`, dentro `:::: col Etiqueta` … `::::`, y cierre `:::::` |
| Clase del sistema en un trozo | `[texto]{.doc-new}`, `[hecho]{.g-ok}` |
| Salto dentro de una celda | `<br>`, el único HTML que se admite |

Nada de `<style>`, hojas propias ni HTML en bruto: el build y `delphos-check` lo rechazan. Un enlace a otro `.md` del sitio pasa a su `.html`, y falla si la página no existe. Un enlace al artefacto de una página migrada (`was` en el mapa) pasa a la página.

El sistema sale de la copia de esta skill. Si el sitio necesita quedarse en una versión, se fija en `docs/site/vendor/design-system/vX.Y/` y `vendor/check/`, y entonces mandan esas. Para subir de versión: actualizar el paquete (o la copia de `vendor/`), cambiar `system` y reconstruir.

Migrar un artefacto HTML:

```bash
$M migrate <artefacto.html> content/<sección>/<nombre>.md --figs <prefijo> --root docs/site
```

Saca los diagramas a `figs/<prefijo>-NN-<título>.svg`, pasa la ficha al frontmatter y vuelve a renderizar el `.md` para comparar el texto con el original. Sale con 0 solo si es idéntico, y lista las diferencias y lo que no ha podido traducir: clases inventadas, anclas de avisos o SVG sin `<desc>`. La fuente es la versión publicada del artefacto. Después, el artefacto se marca como movido al sitio, sin borrarlo.

## Páginas HTML (site.py)

Todo lo hace `scripts/site.py` de esta skill, desde la raíz del repo de gestión. `<site>` es la carpeta de esta skill, la que tiene este `SKILL.md` (como plugin, `${CLAUDE_PLUGIN_ROOT}/skills/site`; instalada con APM, `.claude/skills/site` o `~/.claude/skills/site`). Necesita `uv` (o Python 3.11+ con `markdown` instalado):

```bash
S="uv run --no-project --with markdown python <site>/scripts/site.py"
```

### Un proyecto nuevo

1. Copia `<site>/templates/site/site.toml` y `home.md` a `docs/site/` y rellena lo que va entre `{{…}}`: el nombre, la marca, las secciones (una por parte del sistema, en el orden en que fluyen los datos; «Método» primero) y la portada.
2. Elige cómo llega el sistema (abajo, «Copia o jsDelivr»). Con copia, `$S vendor` lo deja en `docs/design-system/vX.Y/`, que entra en git. Con jsDelivr, `system` en `site.toml` es la URL fijada a un tag y no hay nada que copiar.
3. `$S build`: escribe `index.html` y pone la barra en las páginas del mapa.

### Una página nueva

1. `$S new <implementation|technical|design|document> <ruta.html> --title "…"`. Rellénala con la skill `document`.
2. Añádela a `site.toml` en su sección, con `title`, `path` y `type`. Si estaba anunciada (sin `path`), basta con ponerle la ruta.
3. `$S build`, y commit de la página, `site.toml`, `index.html` y las páginas cuya barra cambió, en la rama de su ficha.

`build` solo toca lo que hay entre `<!-- site:nav -->`/`<!-- /site:nav -->` y `<!-- site:css -->`/`<!-- /site:css -->`, y el atributo `data-palette` de `<html>`, así que la barra puede entrar en una página fechada sin cambiar su contenido: es navegación, no texto. Ejecutarlo dos veces deja los ficheros igual; `$S build --check` sale con 1 si algo cambiaría (para CI).

Una página que regenera otro script entera pierde la barra: vuelve a ejecutar `build` después.

### Una paleta de marca

Con `palette = "<id>"` en `[project]` de `site.toml` (una de `color.palettes` de `tokens.json`, p. ej. `merkle`), `build` pone `data-palette` en `<html>` de la portada y de cada página del mapa; sin ella, la quita. El claro sigue siendo el tema de partida y el conmutador alterna claro y oscuro dentro de la paleta. Una página enlazada a una copia del sistema anterior a 0.15 no tiene paletas: se queda con la base.

### Copia o jsDelivr

`[project] system` en `site.toml` decide de dónde salen las hojas, los tokens, las fuentes y `library-fold.js`:

| | Copia (por defecto) | jsDelivr |
|---|---|---|
| `system` | `docs/design-system` | `https://cdn.jsdelivr.net/gh/AS-prog/asprog-design-system@v0.14.0/system` |
| En el repo | `docs/design-system/vX.Y/`, ≈ 0,6 MB por versión | Nada |
| Sin red | Se ve igual, con doble clic | El contenido sin estilos |
| Subir de versión | `$S vendor` y regenerar las páginas | Cambiar el tag y `$S build` |

Con copia, cada versión queda junto a la anterior (`v0.12/`, `v0.13/`…): las páginas viejas siguen en la suya y la carpeta que nadie enlaza se borra en un commit propio. Con jsDelivr, `build` lleva las hojas de cada página del mapa al tag de `site.toml` (también las que enlazaban una copia), así que el repo nunca tiene dos versiones. Conviene jsDelivr cuando hay varias páginas o artefactos sueltos que se quedarían atrás; la copia, cuando la documentación se lee sin red.

Para pasar un proyecto de la copia a jsDelivr: pon la URL en `system`, ejecuta `$S build`, comprueba con `delphos-check` que ninguna página del mapa enlaza ya la copia y borra `docs/design-system/` en el mismo commit. `delphos-check` valida las clases contra el `classes.json` del tag que enlaza la página.

## Cómo se ve

- **Portada** (`index.html`): el texto de `home.md` y «Qué hay en el sitio», una entrada por sección con sus páginas y el tipo de cada una.
- **Barra lateral**: fija a la izquierda; arriba, el enlace a la portada; debajo, las secciones. La página abierta va marcada con `aria-current="page"`. Una página anunciada sale atenuada y sin enlace, para que se vea qué falta.
- **Niveles plegables**: `build` pone en la barra `<script src="…/js/library-fold.js">`, que añade una flecha (`button.lib-fold`, con `aria-expanded`) a cada entrada con una lista dentro. Empiezan abiertos los niveles que contienen la página actual y el resto plegados; se alternan con la flecha, con una etiqueta (como «Solución») o con el enlace de la página actual. Sin JavaScript todo queda desplegado. Un generador propio que escriba la barra puede cargar el mismo script justo después de `nav.lib-nav`.
- **Solución**: las páginas de una solución implementada cuelgan de la entrada de su propuesta, como un grupo con etiqueta sobre una sombra verde. La propuesta es una entrada normal:

  ```html
  <li><a href="propuesta.html">1. Nombre</a>
    <ul class="lib-solutions">
      <li class="lib-solution"><span>Solución</span>
        <ul><li><a href="…">Página</a></li>…</ul>
      </li>
    </ul>
  </li>
  ```

  Desde 0.9.0 `li.lib-solution` ya no es la entrada de la propuesta: es el grupo que cuelga de ella. `site.py build` aún no lo genera (`site.toml` no tiene cómo describirlo): lo usa un proyecto que escribe su barra con un generador propio en lugar de `build`.
- **Secciones de la página abierta**: un `<ul aria-label="Secciones de esta página">` dentro del `li` de la página cuelga un nivel por debajo y se pliega como los demás.
- **Móvil**: por debajo de 56rem la barra se pliega arriba tras un botón «Índice». Dentro, los niveles se pliegan igual que en escritorio.
- Se abre con doble clic en `index.html`, o con `python -m http.server` desde la raíz. Con jsDelivr hace falta red para los estilos.
