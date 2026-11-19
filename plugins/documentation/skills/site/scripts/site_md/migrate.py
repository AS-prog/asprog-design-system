"""Pase 1 de la migración: un artefacto HTML publicado -> content/<x>/<y>.md + figs/*.svg.

Herramienta de una vez por página. Convierte con pandoc lo que es Markdown
corriente y saca a mano lo que no lo es (diagramas, bloques de código con
título, avisos, comparaciones, filas de estado). Después vuelve a renderizar el
.md y compara el texto con el original: si no sale idéntico, lo dice.
"""
from __future__ import annotations

import difflib
from datetime import date as _date
import html as htmllib
import json
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

import yaml

from .domain import ContentError
from .markdown import Renderer, slugify

NOTICE_KIND = {"": "NOTE", "notice-important": "IMPORTANT", "notice-risk": "WARNING", "notice-pending": "pending"}
ROW_MARK = {"doc-done": "✓ ", "doc-clean": "✗ "}


@dataclass
class Migration:
    markdown: str
    figures: Dict[str, str]
    similarity: float
    diffs: List[str]
    warnings: List[str] = field(default_factory=list)


def _text(fragment: str) -> str:
    fragment = re.sub(r"<(script|style)\b.*?</\1>", " ", fragment, flags=re.S)
    return re.sub(r"\s+", " ", htmllib.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def _pandoc(fragment: str, inline: bool = False) -> str:
    out = subprocess.run(["pandoc", "-f", "html", "-t", "gfm-raw_html", "--wrap=none"],
                         input=fragment, capture_output=True, text=True, check=True).stdout.strip()
    out = out.replace("\\#", "#").replace("\\[!", "[!").replace("\\{#", "{#")
    out = re.sub(r"\[!(\w+)\\\]", r"[!\1]", out)
    out = re.sub(r"\\\}", "}", out)
    return out.replace("\n", " ") if inline else out


def _section(html: str, pattern: str) -> Optional[str]:
    m = re.search(pattern, html, re.S)
    return m.group(1) if m else None


def _known_classes(check_dir: Path) -> set:
    path = check_dir / "classes.json"
    return set(json.loads(path.read_text())) if path.is_file() else set()


def migrate(source_html: str, fig_prefix: str, check_dir: Path) -> Migration:
    warnings: List[str] = []
    html = re.sub(r"<style\b.*?</style>", "", source_html, flags=re.S)
    article = _section(html, r'<article class="doc-prose">(.*)</article>')
    if article is None:
        raise ContentError("no encuentro article.doc-prose")
    head = _section(html, r'<header class="doc-header">(.*?)</header>') or ""
    between = _section(html, r'<header class="doc-header">.*?</header>(.*?)<article class="doc-prose">') or ""
    between = re.sub(r'<nav class="doc-toc".*?</nav>', "", between, flags=re.S)
    original_text = _text(between + article)
    body = between + article

    # --- front matter ---
    front: Dict[str, object] = {}
    front["title"] = _text(_section(head, r"<h1[^>]*>(.*?)</h1>") or "")
    front["lede"] = _pandoc(_section(head, r'<p class="lede">(.*?)</p>') or "", inline=True)
    desc = re.search(r'<meta name="description" content="([^"]*)"', html)
    if desc:
        front["description"] = htmllib.unescape(desc.group(1))
    meta = {}
    for dt, dd in re.findall(r"<dt>(.*?)</dt>\s*<dd>(.*?)</dd>", head, re.S):
        key = _text(dt)
        if key == "Fecha" and "date" not in front:
            m = re.search(r"\d{4}-\d{2}-\d{2}", dd)
            if m:
                front["date"] = _date.fromisoformat(m.group(0))
                continue
        meta[key] = _pandoc(dd, inline=True)
    if "date" not in front:
        warnings.append("sin fecha en la ficha: rellenar date a mano")
        front["date"] = "AAAA-MM-DD"
    brand = _section(html, r'<span class="doc-brand">(.*?)</span>')
    if brand:
        front["brand"] = _text(brand)
    if meta:
        front["meta"] = meta
    footer = _section(html, r'<footer class="doc-footer">\s*<span>(.*?)</span>')
    if footer:
        front["source"] = re.sub(r"^Fuente:\s*", "", _pandoc(footer, inline=True))

    # --- placeholders for what pandoc must not touch ---
    blocks: List[str] = []
    def hold(md: str) -> str:
        blocks.append(md)
        return f"<p>HOLD{len(blocks) - 1:04d}</p>"

    figures: Dict[str, str] = {}
    def figure(m) -> str:
        svg, cap = m.group(1).strip(), (m.group(2) or "").strip()
        title = _section(svg, r"<title[^>]*>(.*?)</title>") or f"figura {len(figures) + 1}"
        name = f"{fig_prefix}-{len(figures) + 1:02d}-{slugify(_text(title))[:40].strip('-')}.svg"
        figures[name] = svg + "\n"
        spec = {"src": name}
        if cap:
            spec["caption"] = _pandoc(cap, inline=True)
        return hold("```figure\n" + yaml.safe_dump(spec, allow_unicode=True, sort_keys=False, width=10**6).strip() + "\n```")
    body = re.sub(r'<figure class="figwrap[^"]*">\s*(<svg.*?</svg>)\s*(?:<figcaption>(.*?)</figcaption>)?\s*</figure>',
                  figure, body, flags=re.S)

    def code(m) -> str:
        title, lang, text = m.group(1), m.group(2) or "", htmllib.unescape(re.sub(r"<[^>]+>", "", m.group(3)))
        info = lang + (f' title="{_text(title)}"' if title else "")
        fence = "````" if "```" in text else "```"
        return hold(f"{fence}{info}\n{text.rstrip()}\n{fence}")
    body = re.sub(r'(?:<p class="code-title">([^<]*(?:<(?!/p>)[^<]*)*)</p>\s*)?<pre[^>]*>(?:<code(?: class="language-([\w-]+)")?>)?(.*?)(?:</code>)?</pre>',
                  code, body, flags=re.S)

    def notice(m) -> str:
        cls, anchor, title, inner = (m.group(1) or "").strip(), m.group(2), _text(m.group(3)), m.group(4)
        if anchor:
            warnings.append(f"el aviso #{anchor} pierde su ancla: revisar enlaces a él")
        kind = NOTICE_KIND.get(cls)
        if kind is None:
            warnings.append(f"aviso de tipo desconocido {cls!r}: va como NOTE")
            kind = "NOTE"
        return f"<blockquote><p>[!{kind}] {htmllib.escape(title)}<br></p>{inner}</blockquote>"
    body = re.sub(r'<div class="notice ?([\w-]*)"(?: id="([^"]*)")?>\s*<span class="notice-title">(.*?)</span>(.*?)</div>',
                  notice, body, flags=re.S)

    body = re.sub(r'<div class="table-wrap">(.*?)</div>', r"\1", body, flags=re.S)
    body = _mark_compare(body)
    for cls, mark in ROW_MARK.items():
        body = re.sub(rf'<tr class="{cls}">\s*<t([dh])([^>]*)>', rf"<tr><t\1\2>{mark}", body)
    body = re.sub(r'<t([hd]) class="num">', r'<t\1 align="right">', body)
    body = re.sub(r"(<t[dh][^>]*>)(.*?)(</t[dh]>)",
                  lambda c: c.group(1) + re.sub(r"<br\s*/?>", "⟨BR⟩", c.group(2)) + c.group(3), body, flags=re.S)
    # spans with a system class keep it as an attribute: [texto]{.g-ok}
    # una marca en negrita: la negrita pasa fuera para que el span quede con texto plano
    body = re.sub(r'<span class="((?:doc-new|g-ok|g-warn|g-stop|d-new)(?: [\w-]+)*)"><strong>([^<]*)</strong></span>',
                  r'<strong><span class="\1">\2</span></strong>', body)
    body = re.sub(r'<span class="((?:doc-new|g-ok|g-warn|g-stop|d-new)(?: [\w-]+)*)">([^<]*)</span>',
                  lambda c: f"⟦{c.group(2)}⟧⟪{c.group(1)}⟫", body)
    body = re.sub(r'<h2 id="([^"]+)">(.*?)</h2>', r"<h2>\2 {#\1}</h2>", body, flags=re.S)

    # what is left with a class is reported, not silently kept
    rest = re.sub(r"<svg.*?</svg>", "", body, flags=re.S)
    for c in sorted(set(c for cl in re.findall(r'class="([^"]+)"', rest) for c in cl.split())):
        warnings.append(f"clase sin traducir: {c} (queda solo el texto)")

    md = _pandoc(body)
    # pandoc leaves «|» inside code spans of a table cell unescaped: GFM would split the cell
    md = "\n".join(re.sub(r"`[^`]*`", lambda c: c.group(0).replace("|", "\\|").replace("\\\\|", "\\|"), l)
                   if l.startswith("|") else l for l in md.split("\n"))
    md = re.sub(r"HOLD(\d{4})", lambda m: blocks[int(m.group(1))], md)
    md = re.sub(r"⟦(.*?)⟧⟪(.*?)⟫", lambda c: "[" + c.group(1) + "]{" + " ".join("." + k for k in c.group(2).split()) + "}", md)
    md = md.replace("⟨BR⟩", "<br>")
    md = _close_compare(md)

    for name, svg in figures.items():
        if "<title" not in svg or "<desc" not in svg:
            warnings.append(f"{name}: le falta <title> o <desc>; el build lo exige")
    known = _known_classes(check_dir)
    if known:
        for name, svg in figures.items():
            for c in sorted(set(c for cl in re.findall(r'class="([^"]+)"', svg) for c in cl.split())):
                if re.match(r"(d|g|hl|doc|lib)-", c) and c not in known:
                    warnings.append(f"{name}: clase {c} no está en el sistema (delphos-check la rechazará)")

    text = "---\n" + yaml.safe_dump(front, allow_unicode=True, sort_keys=False, width=10**6) + "---\n\n" + md.strip() + "\n"
    rendered, _ = Renderer(lambda n: figures[n]).render(md)
    new_text = _text(rendered)
    if original_text == new_text:
        return Migration(text, figures, 1.0, [], warnings)
    if original_text.replace(" ", "") == new_text.replace(" ", ""):
        warnings.append("el texto solo difiere en espacios")
        return Migration(text, figures, 1.0, [], warnings)
    sm = difflib.SequenceMatcher(None, original_text, new_text, autojunk=False)
    diffs = [f"{op}: {original_text[a:b][:80]!r} → {new_text[c:d][:80]!r}"
             for op, a, b, c, d in sm.get_opcodes() if op != "equal"]
    return Migration(text, figures, min(sm.ratio(), 0.9999), diffs, warnings)


def _mark_compare(body: str) -> str:
    """doc-compare blocks -> paragraph markers that survive pandoc (balanced divs)."""
    out, pos = [], 0
    for m in re.finditer(r'<div class="doc-compare">', body):
        if m.start() < pos:
            continue
        out.append(body[pos:m.start()])
        depth, i, stack, piece = 0, m.start(), [], []
        for t in re.finditer(r"<div\b[^>]*>|</div>", body[m.start():]):
            tag = t.group(0)
            if tag.startswith("<div"):
                depth += 1
                kind = "cmp" if "doc-compare\"" in tag else "col" if "doc-compare-col" in tag else "other"
                stack.append(kind)
            else:
                depth -= 1
                kind = stack.pop()
            seg_end = m.start() + t.start()
            piece.append(body[i:seg_end])
            i = m.start() + t.end()
            if tag.startswith("<div"):
                piece.append({"cmp": "<p>CMP_OPEN</p>", "col": "<p>COL_OPEN</p>"}.get(kind, tag))
            else:
                piece.append({"cmp": "<p>CMP_CLOSE</p>", "col": "<p>COL_CLOSE</p>"}.get(kind, tag))
            if depth == 0:
                break
        text = "".join(piece)
        text = re.sub(r'<p>COL_OPEN</p>\s*<p class="doc-compare-label">(.*?)</p>',
                      lambda c: f"<p>COL_OPEN {c.group(1)}</p>", text, flags=re.S)
        out.append(text)
        pos = i
    out.append(body[pos:])
    return "".join(out)


def _close_compare(md: str) -> str:
    """Markers -> ::::: compare / :::: col Label blocks."""
    md = re.sub(r"^CMP_OPEN$", "::::: compare", md, flags=re.M)
    md = re.sub(r"^CMP_CLOSE$", ":::::", md, flags=re.M)
    md = re.sub(r"^COL_OPEN ?(.*)$", lambda m: (":::: col " + m.group(1)).rstrip(), md, flags=re.M)
    return re.sub(r"^COL_CLOSE$", "::::", md, flags=re.M)
