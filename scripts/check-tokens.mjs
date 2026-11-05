#!/usr/bin/env node
// Comprueba que tokens.css es el generado desde tokens.json, que todo color
// tiene valor en los tres temas, que ninguna referencia cuelga, y que los
// pares de color.pairs alcanzan su contraste mínimo.
import { readFileSync } from 'node:fs';
import { loadTokens, buildCss, colorValue, contrast, THEMES } from './tokens-lib.mjs';

const tokens = loadTokens();
const errors = [];

const css = readFileSync(new URL('../system/tokens.css', import.meta.url), 'utf8');
if (css !== buildCss(tokens)) errors.push('tokens.css no coincide con tokens.json: ejecuta `npm run build`');

for (const t of tokens.color.tokens) {
  for (const theme of THEMES) {
    try { if (colorValue(tokens, t.name, theme) == null) errors.push(`color.${t.name} no tiene valor en el tema ${theme}`); }
    catch (e) { errors.push(e.message); }
  }
}

const rows = [];
for (const p of tokens.color.pairs) {
  for (const theme of THEMES) {
    const fg = colorValue(tokens, p.fg, theme), bg = colorValue(tokens, p.bg, theme);
    const ratio = contrast(fg, bg);
    rows.push({ par: `${p.fg} / ${p.bg}`, tema: theme, contraste: +ratio.toFixed(2), minimo: p.min });
    if (ratio < p.min) errors.push(`${p.fg} sobre ${p.bg} en ${theme}: ${ratio.toFixed(2)}:1 < ${p.min}:1`);
  }
}
console.table(rows);

if (errors.length) { console.error('\n' + errors.map((e) => '✗ ' + e).join('\n')); process.exit(1); }
console.log('✓ tokens.json y tokens.css coinciden; contrastes correctos');
