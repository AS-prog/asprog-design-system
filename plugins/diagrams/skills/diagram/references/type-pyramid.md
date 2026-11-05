<!-- Adaptado de diagram-design 2.6.119 (7a12007), skills/diagram-design/references/type-pyramid.md, MIT © Cathryn Lavery.
     Generado por scripts/vendor-diagram-design.mjs: no se edita a mano. -->

> **Delphos.** Esta referencia manda sobre la forma (rejilla, presupuesto, qué va dónde). El estilo lo pone el contrato de [style-guide.md](style-guide.md): una sola tinta por `currentColor`, clases `.d-*` en vez de `fill`/`stroke`/`font-*`, sin `rx`, sin sombras, sin iconos, sin hex. Los fragmentos SVG de abajo ya están traducidos; donde la prosa diga *coral*, *accent* o *link*, es la misma tinta y el foco se marca con `.d-fill` o con una palabra; donde diga *muted* o *soft*, es `.d-dash` o una banda `.d-wash-N`. El modo oscuro lo dan los tokens: no hay nada que invertir. La salida es un `figure.figwrap` dentro del documento (ver [output-spec.md](output-spec.md)), nunca un HTML aparte.

# Pyramid / Funnel

**Best for:** hierarchy of needs, prioritization ranks, value pyramids, conversion funnels, content importance stacks.

## Two orientations — pick one
- **Pyramid** (point up) — narrow apex = most important / rarest / most valuable. Base is broadest / foundational.
- **Funnel** (point down) — narrow end = conversion (smallest group). Top is widest / audience.

Don't mix orientations on one diagram.

## Layout conventions
- 4–6 layers. Each layer is a trapezoid built from an SVG `<polygon>` with 4 points.
- Consistent layer height (56–72px).
- Widths decrease linearly from base to apex (pyramid) or top to bottom (funnel). When showing real funnel data, widths must be honest (proportional to count/percentage).
- Each layer has:
  - **Name label** centered inside the trapezoid — `node-name` role, 12–14px 600.
  - **Sublabel** below or beside the name — `sublabel` role, 9–10px.
  - **Side annotation** (right or left) — optional. For funnels: drop-off percentage here (`−40%`).
- Fill: subtle graded tints OR all paper-2 with hairline dividers (cleaner). Pick one.
- Stroke: 1px hairline between layers; outer silhouette 1px muted or ink.
- **Coral on ONE layer only**: apex of pyramid, conversion layer of funnel, or critical bottleneck.
- Optional left-margin axis arrow + `eyebrow`-role label (`rarer ↑`, `drop-off ↓`).

## Anti-patterns
- 7+ layers (illegible — compress or split).
- Pyramid for non-hierarchical data (use a tree or bar chart).
- Dishonest widths (fake equal spacing when drops are unequal).
- Coral on the base layer (dilutes the "apex = rare" signal).
