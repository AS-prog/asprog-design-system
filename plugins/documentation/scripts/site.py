"""El sitio de la documentación de un proyecto: copia del sistema, páginas nuevas, portada y barra lateral.

Uso, desde la raíz del proyecto (o con --root):

    uv run --no-project --with markdown python site.py vendor
    uv run --no-project --with markdown python site.py new <tipo> <ruta.html> [--title "…"]
    uv run --no-project --with markdown python site.py build [--check]

Todo sale de docs/site/site.toml (plantilla en templates/site/site.toml):

- vendor copia las hojas, los tokens, los scripts y las fuentes que trae el plugin a
  <system>/v<X.Y>/ dentro del proyecto. Las páginas las enlazan con rutas
  relativas, así que funcionan sin red y abriéndolas con doble clic.
- new crea una página desde la plantilla de su tipo (implementation,
  technical, design, document) con las rutas al sistema ya calculadas para
  su profundidad. Lo que queda entre {{…}} lo rellena quien escribe;
  delphos-check no deja pasar una página con marcadores.
- build escribe la portada (index.html) desde home.md y el mapa, y pone la
  barra lateral en cada página del mapa, entre <!-- site:nav --> y
  <!-- /site:nav -->. Fuera de esas marcas no toca nada, así que una página
  fechada no cambia de contenido. Con --check no escribe: sale con 1 si algo
  cambiaría.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import os
import re
import shutil
import sys
import tomllib
import unicodedata
from pathlib import Path

PLUGIN = Path(__file__).resolve().parents[1]
CONFIG = "docs/site/site.toml"
KINDS = ("implementation", "technical", "design", "document")

NAV_OPEN, NAV_CLOSE = "<!-- site:nav -->", "<!-- /site:nav -->"
CSS_OPEN, CSS_CLOSE = "<!-- site:css -->", "<!-- /site:css -->"

THEME_HEAD = """<script>
      // Antes de pintar, para que no haya destello: el tema guardado manda sobre «auto».
      try {{
        var t = localStorage.getItem('tema');
        if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
      }} catch (e) {{}}
    </script>"""

THEME_TOGGLE = """<script>
      document.querySelector('.doc-theme').addEventListener('click', function () {{
        var r = document.documentElement, t = r.getAttribute('data-theme');
        var isDark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
        var next = isDark ? 'light' : 'dark';
        r.setAttribute('data-theme', next);
        try {{ localStorage.setItem('tema', next); }} catch (e) {{}}
      }});
    </script>"""

HOME = """<!doctype html>
<!-- Generada desde {home} y {config} con site.py build. No se edita a mano. -->
<html lang="es" data-theme="auto">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content="{description}" />
    <meta name="theme-color" content="#F0EBDE" />
    <link rel="stylesheet" href="{system}/tokens.css" />
    <link rel="stylesheet" href="{system}/css/base.css" />
    <link rel="stylesheet" href="{system}/css/document.css" />
    {css}
    """ + THEME_HEAD + """
  </head>
  <body class="lib">
    {nav}
    <div class="doc">
      <header class="doc-bar">
        <span class="doc-brand">{brand}</span>
        <button class="doc-theme" type="button" aria-label="Cambiar tema">Tema</button>
      </header>

      <header class="doc-header">
        <h1>{title}</h1>
        <p class="lede">{lede}</p>
      </header>

      <article class="doc-prose">
{body}
        <h2 id="que-hay-en-el-sitio">Qué hay en el sitio</h2>
{sections}
      </article>

      <footer class="doc-footer">
        <span>Fuente: {home} y {config}</span>
        <span>asprog-design-system v{version}</span>
      </footer>
    </div>

    """ + THEME_TOGGLE + """
  </body>
