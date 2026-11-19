"""CLI: `site-md build [--out DIR]`, `site-md check` and `site-md migrate`."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .application import SiteDirs, build, check, checker_dir
from .domain import ContentError


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="site-md", description="Sitio de documentación en Markdown con asprog-design-system.")
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--root", type=Path, default=Path("docs/site"),
                        help="carpeta del sitio, con site.toml (por defecto, docs/site)")
    sub = parser.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build", parents=[common], help="genera <root>/dist/")
    b.add_argument("--out", type=Path, default=None)
    sub.add_parser("check", parents=[common], help="valida sin escribir")
    m = sub.add_parser("migrate", parents=[common], help="pase 1: un artefacto HTML -> content/*.md + figs/")
    m.add_argument("html", type=Path, help="el HTML publicado del artefacto")
    m.add_argument("md", help="destino, relativo a la raíz del sitio: content/<carpeta>/<nombre>.md")
    m.add_argument("--figs", required=True, help="prefijo de los SVG, p. ej. maquinas-acceso")
    m.add_argument("--force", action="store_true", help="pisa el .md y los SVG si existen")
    args = parser.parse_args(argv)
    try:
        if args.cmd == "build":
            res = build(args.root, args.out or args.root / "dist")
            print(res.lint)
            print(f"{len(res.pages)} páginas y {len(res.figures)} figuras en {res.out_dir}")
        elif args.cmd == "migrate":
            return _migrate(args)
        else:
            res = check(args.root)
            print(f"ok: {len(res.pages)} páginas, {len(res.figures)} figuras")
    except ContentError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


def _migrate(args) -> int:
    from .migrate import migrate
    res = migrate(args.html.read_text(encoding="utf-8"), args.figs, checker_dir(SiteDirs(args.root)))
    target = args.root / args.md
    figs = {args.root / "figs" / n: svg for n, svg in res.figures.items()}
    clash = [p for p in [target, *figs] if p.exists()]
    if clash and not args.force:
        print("error: ya existen (usa --force): " + ", ".join(str(p.relative_to(args.root)) for p in clash), file=sys.stderr)
        return 1
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(res.markdown, encoding="utf-8")
    for path, svg in figs.items():
        path.write_text(svg, encoding="utf-8")
    print(f"{args.md}: {len(res.figures)} figuras, texto {'idéntico' if res.similarity == 1 else f'{res.similarity:.4f}'}")
    for d in res.diffs[:20]:
        print("  diferencia " + d)
    for w in res.warnings:
        print("  aviso: " + w)
    return 0 if res.similarity == 1 else 2


if __name__ == "__main__":
    sys.exit(main())
