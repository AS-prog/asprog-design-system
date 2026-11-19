#!/usr/bin/env node
// Comprueba que tokens.css es el generado desde tokens.json, que todo color
// tiene valor en los tres temas, que ninguna referencia cuelga, y que los
// pares de color.pairs alcanzan su contraste mínimo.
import { readFileSync } from 'node:fs';
import { loadTokens, buildCss, colorValue, contrast, palettes, THEMES, PALETTE_THEMES } from './tokens-lib.mjs';

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

// Una paleta solo sobrescribe colores que existen, en claro y en oscuro, con id de atributo.
const ids = new Set();
for (const pal of palettes(tokens)) {
  if (!/^[a-z][a-z0-9-]*$/.test(pal.id ?? '')) errors.push(`paleta con id no válido: ${pal.id}`);
  if (ids.has(pal.id)) errors.push(`paleta repetida: ${pal.id}`);
  ids.add(pal.id);
  for (const [name, v] of Object.entries(pal.tokens ?? {})) {
    if (!tokens.color.tokens.some((t) => t.name === name)) errors.push(`paleta ${pal.id}: color.${name} no existe en la base`);
    for (const k of Object.keys(v)) if (!PALETTE_THEMES.includes(k)) errors.push(`paleta ${pal.id}: color.${name} trae el tema ${k}; una paleta solo cambia ${PALETTE_THEMES.join(' y ')}`);
  }
  for (const t of tokens.color.tokens) {
    for (const theme of PALETTE_THEMES) {
      try { colorValue(tokens, t.name, theme, new Set(), pal); } catch (e) { errors.push(`paleta ${pal.id}: ${e.message}`); }
    }
  }
}

// Los pares de contraste, en la base y en cada paleta.
const rows = [];
const variants = [
  ...THEMES.map((theme) => ({ theme, palette: null })),
  ...palettes(tokens).flatMap((palette) => PALETTE_THEMES.map((theme) => ({ theme, palette }))),
];
for (const p of tokens.color.pairs) {
  for (const { theme, palette } of variants) {
    const label = palette ? `${palette.id} ${theme}` : theme;
    const fg = colorValue(tokens, p.fg, theme, new Set(), palette), bg = colorValue(tokens, p.bg, theme, new Set(), palette);
    const ratio = contrast(fg, bg);
    rows.push({ par: `${p.fg} / ${p.bg}`, tema: label, contraste: +ratio.toFixed(2), minimo: p.min });
    if (ratio < p.min) errors.push(`${p.fg} sobre ${p.bg} en ${label}: ${ratio.toFixed(2)}:1 < ${p.min}:1`);
  }
}
console.table(rows);

if (errors.length) { console.error('\n' + errors.map((e) => '✗ ' + e).join('\n')); process.exit(1); }
console.log('✓ tokens.json y tokens.css coinciden; contrastes correctos');
