"""Adapter: Markdown -> HTML for article.doc-prose.

Plain Markdown gets no classes (document.css styles it as is). The four things
Markdown does not have come from small extensions that still read well on
GitHub and Obsidian:

- ```figure blocks (src + caption) -> figure.figwrap with the SVG inlined.
- `## Heading {#id}` -> fixed anchor; without it, a slug.
- A first table cell starting with "✓ ", "✗ " or "~ " -> that cell gets
  .g-ok, .g-stop or .g-warn (state in a table, always with a word: guide §3).
- Right-aligned columns (---:) -> td.num, never style="".
- ```lang title="file" -> p.code-title before the pre.
- ::: compare / ::: col Label -> div.doc-compare / div.doc-compare-col.
- [texto]{.doc-new} -> span.doc-new (attributes, for the few classes that need it).
- GitHub alerts -> div.notice, as the guide maps them: NOTE/TIP, IMPORTANT,
  WARNING/CAUTION, and PENDING (a gap with its ticket).
"""
from __future__ import annotations

import re
import unicodedata
from typing import Callable, List

import yaml
from markdown_it import MarkdownIt
from markdown_it.common.utils import escapeHtml
from mdit_py_plugins.attrs import attrs_plugin
from mdit_py_plugins.container import container_plugin
from mdit_py_plugins.tasklists import tasklists_plugin

from .domain import ContentError, TocEntry, figure_name_ok

# First-cell markers -> state class on that cell (guide §3: state with a word).
CELL_MARKS = {"✓ ": "g-ok", "✗ ": "g-stop", "~ ": "g-warn"}
_TITLE_ATTR = re.compile(r'title="([^"]*)"')
# alert -> (notice modifier, label), as in skills/document/guide.md §3
ALERTS = {
    "note": ("", "Nota"),
    "tip": ("", "Nota"),
    "important": ("notice-important", "Importante"),
    "warning": ("notice-risk", "Riesgo"),
    "caution": ("notice-risk", "Riesgo"),
    "pending": ("notice-pending", "Pendiente"),
}
_HEADING_ID = re.compile(r"\s*\{#([A-Za-z0-9_-]+)\}\s*$")
_ALERT = re.compile(r"^\[!(\w+)\]\s*(.*)$")

FigureLoader = Callable[[str], str]


def _braces(text: str) -> str:
    """«{{» in code (chezmoi, Go templates) is code, not an unfilled marker: delphos-check rule 9."""
    return text.replace("{{", "&#123;&#123;")


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "seccion"


def _with_renderer_ignored(rule: Callable[..., str]) -> Callable[..., str]:
    """markdown-it rebinds every render rule to its renderer; the rule keeps its own receiver."""
    return lambda _renderer, tokens, idx, options, env: rule(tokens, idx, options, env)


