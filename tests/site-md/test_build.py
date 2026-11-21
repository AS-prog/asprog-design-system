import shutil
from datetime import date
from pathlib import Path

import pytest

from site_md.application import BUNDLED_CHECK, BUNDLED_SYSTEM, build, check
from site_md.domain import ContentError, SiteMap, html_path
from site_md.layout import nav, relink
from site_md.markdown import Renderer

VER = "v" + ".".join((BUNDLED_SYSTEM / "VERSION").read_text().strip().split(".")[:2])
SVG = '<svg viewBox="0 0 10 10" role="img"><title>t</title><desc>d</desc></svg>'


def renderer(figs=None):
    figs = figs or {"a.svg": SVG}
    def load(name):
        if name not in figs:
            raise ContentError(name)
        return figs[name]
    return Renderer(load)


# ---- markdown ----

def test_plain_markdown_has_no_classes():
    html, _ = renderer().render("Texto **fuerte** y `code`.\n\n- uno\n- dos\n")
    assert "class=" not in html


def test_heading_ids_fixed_and_slugged_and_toc():
    html, toc = renderer().render("## Quién lee qué {#capas}\n\n## Qué cambió\n")
    assert '<h2 id="capas">Quién lee qué</h2>' in html
    assert '<h2 id="que-cambio">' in html
    assert [e.anchor for e in toc] == ["capas", "que-cambio"]


def test_figure_block_inlines_svg_with_caption():
    html, _ = renderer().render("```figure\nsrc: a.svg\ncaption: 'Pie con `code`.'\n```\n")
    assert '<figure class="figwrap">' in html
    assert "<title>t</title>" in html
    assert "<figcaption>Pie con <code>code</code>.</figcaption>" in html


def test_figure_missing_fails():
    with pytest.raises(ContentError):
        renderer().render("```figure\nsrc: nope.svg\n```\n")


def test_done_cell_gets_state_class_and_table_wrap():
    html, _ = renderer().render("| A | B |\n|---|---|\n| ✓ hecho | x |\n| abierto | y |\n")
    assert html.startswith('<div class="table-wrap"><table>')
    assert '<td class="g-ok">hecho</td>' in html
    assert "✓" not in html


@pytest.mark.parametrize("kind,cls,label", [
    ("NOTE", "notice", "Nota"),
    ("IMPORTANT", "notice notice-important", "Importante"),
    ("WARNING", "notice notice-risk", "Riesgo"),
    ("pending", "notice notice-pending", "Pendiente"),
])
def test_alerts_follow_the_guide(kind, cls, label):
    title = ""
    html, _ = renderer().render(f"> [!{kind}]{title}\n> Texto.\n")
    assert f'<div class="{cls}"><span class="notice-title">{label}</span>' in html
    assert "<p>Texto.</p>" in html and "blockquote" not in html


def test_plain_quote_untouched():
    assert renderer().render("> una cita\n")[0].startswith("<blockquote>")


def test_code_fence_escaped():
    html, _ = renderer().render("```markdown\n# <b>\n```\n")
    assert '<pre><code class="language-markdown"># &lt;b&gt;' in html


# ---- site map and layout ----

MAP = {
    "project": {"name": "P", "system": f"design-system/{VER}"},
    "section": [
        {"title": "Uno", "page": [{"title": "Demo", "path": "content/a/demo.md", "type": "diseño",
                                   "was": "https://claude.ai/artifact/AAA"},
                                  {"title": "Futura", "type": "historia"}]},
        {"title": "Historia", "fold": True, "page": [{"title": "Vieja", "type": "historia"}]},
    ],
}


def test_map_rejects_unknown_type_and_bad_path():
    bad = {"section": [{"title": "S", "page": [{"title": "x", "type": "otra"}]}]}
    with pytest.raises(ContentError, match="tipo"):
        SiteMap.from_config(bad)
    with pytest.raises(ContentError):
        html_path("otra/x.md")


def test_nav_marks_current_announces_pending_and_folds():
    site = SiteMap.from_config(MAP)
    out = nav(site, "a/demo.html")
    assert '<a href="demo.html" aria-current="page">Demo</a>' in out
    assert '<a class="lib-home" href="../index.html">' in out
    assert '<span title="Aún sin migrar">Futura</span>' in out
    assert "<ul><li><span>1 página</span><ul>" in out
    assert f'src="../design-system/{VER}/js/library-fold.js"' in out


def test_relink_only_migrated_pages():
    html = '<a href="https://claude.ai/artifact/AAA#x">a</a> <a href="https://claude.ai/artifact/BBB">b</a>'
    out = relink(html, SiteMap.from_config(MAP).link_map(), "b/otra.html")
    assert 'href="../a/demo.html#x"' in out
    assert 'href="https://claude.ai/artifact/BBB"' in out


