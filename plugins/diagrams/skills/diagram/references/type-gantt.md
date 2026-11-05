<!-- Adaptado de diagram-design 2.6.119 (7a12007), skills/diagram-design/references/type-gantt.md, MIT © Cathryn Lavery.
     Generado por scripts/vendor-diagram-design.mjs: no se edita a mano. -->

> **Delphos.** Esta referencia manda sobre la forma (rejilla, presupuesto, qué va dónde). El estilo lo pone el contrato de [style-guide.md](style-guide.md): una sola tinta por `currentColor`, clases `.d-*` en vez de `fill`/`stroke`/`font-*`, sin `rx`, sin sombras, sin iconos, sin hex. Los fragmentos SVG de abajo ya están traducidos; donde la prosa diga *coral*, *accent* o *link*, es la misma tinta y el foco se marca con `.d-fill` o con una palabra; donde diga *muted* o *soft*, es `.d-dash` o una banda `.d-wash-N`. El modo oscuro lo dan los tokens: no hay nada que invertir. La salida es un `figure.figwrap` dentro del documento (ver [output-spec.md](output-spec.md)), nunca un HTML aparte.

# Gantt Chart

**Best for:** project plans and roadmaps — tasks with explicit start and end dates, grouped into phases. Use when the reader needs to see temporal overlap, parallel tracks, and milestone sequencing at a glance.

## Layout conventions

- **Left label column:** x=20–200 (180px). Task names in the `node-name` role at 11px 600. Phase labels as `eyebrow` 7px above each group.
- **Timeline area:** x=200–960 (760px). Time axis runs left→right.
- **Row height:** 40px per task. Each bar occupies h=24px centered in the row (8px top padding).
- **Time axis:** `arrow-label` role 8px week/month labels at x=200+i×pitch, y=56 (just above first task row). A hairline separator at y=64.
- **Phase grouping:** a subtle zone rect (same pattern as architecture zone) behind each phase's rows, with an eyebrow label in the top-left margin. Use `ink @ 0.02` fill, `ink @ 0.10` stroke.
- **Focal task bar:** 1 bar in accent fill/stroke (the key deliverable or critical path task). All others: muted fill @ 0.15, muted stroke.
- **Today / milestone marker:** optional vertical dashed line in `muted` at the current week x-position.

### Task bar pattern

```svg
<!-- Non-focal task -->
<rect class="d-wash-2 d-box" x="X_start" y="ROW_Y+8" width="DURATION_PX" height="24"/>
<text class="d-t" x="X_start+8" y="ROW_Y+25">Task name</text>

<!-- Focal task -->
<rect class="d-wash-2 d-box" x="X_start" y="ROW_Y+8" width="DURATION_PX" height="24"/>
<text class="d-t" x="X_start+8" y="ROW_Y+25">Key task</text>
```

Duration in pixels: `(end_week - start_week) × pitch`. Pitch = timeline_width / total_weeks.

## Anti-patterns

- More than 12 tasks (splits into sub-plans or collapses into phase-level view).
- More than 5 parallel tracks per phase (illegible overlap).
- Dependency arrows between tasks in v1 (add only when essential; use the annotation primitive for labels).
- Start/end dates in the bar label (put them in the x-axis or tooltip comment instead).
- Equal visual weight for all bars (the focal task must stand out).