class Renderer:
    def __init__(self, load_figure: FigureLoader):
        self._load_figure = load_figure
        # HTML en bruto solo para <br> (saltos dentro de una celda); lo demás se rechaza.
        md = MarkdownIt("commonmark", {"html": True, "typographer": False}).enable("table")
        md.core.ruler.push("only_br", self._only_br)
        md.core.ruler.push("heading_ids", self._heading_ids)
        md.core.ruler.push("cell_marks", self._cell_marks)
        md.core.ruler.push("align_to_num", self._align_to_num)
        md.core.ruler.push("alerts", self._alerts)
        md.add_render_rule("fence", _with_renderer_ignored(self._fence))
        md.add_render_rule("code_inline", lambda _r, t, i, o, e: f"<code>{_braces(escapeHtml(t[i].content))}</code>")
        md.add_render_rule("table_open", lambda *a: '<div class="table-wrap"><table>\n')
        md.add_render_rule("table_close", lambda *a: "</table></div>\n")
        md.add_render_rule("blockquote_open", _with_renderer_ignored(self._quote_open))
        md.add_render_rule("blockquote_close", _with_renderer_ignored(self._quote_close))
        md.use(attrs_plugin, spans=True)
        md.use(tasklists_plugin)  # - [ ] / - [x] -> li > input[type=checkbox][disabled] (guide §3)
        md.use(container_plugin, "compare", render=_with_renderer_ignored(self._compare))
        md.use(container_plugin, "col", render=_with_renderer_ignored(self._col))
        self.md = md

    # ---- public ----
    def render(self, text: str) -> tuple:
        env: dict = {"toc": []}
        html = self.md.render(text, env)
        return html, list(env["toc"])

    def inline(self, text: str) -> str:
        return self.md.renderInline(text)

    # ---- core rules ----
    def _heading_ids(self, state):
        seen = set()
        tokens = state.tokens
        for i, tok in enumerate(tokens):
            if tok.type != "heading_open":
                continue
            inline = tokens[i + 1]
            m = _HEADING_ID.search(inline.content)
            if m:
                anchor = m.group(1)
                inline.content = inline.content[: m.start()]
                last = inline.children[-1]
                last.content = _HEADING_ID.sub("", last.content)
            else:
                anchor = slugify(inline.content)
            base, n = anchor, 2
            while anchor in seen:
                anchor, n = f"{base}-{n}", n + 1
            seen.add(anchor)
            tok.attrSet("id", anchor)
            if tok.tag == "h2":
                text = "".join(c.content for c in inline.children if c.type in ("text", "code_inline"))
                state.env["toc"].append(TocEntry(anchor, text))

    def _only_br(self, state):
        for tok in state.tokens:
            if tok.type == "html_block":
                raise ContentError(f"HTML en bruto no admitido: {tok.content.strip()[:60]!r}")
            for child in tok.children or []:
                if child.type == "html_inline" and not re.fullmatch(r"<br\s*/?>", child.content.strip()) \
                        and 'class="task-list-item-checkbox"' not in child.content:
                    raise ContentError(f"HTML en bruto no admitido: {child.content!r} (solo <br>)")

    def _cell_marks(self, state):
        tokens = state.tokens
        for i, tok in enumerate(tokens):
            if tok.type != "tr_open":
                continue
            j = next(k for k in range(i, len(tokens)) if tokens[k].type == "inline")
            inline = tokens[j]
            for mark, cls in CELL_MARKS.items():
                if inline.content.startswith(mark):
                    tokens[j - 1].attrJoin("class", cls)  # the td/th that holds it
                    inline.content = inline.content[len(mark):]
                    inline.children[0].content = inline.children[0].content[len(mark):]
                    break

    def _align_to_num(self, state):
        for tok in state.tokens:
            if tok.type in ("th_open", "td_open"):
                style = tok.attrGet("style")
                if style is None:
                    continue
                del tok.attrs["style"]
                if "right" in str(style):
                    tok.attrJoin("class", "num")

    def _alerts(self, state):
        tokens = state.tokens
        for i, tok in enumerate(tokens):
            if tok.type != "blockquote_open" or i + 2 >= len(tokens):
                continue
            inline = tokens[i + 2]
            if tokens[i + 1].type != "paragraph_open" or inline.type != "inline":
                continue
            first_line = inline.content.split("\n", 1)[0]
            m = _ALERT.match(first_line)
            if not m:
                continue
            kind = m.group(1).lower()
            if kind not in ALERTS:
                raise ContentError(f"aviso desconocido [!{m.group(1)}]")
            tok.meta = {"alert": kind, "title": m.group(2).strip()}
            # drop the marker line from the paragraph
            children = inline.children
            cut = next((k for k, c in enumerate(children) if c.type in ("softbreak", "hardbreak")), len(children) - 1)
            inline.children = children[cut + 1:]
            inline.content = inline.content.split("\n", 1)[1] if "\n" in inline.content else ""
            if not inline.children:
                tokens[i + 1].hidden = tokens[i + 3].hidden = True
            # mark the matching close
            depth = 0
            for close in tokens[i + 1:]:
                if close.type == "blockquote_open":
                    depth += 1
                elif close.type == "blockquote_close":
                    if depth == 0:
                        close.meta = {"alert": kind}
                        break
                    depth -= 1

    # ---- render rules ----
    def _quote_open(self, tokens, idx, options, env):
        meta = tokens[idx].meta or {}
        if "alert" not in meta:
            return "<blockquote>\n"
        modifier, label = ALERTS[meta["alert"]]
        # The title on the marker line replaces the label (guide: «Pendiente · ficha NN»).
        title = meta["title"] or label
        cls = f"notice {modifier}".strip()
        return (f'<div class="{cls}">'
                f'<span class="notice-title">{self.inline(title)}</span>\n')

    def _quote_close(self, tokens, idx, options, env):
        return "</div>\n" if "alert" in (tokens[idx].meta or {}) else "</blockquote>\n"

    def _fence(self, tokens, idx, options, env):
        tok = tokens[idx]
        info = tok.info.strip()
        if info != "figure":
            title = _TITLE_ATTR.search(info)
            lang = _TITLE_ATTR.sub("", info).strip()
            cls = f' class="language-{escapeHtml(lang)}"' if lang else ""
            head = f'<p class="code-title">{escapeHtml(title.group(1))}</p>\n' if title else ""
            return f"{head}<pre><code{cls}>{_braces(escapeHtml(tok.content))}</code></pre>\n"
        try:
            spec = yaml.safe_load(tok.content) or {}
        except yaml.YAMLError as exc:
            raise ContentError(f"bloque figure mal escrito: {exc}") from exc
        src = spec.get("src")
        if not figure_name_ok(src):
            raise ContentError(f"bloque figure sin src válido: {src!r}")
        svg = self._load_figure(src)
        caption = spec.get("caption")
        cap = f"<figcaption>{self.inline(str(caption))}</figcaption>\n" if caption else ""
        return f'<figure class="figwrap">\n{svg.strip()}\n{cap}</figure>\n'

    def _compare(self, tokens, idx, options, env):
        return '<div class="doc-compare">\n' if tokens[idx].nesting == 1 else "</div>\n"

    def _col(self, tokens, idx, options, env):
        tok = tokens[idx]
        if tok.nesting != 1:
            return "</div>\n"
        label = tok.info.strip()[len("col"):].strip()
        head = f'<p class="doc-compare-label">{self.inline(label)}</p>\n' if label else ""
        return f'<div class="doc-compare-col">\n{head}'