def test_relink_md_links_between_pages():
    pages = {"a/demo.html", "b/otra.html"}
    out = relink('<a href="../a/demo.md#x">a</a> <a href="https://x.org/r.md">r</a>', {}, "b/otra.html", pages)
    assert 'href="../a/demo.html#x"' in out
    assert 'href="https://x.org/r.md"' in out
    with pytest.raises(ContentError):
        relink('<a href="../a/nada.md">n</a>', {}, "b/otra.html", pages)


# ---- end to end ----

def _site(tmp_path: Path) -> Path:
    root = tmp_path / "site"
    (root / "content" / "a").mkdir(parents=True)
    (root / "figs").mkdir()
    (root / "figs" / "a.svg").write_text(SVG)
    (root / "home.md").write_text("# Portada\n\nEntrada `corta`.\n\nMás texto.\n")
    (root / "site.toml").write_text(
        f'[project]\nname = "P"\nsystem = "design-system/{VER}"\n\n'
        '[[section]]\ntitle = "Uno"\n\n[[section.page]]\ntitle = "Demo"\npath = "content/a/demo.md"\ntype = "diseño"\n'
    )
    (root / "content" / "a" / "demo.md").write_text(
        "---\ntitle: Demo\nlede: Una `prueba`.\ndate: 2026-11-19\n---\n\n"
        "## Uno\n\n```figure\nsrc: a.svg\n```\n"
    )
    return root


def test_build_writes_self_contained_site_that_passes_delphos_check(tmp_path):
    root = _site(tmp_path)
    res = build(root, root / "dist")
    page = (root / "dist" / "a" / "demo.html").read_text()
    assert f'href="../design-system/{VER}/css/library.css"' in page
    assert '<p class="lede">Una <code>prueba</code>.</p>' in page
    assert '<body class="lib">' in page and "doc-toc" not in page
    index = (root / "dist" / "index.html").read_text()
    assert '<a href="a/demo.html">Demo</a><span class="lib-type">diseño</span>' in index
    assert (root / "dist" / "design-system" / VER / "tokens.css").exists()
    assert res.figures == ["a.svg"]
    if shutil.which("node"):
        assert "cumple el sistema de diseño" in res.lint


def test_pages_must_match_the_map(tmp_path):
    root = _site(tmp_path)
    (root / "content" / "a" / "extra.md").write_text("---\ntitle: x\nlede: y\ndate: 2026-11-19\n---\n")
    with pytest.raises(ContentError, match="fuera de site.toml"):
        check(root)


def test_a_map_for_another_version_needs_its_own_copy(tmp_path):
    root = _site(tmp_path)
    toml = root / "site.toml"
    toml.write_text(toml.read_text().replace(VER, "v0.1"))
    with pytest.raises(ContentError, match="vendor/design-system/v0.1"):
        check(root)


# ---- extensions for the migration ----

def test_cell_marks_map_to_state_classes():
    html, _ = renderer().render("| A |\n|---|\n| ✗ fuera |\n| ~ a medias |\n")
    assert '<td class="g-stop">fuera</td>' in html and '<td class="g-warn">a medias</td>' in html


def test_right_aligned_column_becomes_num_without_style():
    html, _ = renderer().render("| A | N |\n|---|---:|\n| x | 10 |\n")
    assert '<th class="num">N</th>' in html and '<td class="num">10</td>' in html
    assert "style=" not in html


def test_code_title():
    html, _ = renderer().render('```yaml title="home/.chezmoidata/machines.yaml"\na: 1\n```\n')
    assert html.startswith('<p class="code-title">home/.chezmoidata/machines.yaml</p>\n<pre><code class="language-yaml">')


def test_compare_container():
    md = "::::: compare\n:::: col Hoy\nuno\n::::\n:::: col Propuesta\ndos\n::::\n:::::\n"
    html, _ = renderer().render(md)
    assert html.startswith('<div class="doc-compare">\n<div class="doc-compare-col">\n<p class="doc-compare-label">Hoy</p>')
    assert html.count('class="doc-compare-col"') == 2


def test_attrs_for_doc_new():
    html, _ = renderer().render("Algo [nuevo]{.doc-new} aquí.\n")
    assert '<span class="doc-new">nuevo</span>' in html


def test_alert_with_own_title():
    html, _ = renderer().render("> [!WARNING] Fallo\n> Texto.\n")
    assert '<span class="notice-title">Fallo</span>' in html


