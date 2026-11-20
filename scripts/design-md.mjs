// DESIGN.md desde tokens.json: el sistema en el formato design.md (frontmatter YAML + prosa),
// el que leen HyperFrames y otras herramientas que generan imagen o vídeo a partir de HTML.
// Un fichero por paleta y tema: delphos-light, delphos-dark, merkle-light… Sin dependencias.
import { colorValue, palettes, PALETTE_THEMES } from './tokens-lib.mjs';

// Qué estilo del sistema (type.groups) da peso, interlineado y tracking a cada tamaño de la diapositiva.
// El tamaño sale de la familia slide (px del escenario de 1920×1080); el resto, del estilo.
const SLIDE_TYPE = [
  ['numeral', 'slide-t-numeral', 'h1-portada'],
  ['hero', 'slide-t-hero', 'h1-portada'],
  ['closing', 'slide-t-closing', 'h1-portada'],
  ['chapter', 'slide-t-chapter', 'h1-titulo'],
  ['quote', 'slide-t-quote', 'cita'],
  ['headline', 'slide-t-headline', 'h2-seccion'],
  ['callout', 'slide-t-callout', 'cita'],
  ['row', 'slide-t-row', 'h2'],
  ['lede', 'slide-t-lede', 'lede'],
  ['body', 'slide-t-body', 'cuerpo'],
  ['body-dense', 'slide-t-body-dense', 'cuerpo'],
  ['label', 'slide-t-label', 'antetitulo', { family: 'body', upper: true }],
  ['mono', 'slide-t-mono', 'antetitulo'],
  ['chrome', 'slide-t-chrome', 'antetitulo'],
];

const SPACING = ['slide-edge', 'slide-edge-inner', 'slide-pad-top', 'slide-pad-bottom', 'slide-gap-lg', 'slide-gap-md', 'slide-gap-sm', 'slide-gap-xs', 'slide-rule-top', 'slide-rule-bottom', 'slide-chrome-bottom'];

const q = (s) => JSON.stringify(String(s));
const firstFamily = (stack) => stack.split(',')[0].trim().replace(/^"|"$/g, '');

function scalar(tokens, name) {
  for (const fam of ['slide', 'motion', 'border', 'radius', 'letterSpacing']) {
    const t = tokens[fam].tokens.find((x) => x.name === name);
    if (t) return t.value;
  }
  throw new Error(`token ${name} no existe`);
}

function style(tokens, name) {
  for (const g of tokens.type.groups) {
    const s = g.styles.find((x) => x.name === name);
    if (s) return { ...s, family: g.family };
  }
  throw new Error(`estilo ${name} no existe en type.groups`);
}

/** Los ficheros que se generan: [{ id, file, theme, palette }]. */
export function designTargets(tokens) {
  const out = [];
  for (const p of [null, ...palettes(tokens)]) {
    for (const theme of PALETTE_THEMES) {
      const id = p ? p.id : 'delphos';
      out.push({ id, theme, palette: p, file: `${id}-${theme}.md` });
    }
  }
  return out;
}

