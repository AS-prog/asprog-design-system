#!/usr/bin/env node
// Busca valores escritos a mano en las hojas de componentes: toda longitud en
// rem/px/ch y toda duración deben salir de un token (em queda fuera: son ajustes ópticos). Se admiten 0, 1px y 2px
// (grosores de regla, que son los tokens border) y los textos en px dentro de SVG (.d-*).
import { readFileSync } from 'node:fs';
const files = process.argv.slice(2);
if (!files.length) { console.error('uso: node scripts/check-css.mjs <hoja.css> …'); process.exit(2); }
const allowed = new Set(['0', '1px', '2px', '100%', '1', '.001ms']);
let bad = 0;
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const code = line.replace(/\/\*.*?\*\//g, '');
    if (/^\s*\.d-(t|tm|sm)\b/.test(code)) return; // textos de SVG, excepción documentada
    if (/^\s*@media/.test(code)) return; // var() no entra en @media: el breakpoint se documenta junto al token
    for (const m of code.matchAll(/(?<![\w.-])(-?\d*\.?\d+)(rem|px|ch|s|ms)\b/g)) {
      const v = m[1] + m[2];
      if (allowed.has(v)) continue;
      if (/translateY\(-1px\)/.test(code) && v === '-1px') continue;
      console.log(`${f}:${i + 1}: valor a mano ${v} → ${code.trim()}`); bad++;
    }
  });
}
if (bad) { console.error(`✗ ${bad} valor(es) a mano`); process.exit(1); }
console.log('✓ sin valores a mano');
