"""Domain: page, site map and their contracts. No I/O here."""
from __future__ import annotations

import posixpath
from dataclasses import dataclass, field
from datetime import date
from typing import Dict, List, Optional

# Los tipos de página de la skill `site` (los mismos que en site.toml de site.py).
TYPES = ("cómo funciona", "implementación", "diseño", "historia", "método", "guía", "generada")
REQUIRED = ("title", "lede", "date")


class ContentError(ValueError):
    """A page, figure or the site map breaks its contract."""


@dataclass(frozen=True)
class TocEntry:
    anchor: str
    text: str


def html_path(source: str) -> str:
    """content/agentes/a6-capas.md -> agentes/a6-capas.html"""
    if not (source.startswith("content/") and source.endswith(".md")):
        raise ContentError(f"{source}: una página vive en content/<carpeta>/<nombre>.md")
    return source[len("content/"):-len(".md")] + ".html"


def rel(target: str, page: str) -> str:
    """Path of target seen from page, both relative to the site root."""
    return posixpath.relpath(target, posixpath.dirname(page) or ".")


@dataclass(frozen=True)
class Entry:
    title: str
    type: str
    path: Optional[str] = None  # .md source; None = announced
    was: Optional[str] = None   # artifact it comes from

    @property
    def href(self) -> Optional[str]:
        return html_path(self.path) if self.path else None


@dataclass(frozen=True)
class Section:
    title: str
    entries: List[Entry]
    fold: bool = False


@dataclass
class SiteMap:
    name: str
    brand: str
    system: str
    home: str
    sections: List[Section]

    @classmethod
    def from_config(cls, config: dict) -> "SiteMap":
        project = config.get("project", {})
        sections = []
        seen = set()
        for s in config.get("section", []):
            entries = []
            for p in s.get("page", []):
                if p.get("type") not in TYPES:
                    raise ContentError(f"{p.get('title')}: tipo {p.get('type')!r}; vale {', '.join(TYPES)}")
                path = p.get("path")
                if path:
                    html_path(path)
                    if path in seen:
                        raise ContentError(f"{path} sale dos veces en el mapa")
                    seen.add(path)
                entries.append(Entry(p["title"], p["type"], path, p.get("was")))
            sections.append(Section(s["title"], entries, bool(s.get("fold"))))
        name = project.get("name", "Site")
        return cls(name, project.get("brand", name), project.get("system", "design-system"),
                   project.get("home", "home.md"), sections)

    def entries(self) -> List[Entry]:
        return [e for s in self.sections for e in s.entries]

    def entry_for(self, source: str) -> Entry:
        for e in self.entries():
            if e.path == source:
                return e
        raise ContentError(f"{source} no está en site.toml")

    def section_for(self, source: str) -> Section:
        return next(s for s in self.sections for e in s.entries if e.path == source)

    def link_map(self) -> Dict[str, str]:
        """Artifact URL -> page href, for migrated pages only."""
        return {e.was: e.href for e in self.entries() if e.was and e.href}


@dataclass
class Page:
    source: str
    title: str
    lede: str
    date: date
    type: str
    section: str
    body: str
    description: str = ""
    brand: str = ""
    meta: Dict[str, str] = field(default_factory=dict)
    sources: str = ""

    @property
    def href(self) -> str:
        return html_path(self.source)

    @classmethod
    def from_frontmatter(cls, source: str, front: dict, body: str, entry: Entry, section: Section) -> "Page":
        missing = [k for k in REQUIRED if not front.get(k)]
        if missing:
            raise ContentError(f"{source}: faltan campos {', '.join(missing)}")
        if not isinstance(front["date"], date):
            raise ContentError(f"{source}: la fecha debe ser AAAA-MM-DD")
        return cls(
            source=source,
            title=str(front["title"]),
            lede=str(front["lede"]).strip(),
            date=front["date"],
            type=entry.type,
            section=section.title,
            body=body,
            description=str(front.get("description", "")),
            brand=str(front.get("brand", "")),
            meta={str(k): str(v) for k, v in (front.get("meta") or {}).items()},
            sources=str(front.get("source", "")),
        )


@dataclass
class RenderedPage:
    page: Page
    html: str
    toc: List[TocEntry]


def needs_toc(toc: List[TocEntry]) -> bool:
    return len(toc) >= 4


def figure_name_ok(name: Optional[str]) -> bool:
    return bool(name) and name.endswith(".svg") and "/" not in name
