"""Layout: the asprog-design-system document shell plus the library side bar.

The side bar uses the markup of the `site` skill (nav.lib-nav, library.css,
js/library-fold.js), written by this generator as that skill allows.
"""
from __future__ import annotations

import posixpath
import re
from html import escape
from typing import Callable, Dict, List, Optional

from .domain import ContentError, RenderedPage, SiteMap, needs_toc, rel

INDEX = "index.html"

THEME_HEAD = """<script>
      // Antes de pintar: el tema guardado manda; si no hay, claro (preferencia del proyecto).
      (function () {
        var t = 'light';
        try { var s = localStorage.getItem('tema'); if (s === 'light' || s === 'dark') t = s; } catch (e) {}
        document.documentElement.setAttribute('data-theme', t);
      })();
    </script>"""

THEME_TOGGLE = """<script>
      document.querySelector('.doc-theme').addEventListener('click', function () {
        var r = document.documentElement;
        var next = r.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        r.setAttribute('data-theme', next);
        try { localStorage.setItem('tema', next); } catch (e) {}
      });
    </script>"""

Inline = Callable[[str], str]


def nav(site: SiteMap, page: str) -> str:
    """Side bar for page (a path relative to the site root), current page marked."""
    cur = lambda href: ' aria-current="page"' if href == page else ""  # noqa: E731
    out = ['<nav class="lib-nav" aria-label="Sitio">', "<details open>",
           f'<summary><a class="lib-home" href="{rel(INDEX, page)}"{cur(INDEX)}>{escape(site.name)}</a>'
           '<span class="lib-menu">Índice</span></summary>']
    for section in site.sections:
        out.append(f"<h2>{escape(section.title)}</h2>")
        items = []
        for e in section.entries:
            title = escape(e.title)
            if e.href:
                items.append(f'<li><a href="{rel(e.href, page)}"{cur(e.href)}>{title}</a></li>')
            else:
                items.append(f'<li><span title="Aún sin migrar">{title}</span></li>')
        if section.fold:
            n = len(section.entries)
            out.append(f'<ul><li><span>{n} {"página" if n == 1 else "páginas"}</span><ul>')
            out += items
            out.append("</ul></li></ul>")
        else:
            out += ["<ul>", *items, "</ul>"]
    out += ["</details>", "</nav>",
            "<script>(function () { var m = matchMedia('(max-width: 56rem)'), "
            "d = document.querySelector('.lib-nav details'); d.open = !m.matches; "
            "m.addEventListener('change', function () { d.open = !m.matches; }); })();</script>",
            f'<script src="{rel(site.system + "/js/library-fold.js", page)}"></script>']
    return "\n    ".join(out)


def _head(site: SiteMap, page: str, title: str, description: str) -> str:
    sys = rel(site.system, page)
    return f"""<!doctype html>
<html lang="es" data-theme="auto">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{escape(title)}</title>
    <meta name="description" content="{escape(description, quote=True)}" />
    <meta name="theme-color" content="#F0EBDE" />
    <link rel="stylesheet" href="{sys}/tokens.css" />
    <link rel="stylesheet" href="{sys}/css/base.css" />
    <link rel="stylesheet" href="{sys}/css/document.css" />
    <link rel="stylesheet" href="{sys}/css/library.css" />
    {THEME_HEAD}
  </head>
  <body class="lib">
    {nav(site, page)}
    <div class="doc">"""


def _bar(brand: str) -> str:
    return f"""      <header class="doc-bar">
        <span class="doc-brand">{escape(brand)}</span>
        <button class="doc-theme" type="button" aria-label="Cambiar tema">Tema</button>
      </header>"""


def _tail() -> str:
    return f"""    </div>

    {THEME_TOGGLE}
  </body>
</html>
"""


