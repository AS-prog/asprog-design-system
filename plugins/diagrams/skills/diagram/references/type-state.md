<!-- Adaptado de diagram-design 2.6.119 (7a12007), skills/diagram-design/references/type-state.md, MIT © Cathryn Lavery.
     Generado por scripts/vendor-diagram-design.mjs: no se edita a mano. -->

> **Delphos.** Esta referencia manda sobre la forma (rejilla, presupuesto, qué va dónde). El estilo lo pone el contrato de [style-guide.md](style-guide.md): una sola tinta por `currentColor`, clases `.d-*` en vez de `fill`/`stroke`/`font-*`, sin `rx`, sin sombras, sin iconos, sin hex. Los fragmentos SVG de abajo ya están traducidos; donde la prosa diga *coral*, *accent* o *link*, es la misma tinta y el foco se marca con `.d-fill` o con una palabra; donde diga *muted* o *soft*, es `.d-dash` o una banda `.d-wash-N`. El modo oscuro lo dan los tokens: no hay nada que invertir. La salida es un `figure.figwrap` dentro del documento (ver [output-spec.md](output-spec.md)), nunca un HTML aparte.

# State Machine

**Best for:** finite state logic — order status, auth state, connection lifecycle, form wizard, job queue status — and the [`Lifecycle phase map`](semantic-patterns.md#9-lifecycle-phase-map) pattern when one subject's progress, waits, retries, cancellation, and outcomes are the story.

## Routing distinctions

- Use **Sequence** for time-ordered messages between actors, including request/message lifecycles.
- Use ordinary **State Machine** for dense transition logic where events, guards, and legal transitions dominate.
- Use the **Lifecycle phase map** semantic pattern for one subject moving through 4–5 primary phases with separate wait/recovery and terminal-outcome bands.

## Layout conventions
- States are rounded rectangles (`rx=8`), labeled in the `node-name` role.
- **Start**: filled ink dot (`r=6`). **End**: ringed dot (outer `r=8` outline, inner filled `r=5`).
- Transitions: curved arrows labeled in the `arrow-label` role as `event [guard] / action` (omit sections you don't need).
- Self-loops curve above the state.
- Orient along the dominant flow direction (left→right or top→down); rearrange before crossing transitions.
- Coral on the state the reader should notice — typically the error state, or "happy completion".

## Anti-patterns
- More transitions than states × 2 → likely two state machines.
- "From any state" transitions drawn from every state — use a single annotation (`* → Error on timeout`) instead.
- Unlabeled transitions (the whole point is *what triggers this*).