def test_raw_html_only_br():
    html, _ = renderer().render("| A |\n|---|\n| uno<br>dos |\n")
    assert "<td>uno<br>dos</td>" in html
    with pytest.raises(ContentError, match="HTML en bruto"):
        renderer().render("<div>x</div>\n")
    with pytest.raises(ContentError, match="solo <br>"):
        renderer().render("a <b>x</b>\n")


# ---- migrate ----

ORIGINAL = """<!doctype html><html><head><meta name="description" content="Desc." /><style>tr.doc-done td{}</style></head>
<body><div class="doc"><header class="doc-bar"><span class="doc-brand">marca</span></header>
<header class="doc-header"><h1>Título</h1><p class="lede">Entrada con <code>código</code>.</p>
<dl class="doc-meta"><div><dt>Fecha</dt><dd><time>2026-11-15</time></dd></div><div><dt>Estado</dt><dd>Hecho</dd></div></dl></header>
<div class="notice notice-important"><span class="notice-title">Orden</span><p>Lo fija el plan.</p></div>
<nav class="doc-toc"><h2>Índice</h2></nav>
<article class="doc-prose">
<h2 id="uno">Uno</h2><p>Texto <span class="g-ok">hecho</span>. <span class="g-stop"><strong>No cabe.</strong></span> Fin.</p>
<figure class="figwrap fig-wide"><svg viewBox="0 0 1 1" role="img"><title>Mapa simple</title><desc>d</desc></svg><figcaption>Pie.</figcaption></figure>
<p class="code-title">a.sh</p><pre>echo | b</pre>
<div class="table-wrap"><table><thead><tr><th>A</th><th class="num">N</th></tr></thead><tbody>
<tr class="doc-done"><td>listo</td><td class="num">1</td></tr><tr><td>uno<br>dos</td><td class="num">2</td></tr></tbody></table></div>
<div class="doc-compare"><div class="doc-compare-col"><p class="doc-compare-label">Hoy</p><p>a</p></div><div class="doc-compare-col"><p class="doc-compare-label">Mañana</p><p>b</p></div></div>
</article><footer class="doc-footer"><span>Fuente: notas</span><span>x</span></footer></div></body></html>"""


@pytest.mark.skipif(not shutil.which("pandoc"), reason="migrate necesita pandoc")
def test_migrate_round_trip_keeps_text():
    from site_md.migrate import migrate
    res = migrate(ORIGINAL, "demo", BUNDLED_CHECK)
    assert res.similarity == 1.0, res.diffs
    md = res.markdown
    assert "date: 2026-11-15\n" in md
    assert "Estado: Hecho" in md and "source: notas" in md and "brand: marca" in md
    assert "> [!IMPORTANT] Orden" in md
    assert "## Uno {#uno}" in md and "[hecho]{.g-ok}" in md
    assert "**[No cabe.]{.g-stop}**" in md
    assert "```figure\nsrc: demo-01-mapa-simple.svg\ncaption: Pie.\n```" in md
    assert '``` title="a.sh"\necho | b\n```' in md
    assert "| ✓ listo" in md and "uno<br>dos" in md and "---:" in md
    assert "::::: compare" in md and ":::: col Mañana" in md
    assert list(res.figures) == ["demo-01-mapa-simple.svg"]


def test_template_braces_in_code_are_entities():
    html, _ = renderer().render("```\n{{ if .x }}\n```\n\nY `{{ end }}`.\n")
    assert "{{" not in html and "&#123;&#123; if .x }}" in html


def test_task_list_disabled_checkboxes():
    html, _ = renderer().render("- [x] hecho\n- [ ] falta\n")
    assert html.count('type="checkbox"') == 2 and 'checked="checked"' in html and "disabled" in html


def test_nested_pages_and_groups_in_sitemap_and_nav():
    site = SiteMap.from_config({
        "project": {"name": "demo"},
        "section": [{
            "title": "Paquetes",
            "page": [{
                "title": "Catálogo",
                "type": "guía",
                "path": "content/paquetes/catalogo.md",
                "page": [{
                    "title": "Roles",
                    "page": [
                        {"title": "role-director", "type": "guía", "path": "content/paquetes/role-director.md"},
                    ],
                }],
            }],
        }],
    })
    assert [e.title for e in site.entries()] == ["Catálogo", "Roles", "role-director"]
    assert site.section_for("content/paquetes/role-director.md").title == "Paquetes"
    sidebar = nav(site, "paquetes/role-director.html")
    assert '<li><a href="catalogo.html">Catálogo</a><ul>' in sidebar
    assert '<li><span>Roles</span><ul>' in sidebar
    assert 'aria-current="page">role-director</a>' in sidebar
