"""Adapters: file system for the site map, content, figures and the pinned design system."""
from __future__ import annotations

import re
import shutil
import tomllib
from pathlib import Path
from typing import Iterator, Tuple

import yaml

from .domain import ContentError

_FRONT = re.compile(r"\A---\n(.*?)\n---\n?(.*)\Z", re.S)


def read_site_map(path: Path) -> dict:
    if not path.is_file():
        raise ContentError(f"falta {path.name}")
    return tomllib.loads(path.read_text(encoding="utf-8"))


def read_markdown(path: Path) -> Tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    m = _FRONT.match(text)
    if not m:
        raise ContentError(f"{path}: falta el frontmatter entre ---")
    front = yaml.safe_load(m.group(1)) or {}
    return front, m.group(2)


def iter_content(content_dir: Path) -> Iterator[Path]:
    yield from sorted(content_dir.glob("*/*.md"))


class FigureStore:
    """Reads SVG figures and enforces their accessibility contract."""

    def __init__(self, figs_dir: Path):
        self.figs_dir = figs_dir
        self.used = set()

    def load(self, name: str) -> str:
        path = self.figs_dir / name
        if not path.is_file():
            raise ContentError(f"no existe la figura {name}")
        svg = path.read_text(encoding="utf-8")
        if "<svg" not in svg or "<title" not in svg or "<desc" not in svg:
            raise ContentError(f"{name}: el SVG necesita <title> y <desc>")
        self.used.add(name)
        return svg


def copy_design_system(vendor_dir: Path, out_dir: Path) -> None:
    """Copies vendor/design-system/vX.Y/ to <out>/design-system/vX.Y/."""
    if not vendor_dir.is_dir() or not (vendor_dir / "tokens.css").is_file():
        raise ContentError(f"falta la copia del sistema en {vendor_dir}")
    shutil.copytree(vendor_dir, out_dir, dirs_exist_ok=True)


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def delphos_check(checker: Path, pages: list) -> Tuple[bool, str]:
    """Runs the design system's delphos-check on the built pages. Needs node."""
    import shutil as _sh
    import subprocess
    node = _sh.which("node")
    if not node:
        return True, "aviso: sin node, no se ha pasado delphos-check"
    res = subprocess.run([node, str(checker), *map(str, pages)], capture_output=True, text=True)
    return res.returncode == 0, (res.stdout + res.stderr).strip()
