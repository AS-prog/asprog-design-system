// Plugin HAST para Sätteri, el procesador de Markdown de Astro 7: pone la figura de los cubos
// dentro de una Nota sin pasarla a MDX. Un párrafo que empieza por el marcador se convierte en
// la figura plana (el SVG en línea, sin Three.js); lo que sigue al marcador, si hay algo, es el
// pie de la figura.
//
//   ::cubos                     la pila hecha, como adorno
//   ::cubos Un pie.             lo mismo, con pie
//   ::cubos[antes-ahora] Un pie.
//                               dos fotogramas: «Antes», los catorce cubos sueltos y torcidos,
//                               tal como empieza la animación; «Ahora», la pila hecha
//
// Todo sale como fotograma fijo, que es también lo que se ve sin JavaScript, con
// `prefers-reduced-motion` o al imprimir. La pila se puede tocar (o Intro y Espacio): se deshace
// por el camino de la portada y otro toque la rehace; en marcha, el toque la pausa. Lo monta el
// <script> de Prose.astro con figure/flat-mount.js, y lo estila css/site.css (`.cube-note`).
//
// Uso en astro.config, junto a markdown-notice.mjs:
//   import { satteri } from '@astrojs/markdown-satteri';
//   markdown: { processor: satteri({ hastPlugins: [markdownNotice, markdownCubes] }) }
import { readFileSync } from 'node:fs';
import { cubes, flatPose, painterOrder } from './figure/flat-model.js';

const MARKER = /^\s*::cubos(?:\[([a-z-]+)\])?(?:[ \t]+([^\n]*))?\s*$/;
// El SVG de la figura sin sus id, para que quepan varias en una página: el grupo de los cubos
// queda marcado con `data-cube-field`, que es lo que busca flat.js.
const SVG = readFileSync(new URL('../assets/figure/cubes-inline.svg', import.meta.url), 'utf8')
  .trim()
  .replace(' id="data-cubes"', '')
  .replace(' id="cube-field"', ' data-cube-field');
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const label = (svg, text) => svg.replace(/aria-label="[^"]*"/, `aria-label="${escape(text)}"`);

// El fotograma de salida de la animación: cada cubo en su sitio de partida, torcido y pequeño,
// con el orden de pintado de ese instante. Es la misma pose que flat.js dibuja al empezar.
function scatteredSvg() {
  const start = Math.min(...cubes.map((cube) => cube.delay));
  const groups = [...SVG.matchAll(/<g data-layer="\d+" transform="[^"]*">.*?<\/g>/g)].map((m) => m[0]);
  if (groups.length !== cubes.length) throw new Error('markdown-cubes: el SVG no tiene los catorce cubos');
  const poses = cubes.map((_, i) => flatPose(i, start));
  const posed = groups.map((group, i) => {
    const { x, y, scale, tilt } = poses[i];
    const transform = `translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${tilt.toFixed(3)}) scale(${scale.toFixed(4)})`;
    return group.replace(/transform="[^"]*"/, `transform="${transform}"`);
  });
  const order = posed.map((_, i) => i).sort((a, b) => painterOrder(a, poses[a].y) - painterOrder(b, poses[b].y));
  const field = SVG.indexOf(groups[0]);
  const end = SVG.lastIndexOf(groups[groups.length - 1]) + groups[groups.length - 1].length;
  return SVG.slice(0, field) + order.map((i) => posed[i]).join('') + SVG.slice(end);
}
const SCATTERED = scatteredSvg();

const pile = (text = 'Catorce cubos apilados en tres capas: 3 por 3, 2 por 2 y 1 por 1') =>
  `<div class="cube-figure" data-engine="off" data-animate data-autoplay="off">${label(SVG, text)}</div>`;

const VARIANTS = {
  // La pila hecha, como adorno.
  '': () => pile(),
  // Dos fotogramas, uno junto al otro: los cubos sueltos y la pila. Solo la pila se mueve.
  'antes-ahora': () => '<div class="cube-note-frames">'
    + `<div class="cube-note-frame"><div class="cube-figure" data-engine="off">${label(SCATTERED, 'Antes: catorce cubos sueltos, cada uno torcido y por su lado')}</div><p class="cube-note-label">Antes</p></div>`
    + `<div class="cube-note-frame">${pile('Ahora: los mismos catorce cubos apilados en tres capas')}<p class="cube-note-label">Ahora</p></div>`
    + '</div>',
};

/** El marcado de la figura: `variant` es '' (la pila) o 'antes-ahora'; `caption`, el pie. */
export function cubeNote(caption = '', variant = '') {
  const body = VARIANTS[variant];
  if (!body) throw new Error(`markdown-cubes: no hay variante «${variant}» (hay: ${Object.keys(VARIANTS).filter(Boolean).join(', ')})`);
  const figcaption = caption.trim() ? `<figcaption>${escape(caption.trim())}</figcaption>` : '';
  const modifier = variant ? ` cube-note-${variant}` : '';
  return `<figure class="cube-note${modifier}">${body()}${figcaption}</figure>`;
}

function toCubeNote(node) {
  // Solo un párrafo que sea únicamente texto: `::cubos` a media frase no es el marcador.
  if (node.children?.length !== 1) return;
  const [text] = node.children;
  if (text.type !== 'text') return;
  const m = text.value.match(MARKER);
  if (!m) return;
  return { type: 'raw', value: cubeNote(m[2] ?? '', m[1] ?? '') };
}

export default {
  name: 'asprog-cubes',
  element: { filter: ['p'], visit: (node) => toCubeNote(node) },
};