</html>
"""


# --- configuración ----------------------------------------------------------


def system_version() -> str:
    return (PLUGIN / "system" / "VERSION").read_text(encoding="utf-8").strip()


def load(root: Path) -> dict:
    path = root / CONFIG
    if not path.exists():
        raise SystemExit(f"No encuentro {CONFIG} en {root}. Copia {PLUGIN / 'templates' / 'site' / 'site.toml'}.")
    config = tomllib.loads(path.read_text(encoding="utf-8"))
    project = config.setdefault("project", {})
    project.setdefault("index", "index.html")
    project.setdefault("home", "docs/site/home.md")
    project.setdefault("system", "docs/design-system")
    project.setdefault("brand", project.get("name", root.name))
    project.setdefault("name", project["brand"])
    config.setdefault("section", [])
    return config


def system_dir(config: dict) -> str:
    """La carpeta de la copia del sistema, relativa a la raíz: <system>/vX.Y."""
    major, minor = system_version().split(".")[:2]
    return f"{config['project']['system'].rstrip('/')}/v{major}.{minor}"


def rel(target: str, page: str) -> str:
    """Ruta de target vista desde page, las dos relativas a la raíz."""
    return os.path.relpath(target, os.path.dirname(page) or ".").replace(os.sep, "/")


def slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", re.sub(r"<[^>]+>", "", text)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "seccion"


# --- vendor ------------------------------------------------------------------


def vendor(root: Path, config: dict) -> list[Path]:
    target = root / system_dir(config)
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(PLUGIN / "system", target)
    return [target]


# --- new ---------------------------------------------------------------------


def new(root: Path, config: dict, kind: str, page: str, title: str | None) -> list[Path]:
    target = root / page
    if target.exists():
        raise SystemExit(f"{page} ya existe: una página no se pisa con la plantilla")
    text = (PLUGIN / "templates" / f"{kind}.html").read_text(encoding="utf-8")
    text = text.replace("{{system}}", rel(system_dir(config), page))
    text = text.replace("{{brand}}", html.escape(config["project"]["brand"]))
    text = text.replace("{{date}}", dt.date.today().isoformat())
    if title:
        text = text.replace("{{title}}", html.escape(title))
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8", newline="\n")
    return [target]


# --- build -------------------------------------------------------------------


def nav(config: dict, page: str) -> str:
    """La barra lateral de page, con sus enlaces relativos y la página activa marcada."""
    index = config["project"]["index"]
    current = ' aria-current="page"' if page == index else ""
    out = [NAV_OPEN, '<nav class="lib-nav" aria-label="Sitio">', "<details open>",
           f'<summary><a class="lib-home" href="{rel(index, page)}"{current}>{html.escape(config["project"]["name"])}</a>'
           '<span class="lib-menu">Índice</span></summary>']
    for section in config["section"]:
        out.append(f"<h2>{html.escape(section['title'])}</h2>")
        out.append("<ul>")
        for p in section.get("page", []):
            title = html.escape(p["title"])
            if "path" in p:
                current = ' aria-current="page"' if p["path"] == page else ""
                out.append(f'<li><a href="{rel(p["path"], page)}"{current}>{title}</a></li>')
            elif "url" in p:
                out.append(f'<li><a href="{html.escape(p["url"], quote=True)}">{title}</a></li>')
            else:
                out.append(f'<li><span title="Aún sin página">{title}</span></li>')
        out.append("</ul>")
    out += ["</details>", "</nav>",
            # En pantallas estrechas (--nav-break) la barra se pliega; en anchas, siempre abierta.
            "<script>(function () { var m = matchMedia('(max-width: 56rem)'), "
            "d = document.querySelector('.lib-nav details'); d.open = !m.matches; "
            "m.addEventListener('change', function () { d.open = !m.matches; }); })();</script>",
            # Los niveles con páginas dentro (una solución, las secciones de la página) se pliegan.
            f'<script src="{rel(system_dir(config) + "/js/library-fold.js", page)}"></script>',
            NAV_CLOSE]
    return "\n    ".join(out)


def css(config: dict, page: str) -> str:
    return f'{CSS_OPEN}<link rel="stylesheet" href="{rel(system_dir(config) + "/css/library.css", page)}" />{CSS_CLOSE}'


def sections(config: dict) -> str:
    """El índice de la portada: una entrada por sección con sus páginas y su tipo."""
    out = ['<ul class="lib-sections">']
    for section in config["section"]:
        out.append(f"<li><h3>{html.escape(section['title'])}</h3><ul>")
        for p in section.get("page", []):
            title, kind = html.escape(p["title"]), html.escape(p.get("type", ""))
            href = p.get("path") or p.get("url")
            label = f'<a href="{html.escape(href, quote=True)}">{title}</a>' if href else f'<span class="lib-pending">{title}</span>'
            out.append(f'<li>{label}<span class="lib-type">{kind if href else "pendiente"}</span></li>')
        out.append("</ul></li>")
    out.append("</ul>")
    return "\n".join(out)


def with_ids(fragment: str) -> str:
    """Pone id a cada h2 que no lo tenga: el índice y delphos-check lo piden."""
    return re.sub(r"<h2>(.*?)</h2>", lambda m: f'<h2 id="{slug(m.group(1))}">{m.group(1)}</h2>', fragment)


def home(root: Path, config: dict) -> tuple[str, str]:
    import markdown  # solo build lo necesita

    project = config["project"]
    text = (root / project["home"]).read_text(encoding="utf-8")
    # El título es el h1 y la entrada, el primer párrafo después de él.
    title, rest = re.match(r"# (.+?)\n+(.*)", text, re.S).groups()
    lede, rest = (re.match(r"(.+?)\n\n(.*)", rest, re.S) or re.match(r"(.+)()", rest, re.S)).groups()
    index = project["index"]
    out = HOME.format(
        title=html.escape(title),
        description=html.escape(re.sub(r"[`*_]", "", lede).strip(), quote=True),
        lede=markdown.markdown(lede.strip())[3:-4],
        system=rel(system_dir(config), index),
        css=css(config, index),
        nav=nav(config, index),
        brand=html.escape(project["brand"]),
        body=with_ids(markdown.markdown(rest, extensions=["tables", "fenced_code", "md_in_html"])),
        sections=sections(config),
        home=project["home"],
        config=CONFIG,
        version=system_version(),
    )
    return index, out


def replace_block(text: str, start: str, end: str, block: str, anchor: str, before: bool) -> str:
    """Sustituye lo que hay entre start y end; si no hay marcas, pone block junto a anchor."""
    pattern = re.compile(re.escape(start) + ".*?" + re.escape(end), re.S)
    if pattern.search(text):
        return pattern.sub(lambda _: block, text, count=1)
    matches = list(re.finditer(anchor, text))
    if not matches:
        raise SystemExit(f"No encuentro {anchor!r} donde poner la barra")
    m = matches[-1] if not before else matches[0]
    at = m.start() if before else m.end()
    return text[:at] + block + "\n    " + text[at:] if before else text[:at] + "\n    " + block + text[at:]


def page(root: Path, config: dict, path: str) -> tuple[str, str]:
    text = (root / path).read_text(encoding="utf-8")
    # La capa de biblioteca va detrás de la última hoja del sistema (document.css o view.css).
    text = replace_block(text, CSS_OPEN, CSS_CLOSE, css(config, path),
                         r'<link rel="stylesheet" href="[^"]*css/(?:document|view)\.css" />', before=False)
    text = replace_block(text, NAV_OPEN, NAV_CLOSE, nav(config, path), r'<div class="(?:doc|view)">', before=True)
    text = re.sub(r"<body(?: class=\"lib\")?>", '<body class="lib">', text, count=1)
    return path, text


def build(root: Path, config: dict, check: bool) -> list[Path]:
    outputs = [home(root, config)]
    for section in config["section"]:
        for p in section.get("page", []):
            if "path" in p and not p.get("generated"):
                if not (root / p["path"]).exists():
                    raise SystemExit(f"{p['path']} está en el mapa pero no existe")
                outputs.append(page(root, config, p["path"]))
    changed = []
    for path, text in outputs:
        target = root / path
        old = target.read_text(encoding="utf-8") if target.exists() else None
        if old == text:
            continue
        changed.append(target)
        if not check:
            target.write_text(text, encoding="utf-8", newline="\n")
    if check and changed:
        for c in changed:
            print(f"cambiaría: {c.relative_to(root)}", file=sys.stderr)
        raise SystemExit(1)
    return changed


def main(argv: list[str] | None = None) -> None:
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--root", default=".", help="raíz del proyecto (por defecto, la carpeta actual)")
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("vendor", parents=[common], help="copia el sistema al proyecto")
    p_new = sub.add_parser("new", parents=[common], help="crea una página desde una plantilla")
    p_new.add_argument("kind", choices=KINDS)
    p_new.add_argument("path", help="ruta de la página, relativa a la raíz")
    p_new.add_argument("--title")
    p_build = sub.add_parser("build", parents=[common], help="escribe la portada y la barra lateral")
    p_build.add_argument("--check", action="store_true", help="no escribe; sale con 1 si algo cambiaría")
    args = parser.parse_args(argv)

    root = Path(args.root).resolve()
    config = load(root)
    if args.command == "vendor":
        done = vendor(root, config)
    elif args.command == "new":
        done = new(root, config, args.kind, args.path.replace(os.sep, "/"), args.title)
    else:
        done = build(root, config, args.check)
    for d in done:
        print(d.relative_to(root))


if __name__ == "__main__":
    main()
