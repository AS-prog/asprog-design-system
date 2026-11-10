// Plugin HAST para Sätteri, el procesador de Markdown de Astro 7: pone la figura de los cubos
// dentro de una Nota sin pasarla a MDX. Un párrafo que empieza por `::cubos` se convierte en
// la figura plana (el SVG en línea, sin Three.js); lo que sigue al marcador, si hay algo, es el
// pie de la figura.
//
//   ::cubos
//   ::cubos Catorce piezas sueltas acaban en una sola pila.
//
// Sale un fotograma fijo, la pila hecha, que es también lo que se ve sin JavaScript, con
// `prefers-reduced-motion` o al imprimir. Tocarlo (o Intro y Espacio) deshace la pila y otro
// toque la rehace; en marcha, el toque la pausa. Lo monta el <script> de Prose.astro con
// figure/flat-mount.js, y lo estila css/site.css (`.cube-note`, `.cube-figure`).
//
// Una figura por Nota: el SVG lleva los id `data-cubes` y `cube-field`, y dos copias en la
// misma página los repetirían.
//
// Uso en astro.config, junto a markdown-notice.mjs:
//   import { satteri } from '@astrojs/markdown-satteri';
//   markdown: { processor: satteri({ hastPlugins: [markdownNotice, markdownCubes] }) }
import { readFileSync } from 'node:fs';

const MARKER = /^\s*::cubos(?:[ \t]+([^\n]*))?\s*$/;
const svg = readFileSync(new URL('../assets/figure/cubes-inline.svg', import.meta.url), 'utf8').trim();
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** El marcado de la figura, con su pie si lo lleva. */
export function cubeNote(caption = '') {
  const figcaption = caption.trim() ? `<figcaption>${escape(caption.trim())}</figcaption>` : '';
  return `<figure class="cube-note"><div class="cube-figure" data-engine="off" data-animate data-autoplay="off">${svg}</div>${figcaption}</figure>`;
}

function toCubeNote(node) {
  // Solo un párrafo que sea únicamente texto: `::cubos` a media frase no es el marcador.
  if (node.children?.length !== 1) return;
  const [text] = node.children;
  if (text.type !== 'text') return;
  const m = text.value.match(MARKER);
  if (!m) return;
  return { type: 'raw', value: cubeNote(m[1] ?? '') };
}

export default {
  name: 'asprog-cubes',
  element: { filter: ['p'], visit: (node) => toCubeNote(node) },
};
