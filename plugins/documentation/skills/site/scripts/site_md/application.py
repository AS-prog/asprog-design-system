"""Application: read -> convert -> lay out -> write."""
from __future__ import annotations

import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import List

from . import adapters, layout
from .domain import ContentError, Page, RenderedPage, SiteMap
from .markdown import Renderer

# La skill lleva su copia del sistema (`site/system/`) y la hermana `check/` lleva delphos-check.
# Un sitio puede fijar otra copia en <root>/vendor/ (design-system/vX.Y/ y check/): manda esa.
SKILL = Path(__file__).resolve().parents[2]
BUNDLED_SYSTEM = SKILL / "system"
BUNDLED_CHECK = SKILL.parent / "check"


@dataclass(frozen=True)
class SiteDirs:
    root: Path

    @property
    def content(self) -> Path: return self.root / "content"
    @property
    def figs(self) -> Path: return self.root / "figs"
    @property
    def vendor(self) -> Path: return self.root / "vendor"
    @property
    def site_map(self) -> Path: return self.root / "site.toml"


@dataclass
class BuildResult:
    pages: List[Page]
    figures: List[str]
    out_dir: Path
    lint: str = ""


def _load(dirs: SiteDirs):
    site = SiteMap.from_config(adapters.read_site_map(dirs.site_map))
    figures = adapters.FigureStore(dirs.figs)
    renderer = Renderer(figures.load)
    listed = {e.path for e in site.entries() if e.path}
    found = {str(p.relative_to(dirs.root)) for p in adapters.iter_content(dirs.content)}
    if found - listed:
        raise ContentError(f"páginas fuera de site.toml: {', '.join(sorted(found - listed))}")
    if listed - found:
        raise ContentError(f"site.toml apunta a páginas que no existen: {', '.join(sorted(listed - found))}")
    rendered = []
    for source in sorted(listed):
        front, body = adapters.read_markdown(dirs.root / source)
        page = Page.from_frontmatter(source, front, body, site.entry_for(source), site.section_for(source))
        html, toc = renderer.render(body)
        rendered.append(RenderedPage(page, html, toc))
    return site, rendered, renderer, figures


def system_source(dirs: SiteDirs, site: SiteMap) -> Path:
    """The design system copied to <out>/<site.system>: the site's vendor copy, or the skill's."""
    vendored = dirs.vendor / site.system
    if vendored.is_dir():
        return vendored
    if not (BUNDLED_SYSTEM / "VERSION").is_file():
        raise ContentError(f"falta la copia del sistema: ni {vendored} ni {BUNDLED_SYSTEM}")
    bundled = (BUNDLED_SYSTEM / "VERSION").read_text(encoding="utf-8").strip()
    expected = "v" + ".".join(bundled.split(".")[:2])
    if Path(site.system).name != expected:
        raise ContentError(f"site.toml pide {site.system} y la skill trae {bundled}: "
                           f"pon system = \"design-system/{expected}\" o fija la copia en vendor/{site.system}/")
    return BUNDLED_SYSTEM


def checker_dir(dirs: SiteDirs) -> Path:
    """delphos-check and classes.json: the site's vendor/check/, or the sibling skill check/."""
    vendored = dirs.vendor / "check"
    return vendored if (vendored / "scripts" / "delphos-check").is_file() else BUNDLED_CHECK


def _version(dirs: SiteDirs, site: SiteMap) -> str:
    path = system_source(dirs, site) / "VERSION"
    if not path.is_file():
        raise ContentError(f"falta VERSION en la copia del sistema: {path}")
    return path.read_text(encoding="utf-8").strip()


def _home(dirs: SiteDirs, site: SiteMap, renderer: Renderer):
    text = (dirs.root / site.home).read_text(encoding="utf-8")
    m = re.match(r"# (.+?)\n+(.+?)(?:\n\n(.*))?\Z", text, re.S)
    if not m:
        raise ContentError(f"{site.home}: empieza por «# Título» y un párrafo de entrada")
    title, lede, rest = m.group(1).strip(), m.group(2).strip(), m.group(3) or ""
    body, _ = renderer.render(rest)
    return title, renderer.inline(lede), body, re.sub(r"[`*_]", "", lede)


def check(root: Path) -> BuildResult:
    """Validate everything without writing."""
    dirs = SiteDirs(root)
    site, rendered, renderer, figures = _load(dirs)
    _version(dirs, site)
    _home(dirs, site, renderer)
    return BuildResult([rp.page for rp in rendered], sorted(figures.used), root / "dist")


def build(root: Path, out_dir: Path) -> BuildResult:
    dirs = SiteDirs(root)
    site, rendered, renderer, figures = _load(dirs)
    version = _version(dirs, site)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    adapters.copy_design_system(system_source(dirs, site), out_dir / site.system)
    for rp in rendered:
        adapters.write(out_dir / rp.page.href, layout.render_page(site, rp, renderer.inline, version))
    title, lede, body, description = _home(dirs, site, renderer)
    adapters.write(out_dir / layout.INDEX, layout.render_index(site, title, lede, body, description, version))
    built = [out_dir / layout.INDEX] + [out_dir / rp.page.href for rp in rendered]
    ok, report = adapters.delphos_check(checker_dir(dirs) / "scripts" / "delphos-check", built)
    if not ok:
        raise ContentError(f"delphos-check:\n{report}")
    return BuildResult([rp.page for rp in rendered], sorted(figures.used), out_dir, report)