def relink(html: str, links: Dict[str, str], page: str, pages: Optional[set] = None) -> str:
    """Artifact URLs of migrated pages become links inside the site.

    A relative link to another .md of the site (written from the source file,
    so ../historia/x.md) becomes its .html; one to a page not in the map fails.
    """
    def sub(m):
        url = m.group(1)
        target = links.get(url.split("#")[0])
        if not target:
            return m.group(0)
        frag = url[len(url.split("#")[0]):]
        return f'href="{rel(target, page)}{frag}"'
    html = re.sub(r'href="(https://claude\.ai/artifact/[^"]+)"', sub, html)
    if pages is None:
        return html

    def sub_md(m):
        path, frag = m.group(1), m.group(2) or ""
        target = posixpath.normpath(posixpath.join(posixpath.dirname(page), path[:-len(".md")] + ".html"))
        if target not in pages:
            raise ContentError(f"{page}: el enlace {path} no es una página del sitio")
        return f'href="{rel(target, page)}{frag}"'
    return re.sub(r'href="(?![a-z]+:)([^"#]+\.md)(#[^"]*)?"', sub_md, html)


def render_page(site: SiteMap, rp: RenderedPage, inline: Inline, version: str) -> str:
    p = rp.page
    meta = [("Fecha", f'<time datetime="{p.date.isoformat()}">{p.date.isoformat()}</time>'),
            ("Tipo", escape(p.type))]
    meta += [(escape(k), inline(v)) for k, v in p.meta.items()]
    meta_html = "\n".join(f"          <div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in meta)
    toc = ""
    if needs_toc(rp.toc):
        items = "\n".join(f'          <li><a href="#{e.anchor}">{escape(e.text)}</a></li>' for e in rp.toc)
        toc = f"""
      <nav class="doc-toc" aria-label="Índice">
        <h2>Índice</h2>
        <ol>
{items}
        </ol>
      </nav>
"""
    source = f"Fuente: {inline(p.sources)} · " if p.sources else ""
    out = f"""{_head(site, p.href, p.title, p.description or p.title)}
{_bar(p.brand or site.brand)}

      <header class="doc-header">
        <h1>{inline(p.title)}</h1>
        <p class="lede">{inline(p.lede)}</p>
        <dl class="doc-meta">
{meta_html}
        </dl>
      </header>
{toc}
      <article class="doc-prose">
{rp.html}      </article>

      <footer class="doc-footer">
        <span>{source}Generado desde <code>site/{escape(p.source)}</code></span>
        <span>asprog-design-system v{escape(version)}</span>
      </footer>
{_tail()}"""
    return relink(out, site.link_map(), p.href, {e.href for e in site.entries() if e.href})


def _sections(site: SiteMap) -> str:
    out = ['<ul class="lib-sections">']
    for s in site.sections:
        out.append(f"<li><h3>{escape(s.title)}</h3><ul>")
        for e in s.entries:
            title = escape(e.title)
            if e.href:
                out.append(f'<li><a href="{e.href}">{title}</a><span class="lib-type">{escape(e.type)}</span></li>')
            else:
                out.append(f'<li><span class="lib-pending">{title}</span><span class="lib-type">pendiente</span></li>')
        out.append("</ul></li>")
    out.append("</ul>")
    return "\n".join(out)


def render_index(site: SiteMap, title: str, lede_html: str, body_html: str, description: str, version: str) -> str:
    return f"""{_head(site, INDEX, title, description)}
{_bar(site.brand)}

      <header class="doc-header">
        <h1>{escape(title)}</h1>
        <p class="lede">{lede_html}</p>
      </header>

      <article class="doc-prose">
{body_html}
        <h2 id="que-hay-en-el-sitio">Qué hay en el sitio</h2>
{_sections(site)}
      </article>

      <footer class="doc-footer">
        <span>Generado desde <code>site/{escape(site.home)}</code> y <code>site/site.toml</code></span>
        <span>asprog-design-system v{escape(version)}</span>
      </footer>
{_tail()}"""
