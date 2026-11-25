---
version: alpha
name: "Delphos · claro"
description: "Generado desde tokens.json (v0.20.0) de asprog-design-system con npm run build. No se edita a mano. Papel, una sola tinta, papel de puntos, Newsreader, Hanken Grotesk y DM Mono, radio 0."
unit: "la diapositiva o el fotograma de 1920×1080; las medidas son px de ese escenario"
theme: light

colors:
  ink: "#1f2be0"
  ground: "#f0ebde"
  paper: "#f0ebde"
  rule: "rgba(31, 43, 224, .28)"
  rule-soft: "rgba(31, 43, 224, .14)"
  grid: "rgba(40, 38, 34, .1)"
  muted: "#3e48e0"
  accent: "#1f2be0"
  ok: "#1f2be0"
  warn: "#4951e0"
  stop: "#4d55e0"
  solution: "#17652f"
  solution-bg: "#d8e4cf"
  pending-a: "#8a4f00"
  pending-b: "#6b3fa8"
  proposal: "#b3261e"
  note-bg: "#e3dfde"
  note-ink: "#1f2be0"
  note-rule: "rgba(31, 43, 224, .28)"
  cube-top: "#f0ebde"
  cube-right: "#cfcce0"
  cube-left: "#e0dce0"
  cube-apex: "#1f2be0"
  series-1: "#002e1e"
  series-2: "#183082"
  series-3: "#872015"
  series-4: "#7d3682"
  series-5: "#7e5700"
  series-6: "#007096"

typography:
  numeral: { fontFamily: "Newsreader", px: 232, weight: 300, lineHeight: 1.02, tracking: "-0.018em" }
  hero: { fontFamily: "Newsreader", px: 192, weight: 300, lineHeight: 1.02, tracking: "-0.018em" }
  closing: { fontFamily: "Newsreader", px: 152, weight: 300, lineHeight: 1.02, tracking: "-0.018em" }
  chapter: { fontFamily: "Newsreader", px: 120, weight: 300, lineHeight: 1.08, tracking: "-0.018em" }
  quote: { fontFamily: "Newsreader", px: 96, weight: 300, lineHeight: 1.45 }
  headline: { fontFamily: "Newsreader", px: 88, weight: 400, lineHeight: 1.18, tracking: "-0.018em" }
  callout: { fontFamily: "Newsreader", px: 48, weight: 300, lineHeight: 1.45 }
  row: { fontFamily: "Newsreader", px: 40, weight: 400, lineHeight: 1.18, tracking: "-0.018em" }
  lede: { fontFamily: "Hanken Grotesk", px: 32, weight: 400, lineHeight: 1.55 }
  body: { fontFamily: "Hanken Grotesk", px: 28, weight: 400, lineHeight: 1.6 }
  body-dense: { fontFamily: "Hanken Grotesk", px: 24, weight: 400, lineHeight: 1.6 }
  label: { fontFamily: "Hanken Grotesk", px: 20, weight: 400, lineHeight: 1.5, tracking: "0.055em", upper: true }
  mono: { fontFamily: "DM Mono", px: 20, weight: 400, lineHeight: 1.5, tracking: "0.055em" }
  chrome: { fontFamily: "DM Mono", px: 18, weight: 400, lineHeight: 1.5, tracking: "0.055em" }

spacing:
  edge: "80px"
  edge-inner: "160px"
  pad-top: "120px"
  pad-bottom: "120px"
  gap-lg: "56px"
  gap-md: "40px"
  gap-sm: "24px"
  gap-xs: "16px"
  rule-top: "28px"
  rule-bottom: "24px"
  chrome-bottom: "52px"

shape:
  radius: "0"

motion:
  dur: ".2s"
  ease: "cubic-bezier(.16, 1, .3, 1)"
  slide-dur: "280ms"

components:
  dot-paper:
    backgroundImage: "radial-gradient(circle, {colors.grid} 1.5px, transparent) en celdas de 40px"
    placement: "detrás de todo el fotograma, sobre {colors.ground}"
    description: "Papel de libreta de puntos: un punto en cada cruce. Nunca una cuadrícula de líneas."
  frame-rules:
    rule: "1px solid {colors.ink}, a 28px del borde de arriba y 24px del de abajo, con 80px de margen"
    description: "Las dos líneas finas que enmarcan la diapositiva."
  page-chrome:
    typography: "{typography.chrome}"
    placement: "número abajo a la derecha y pista abajo a la izquierda, por encima de la línea inferior"
  pending:
    rule: "1.4px dashed currentColor, trazos de 4"
    description: "Lo que aún no existe o está por decidir va a trazos y no se completa."
---

# Delphos · claro

## Overview

Delphos es un cuaderno técnico: papel, una sola tinta y papel de puntos. La jerarquía la dan el tamaño y el cambio de familia (Newsreader para titulares y citas, Hanken Grotesk para el cuerpo y las etiquetas, DM Mono para el dato), nunca un segundo color.

## Colors

`ground` es el fondo y `ink` la tinta: texto, titulares, reglas y diagramas. `muted` es el texto secundario y `rule`, `rule-soft` y `grid` son la misma tinta con menos cobertura. `accent` es el enlace y el foco. `proposal` es lo nuevo en una comparación. `solution`, `pending-a` y `pending-b` son solo para mapas de ramas. No se añade ningún color.

## Typography

Los tamaños son px de un escenario de 1920×1080. El cuerpo de exponer es `body` y el de leer, `body-dense`; por debajo no se baja: se parte en otro fotograma. Mono solo para dato: código, rutas, cifras, etiquetas.

## Depth & Shapes

Plano. Sin sombras, sin degradados, sin esquinas redondeadas, sin brillos. La profundidad la dan las reglas y el papel de puntos.

## Do's and Don'ts

- Sí: un elemento protagonista por fotograma; el resto quieto.
- Sí: lo pendiente a trazos, igual que en los diagramas.
- No: la cuadrícula de líneas de Cobalt Grid. El fondo es de puntos.
- No: un segundo color para destacar, iconos o logos. La marca es texto en mono.
