// Cobalt Grid — lectura de tokens.json y generación de tokens.css. Sin dependencias.
import { readFileSync } from 'node:fs';

export const THEMES = ['light', 'dark', 'print'];
export const SCALAR_FAMILIES = ['typeScale', 'lineHeight', 'letterSpacing', 'spacing', 'radius', 'layout', 'motion', 'border'];

export function loadTokens(path = new URL('../system/tokens.json', import.meta.url)) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Valor de un token de color en un tema, con referencias {name} resueltas. */
export function colorValue(tokens, name, theme, seen = new Set()) {
  const t = tokens.color.tokens.find((x) => x.name === name);
  if (!t) throw new Error(`color.${name} no existe`);
  const raw = typeof t.value === 'string' ? t.value : t.value[theme];
  if (raw == null) return null;
  const m = raw.match(/^\{([\w-]+)\}$/);
  if (!m) return raw;
  if (seen.has(name)) throw new Error(`referencia circular en color.${name}`);
  seen.add(name);
  return colorValue(tokens, m[1], theme, seen);
}

/** Referencias de color como var(--x); {familia.x} se admite solo hacia color. */
function cssRef(value) {
  return value.replace(/\{(?:color\.)?([\w-]+)\}/g, (_, n) => `var(--${n})`);
}

export function buildCss(tokens) {
  const L = [];
  L.push(`/* Cobalt Grid — generado desde tokens.json (v${tokens.version}) con scripts/build-tokens.mjs. No se edita a mano. */`, '');
  for (const f of tokens.type.fonts) {
    L.push(`@font-face { font-family: "${f.family}"; font-style: ${f.style}; font-weight: ${f.weight}; font-display: swap; src: url("${f.file}") format("woff2");${f.unicodeRange ? ` unicode-range: ${f.unicodeRange};` : ''} }`, '');
  }
  const themeSel = { light: ':root, [data-theme="light"]', dark: '[data-theme="dark"]', print: '[data-theme="print"]' };
  const block = (theme, indent = '') => {
    const out = [];
    if (theme !== 'print') out.push(`${indent}  color-scheme: ${theme};`);
    for (const t of tokens.color.tokens) {
      const raw = typeof t.value === 'string' ? t.value : t.value[theme];
      if (raw == null) continue;
      // Un valor repetido en oscuro/impresión se emite igualmente: cada tema es completo por sí mismo.
      out.push(`${indent}  --${t.name}: ${cssRef(raw)};`);
    }
    return out;
  };
  for (const theme of THEMES) L.push(`${themeSel[theme]} {`, ...block(theme), '}', '');
  L.push('/* data-theme="auto": sigue a prefers-color-scheme; el conmutador lo sobrescribe escribiendo light o dark. */');
  L.push('@media (prefers-color-scheme: dark) {', '  [data-theme="auto"] {', ...block('dark', '  '), '  }', '}', '');
  L.push('/* Al imprimir manda el tema print, se elija lo que se elija en pantalla. */');
  L.push('@media print {', '  :root, [data-theme] {', ...block('print', '  '), '  }', '}', '');
  L.push(':root {');
  for (const fam of SCALAR_FAMILIES) {
    for (const t of tokens[fam].tokens) L.push(`  --${t.name}: ${cssRef(t.value)};`);
  }
  for (const [k, v] of Object.entries(tokens.type.families)) L.push(`  --font-${k}: ${v};`);
  L.push('}', '');
  const bp = tokens.layout.tokens.find((t) => t.name === 'bp-mobile');
  const um = tokens.layout.tokens.find((t) => t.name === 'unit-mobile');
  if (bp && um) L.push(`@media (max-width: ${bp.value}) { :root { --unit: ${um.value}; } }`, '');
  return L.join('\n');
}

// ---- contraste WCAG 2.x ----
function parseColor(s) {
  s = s.trim();
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1]; if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : +m[4] };
  throw new Error(`color no reconocido: ${s}`);
}
export function composite(fg, bg) {
  const a = fg.a; return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}
function lum({ r, g, b }) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function contrast(fgStr, bgStr) {
  const bg = parseColor(bgStr); const fg = composite(parseColor(fgStr), bg);
  const a = lum(fg), b = lum(bg); const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}
