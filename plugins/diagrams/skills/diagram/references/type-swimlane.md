<!-- Adaptado de diagram-design 2.6.119 (7a12007), skills/diagram-design/references/type-swimlane.md, MIT © Cathryn Lavery.
     Generado por scripts/vendor-diagram-design.mjs: no se edita a mano. -->

> **Delphos.** Esta referencia manda sobre la forma (rejilla, presupuesto, qué va dónde). El estilo lo pone el contrato de [style-guide.md](style-guide.md): una sola tinta por `currentColor`, clases `.d-*` en vez de `fill`/`stroke`/`font-*`, sin `rx`, sin sombras, sin iconos, sin hex. Los fragmentos SVG de abajo ya están traducidos; donde la prosa diga *coral*, *accent* o *link*, es la misma tinta y el foco se marca con `.d-fill` o con una palabra; donde diga *muted* o *soft*, es `.d-dash` o una banda `.d-wash-N`. El modo oscuro lo dan los tokens: no hay nada que invertir. La salida es un `figure.figwrap` dentro del documento (ver [output-spec.md](output-spec.md)), nunca un HTML aparte.

# Swimlane

**Best for:** cross-functional processes, RACI-style flows, vendor handoffs, multi-team shipping workflows.

**Not this type:** what the customer sees vs what stays hidden, on one shared stage grid → **Service blueprint** (`type-service-blueprint.md`). A blueprint has no arrows; stage order is the sequence.

## Layout conventions
- Horizontal lanes (or vertical columns) — one per actor/team. Label each lane in the left margin (or top) with an `eyebrow`-role label.
- Lane dividers: 1px hairlines.
- Process steps are rectangles placed inside the lane of the actor performing them; arrows show flow.
- Handoffs (arrows crossing lane boundaries) are the most important edges — consider coral on the handoff that introduces the most coupling or latency.
- Don't force equal step count per lane; a lane with one step is fine.

## Anti-patterns
- Lanes without labels.
- A step drawn across two lanes (pick one owner).
- Arrows that snake back and forth — reorder steps so the flow is mostly straight.
