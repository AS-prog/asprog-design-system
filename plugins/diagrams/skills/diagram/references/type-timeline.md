<!-- Adaptado de diagram-design 2.6.119 (7a12007), skills/diagram-design/references/type-timeline.md, MIT © Cathryn Lavery.
     Generado por scripts/vendor-diagram-design.mjs: no se edita a mano. -->

> **Delphos.** Esta referencia manda sobre la forma (rejilla, presupuesto, qué va dónde). El estilo lo pone el contrato de [style-guide.md](style-guide.md): una sola tinta por `currentColor`, clases `.d-*` en vez de `fill`/`stroke`/`font-*`, sin `rx`, sin sombras, sin iconos, sin hex. Los fragmentos SVG de abajo ya están traducidos; donde la prosa diga *coral*, *accent* o *link*, es la misma tinta y el foco se marca con `.d-fill` o con una palabra; donde diga *muted* o *soft*, es `.d-dash` o una banda `.d-wash-N`. El modo oscuro lo dan los tokens: no hay nada que invertir. La salida es un `figure.figwrap` dentro del documento (ver [output-spec.md](output-spec.md)), nunca un HTML aparte.

# Timeline

**Best for:** release history, project milestones, incident timelines, roadmaps, changelog visualizations.

## Layout conventions
- Horizontal hairline baseline across the middle (`stroke-width=1`).
- Tick marks at time boundaries (quarters, months, sprints) with date labels below in the `arrow-label` role.
- Events: small filled circles (`r=4`) on the baseline. Labels alternate above and below to prevent collision, connected to the circle with a 1px hairline drop.
- Major milestones: `accent` circle (`r=6`) + bold `node-name`-role label.
- Time scale must be honest: if intervals are non-equal, space the circles non-equally. Don't fake linear spacing for aesthetics. Break the axis visibly if a region is too dense.

## Anti-patterns
- Equal-spacing events that aren't equally spaced in time.
- Missing axis labels ("what unit is this?").
- Crowded labels without vertical offset — illegible.
