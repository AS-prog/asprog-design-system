---
name: site
description: Prepara y mantiene el sitio de la documentación de un proyecto: copia el sistema de diseño al repo, crea páginas desde sus plantillas y genera la portada y la barra lateral desde docs/site/site.toml. Úsala al montar la documentación de un proyecto nuevo, al añadir una página al sitio, al subir de versión el sistema o cuando pidan «regenera el sitio» o «la barra lateral».
---

# site

Todo lo hace `${CLAUDE_PLUGIN_ROOT}/scripts/site.py`, desde la raíz del repo de gestión. Necesita `uv` (o Python 3.11+ con `markdown` instalado):

```bash
S="uv run --no-project --with markdown python ${CLAUDE_PLUGIN_ROOT}/scripts/site.py"
```

## Un proyecto nuevo

1. Copia `${CLAUDE_PLUGIN_ROOT}/templates/site/site.toml` y `home.md` a `docs/site/` y rellena lo que va entre `{{…}}`: el nombre, la marca, las secciones (una por parte del sistema, en el orden en que fluyen los datos; «Método» primero) y la portada.
2. `$S vendor`: copia el sistema a `docs/design-system/vX.Y/`. Entra en git: las páginas lo enlazan con rutas relativas.
3. `$S build`: escribe `index.html` y pone la barra en las páginas del mapa.

## Una página nueva

1. `$S new <implementation|technical|design|document> <ruta.html> --title "…"`. Rellénala con la skill `document`.
2. Añádela a `site.toml` en su sección, con `title`, `path` y `type`. Si estaba anunciada (sin `path`), basta con ponerle la ruta.
3. `$S build`, y commit de la página, `site.toml`, `index.html` y las páginas cuya barra cambió, en la rama de su ficha.

`build` solo toca lo que hay entre `<!-- site:nav -->`/`<!-- /site:nav -->` y `<!-- site:css -->`/`<!-- /site:css -->`, así que la barra puede entrar en una página fechada sin cambiar su contenido: es navegación, no texto. Ejecutarlo dos veces deja los ficheros igual; `$S build --check` sale con 1 si algo cambiaría (para CI).

Una página que regenera otro script entera pierde la barra: vuelve a ejecutar `build` después.

## Subir de versión el sistema

`$S vendor` deja la versión nueva junto a la vieja (`docs/design-system/v0.7/`, `v0.8/`…). Las páginas nuevas usan la nueva; las viejas se quedan en la suya hasta que alguien las regenere. Cuando ninguna página enlaza ya una versión, su carpeta se borra en un commit propio.

## Cómo se ve

- **Portada** (`index.html`): el texto de `home.md` y «Qué hay en el sitio», una entrada por sección con sus páginas y el tipo de cada una.
- **Barra lateral**: fija a la izquierda; arriba, el enlace a la portada; debajo, las secciones. La página abierta va marcada con `aria-current="page"`. Una página anunciada sale atenuada y sin enlace, para que se vea qué falta.
- **Móvil**: por debajo de 56rem la barra se pliega arriba tras un botón «Índice».
- Se abre con doble clic en `index.html`, o con `python -m http.server` desde la raíz.