export function buildDesignMd(tokens, theme, palette = null) {
  const name = `Delphos${palette ? ` · ${palette.name}` : ''} · ${theme === 'light' ? 'claro' : 'oscuro'}`;
  const color = (n) => colorValue(tokens, n, theme, new Set(), palette);
  const L = [];
  L.push('---', 'version: alpha', `name: ${q(name)}`);
  L.push(`description: ${q(`Generado desde tokens.json (v${tokens.version}) de asprog-design-system con npm run build. No se edita a mano. Papel, una sola tinta, papel de puntos, Newsreader, Hanken Grotesk y DM Mono, radio 0.`)}`);
  L.push('unit: "la diapositiva o el fotograma de 1920×1080; las medidas son px de ese escenario"');
  L.push(`theme: ${theme}`);
  if (palette) L.push(`palette: ${palette.id}`, `source: ${q(palette.source ?? '')}`);
  L.push('', 'colors:');
  for (const t of tokens.color.tokens) {
    const v = color(t.name);
    if (v != null) L.push(`  ${t.name}: ${q(v)}`);
  }
  L.push('', 'typography:');
  for (const [key, size, styleName, opt = {}] of SLIDE_TYPE) {
    const s = style(tokens, styleName);
    const family = firstFamily(tokens.type.families[opt.family ?? s.family]);
    const parts = [`fontFamily: ${q(family)}`, `px: ${parseFloat(scalar(tokens, size))}`, `weight: ${s.fontWeight}`, `lineHeight: ${s.lineHeight}`];
    if (s.letterSpacing) parts.push(`tracking: ${q(s.letterSpacing)}`);
    if (opt.upper) parts.push('upper: true');
    L.push(`  ${key}: { ${parts.join(', ')} }`);
  }
  L.push('', 'spacing:');
  for (const n of SPACING) L.push(`  ${n.replace(/^slide-/, '')}: ${q(scalar(tokens, n))}`);
  L.push('', 'shape:', `  radius: ${q(scalar(tokens, 'r-1'))}`);
  L.push('', 'motion:', `  dur: ${q(scalar(tokens, 'dur'))}`, `  ease: ${q(scalar(tokens, 'ease'))}`, `  slide-dur: ${q(scalar(tokens, 'slide-dur'))}`);
  L.push('', 'components:');
  L.push('  dot-paper:');
  L.push(`    backgroundImage: ${q(`radial-gradient(circle, {colors.grid} ${scalar(tokens, 'slide-dot')}, transparent) en celdas de ${scalar(tokens, 'slide-unit')}`)}`);
  L.push('    placement: "detrás de todo el fotograma, sobre {colors.ground}"');
  L.push('    description: "Papel de libreta de puntos: un punto en cada cruce. Nunca una cuadrícula de líneas."');
  L.push('  frame-rules:');
  L.push(`    rule: ${q(`${scalar(tokens, 'line-minor').replace('{color.', '{colors.')}, a ${scalar(tokens, 'slide-rule-top')} del borde de arriba y ${scalar(tokens, 'slide-rule-bottom')} del de abajo, con ${scalar(tokens, 'slide-edge')} de margen`)}`);
  L.push('    description: "Las dos líneas finas que enmarcan la diapositiva."');
  L.push('  page-chrome:');
  L.push('    typography: "{typography.chrome}"');
  L.push('    placement: "número abajo a la derecha y pista abajo a la izquierda, por encima de la línea inferior"');
  L.push('  pending:');
  L.push(`    rule: ${q(`${scalar(tokens, 'diagram-stroke')}px dashed currentColor, trazos de 4`)}`);
  L.push('    description: "Lo que aún no existe o está por decidir va a trazos y no se completa."');
  L.push('---', '');

  L.push(`# ${name}`, '');
  L.push('## Overview', '');
  L.push('Delphos es un cuaderno técnico: papel, una sola tinta y papel de puntos. La jerarquía la dan el tamaño y el cambio de familia (Newsreader para titulares y citas, Hanken Grotesk para el cuerpo y las etiquetas, DM Mono para el dato), nunca un segundo color.', '');
  L.push('## Colors', '');
  L.push('`ground` es el fondo y `ink` la tinta: texto, titulares, reglas y diagramas. `muted` es el texto secundario y `rule`, `rule-soft` y `grid` son la misma tinta con menos cobertura. `accent` es el enlace y el foco. `proposal` es lo nuevo en una comparación. `solution`, `pending-a` y `pending-b` son solo para mapas de ramas. No se añade ningún color.', '');
  L.push('## Typography', '');
  L.push('Los tamaños son px de un escenario de 1920×1080. El cuerpo de exponer es `body` y el de leer, `body-dense`; por debajo no se baja: se parte en otro fotograma. Mono solo para dato: código, rutas, cifras, etiquetas.', '');
  L.push('## Depth & Shapes', '');
  L.push('Plano. Sin sombras, sin degradados, sin esquinas redondeadas, sin brillos. La profundidad la dan las reglas y el papel de puntos.', '');
  L.push('## Do\'s and Don\'ts', '');
  L.push('- Sí: un elemento protagonista por fotograma; el resto quieto.');
  L.push('- Sí: lo pendiente a trazos, igual que en los diagramas.');
  L.push('- No: la cuadrícula de líneas de Cobalt Grid. El fondo es de puntos.');
  L.push('- No: un segundo color para destacar, iconos o logos. La marca es texto en mono.');
  L.push('');
  return L.join('\n');
}
