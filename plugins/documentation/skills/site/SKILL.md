---
name: site
description: Prepara y mantiene el sitio de la documentación de un proyecto: enlaza el sistema de diseño (copia en el repo o jsDelivr), crea páginas desde sus plantillas y genera la portada y la barra lateral desde docs/site/site.toml. Úsala al montar la documentación de un proyecto nuevo, al añadir una página al sitio, al subir de versión el sistema o cuando pidan «regenera el sitio» o «la barra lateral».
---

# site

Todo lo hace `${CLAUDE_PLUGIN_ROOT}/scripts/site.py`, desde la raíz del repo de gestión. Necesita `uv` (o Python 3.11+ con `markdown` instalado):

```bash
S="uv run --no-project --with markdown python ${CLAUDE_PLUGIN_ROOT}/scripts/site.py"
```

## Un proyecto nuevo

1. Copia `${CLAUDE_PLUGIN_ROOT}/templates/site/site.toml` y `home.md` a `docs/site/` y rellena lo que va entre `{{…}}`: el nombre, la marca, las secciones (una por parte del sistema, en el orden en que fluyen los datos; «Método» primero) y la portada.
2. Elige cómo llega el sistema (abajo, «Copia o jsDelivr»). Con copia, `$S vendor` lo deja en `docs/design-system/vX.Y/`, que entra en git. Con jsDelivr, `system` en `site.toml` es la URL fijada a un tag y no hay nada que copiar.
3. `$S build`: escribe `index.html` y pone la barra en las páginas del mapa.

## Una página nueva

1. `$S new <implementation|technical|design|document> <ruta.html> --title "…"`. Rellénala con la skill `document`.
2. Añádela a `site.toml` en su sección, con `title`, `path` y `type`. Si estaba anunciada (sin `path`), basta con ponerle la ruta.
3. `$S build`, y commit de la página, `site.toml`, `index.html` y las páginas cuya barra cambió, en la rama de su ficha.

`build` solo toca lo que hay entre `<!-- site:nav -->`/`<!-- /site:nav -->` y `<!-- site:css -->`/`<!-- /site:css -->`, así que la barra puede entrar en una página fechada sin cambiar su contenido: es navegación, no texto. Ejecutarlo dos veces deja los ficheros igual; `$S build --check` sale con 1 si algo cambiaría (para CI).

Una página que regenera otro script entera pierde la barra: vuelve a ejecutar `build` después.

## Copia o jsDelivr

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
