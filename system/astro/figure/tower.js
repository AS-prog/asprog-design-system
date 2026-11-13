// La torre: tres cubos que se apilan uno sobre otro, con el mismo cubo, el mismo trazo y la
// misma rampa de color por capas que la pila de catorce (la base clara, la cima en --cube-apex).
// Sale en una Nota con `::cubos[torre]` (markdown-cubes.mjs).
//
// En reposo, la torre está hecha: es el SVG tal cual, lo que se ve sin JavaScript. Deshecha,
// los tres cubos quedan en fila sobre el suelo, el de abajo en medio; al hacerse, el de la
// izquierda salta sobre él y el de la derecha, sobre los dos. El cubo de abajo no se mueve. Quién pinta encima es siempre el
// de más arriba, así que no hace falta reordenar los grupos.
//
// towerSvg() escribe el dibujo (sirve en Node, al construir); animateTower() lo mueve en el
// navegador con el reloj de timeline.js.
import { ease, mix, GROWN, RISE, U } from './flat-model.js';
import { timeline } from './timeline.js';

export const TOWER_VIEW = [400, 330];
const FLOOR = 254;                  // centro del cubo de abajo
const GAP = 132;                    // separación en la fila: más que el ancho de un cubo (115,2)
const LIFT = 40;                    // lo que sube el salto por encima de la recta
const TILT = [0, -6, 5];            // la inclinación en el aire, que se deshace al llegar
const CADENCE = [[0, 0], [0.15, 1.1], [1.15, 1.1]]; // [delay, travel] de cada cubo
export const TOWER_DURATION = 2.4;

const CX = TOWER_VIEW[0] / 2;
const cubesT = [0, 1, 2].map((i) => ({
  start: [CX + [0, -1, 1][i] * GAP, FLOOR],
  target: [CX, FLOOR - i * RISE],
  delay: CADENCE[i][0],
  travel: CADENCE[i][1],
}));

/** La pose del cubo `i` a los `seconds` de la coreografía. */
export function towerPose(i, seconds) {
  const cube = cubesT[i];
  const p = cube.travel ? ease((seconds - cube.delay) / cube.travel) : 1;
  return {
    x: mix(cube.start[0], cube.target[0], p),
    y: mix(cube.start[1], cube.target[1], p) - LIFT * Math.sin(Math.PI * p),
    tilt: TILT[i] * Math.sin(Math.PI * p),
  };
}
const transform = ({ x, y, tilt }) => `translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${tilt.toFixed(3)}) scale(${GROWN.toFixed(4)})`;

// El cubo, igual que en cubes-inline.svg: caras derecha, izquierda y de arriba, con el color de
// respaldo en `fill` y la clase que css/site.css cambia por capa.
const H = 54, R = U * 7 / 12; // 28: medio alto del rombo
const CUBE = `<path d="M0 0L${U} -${R}L${U} ${H - R}L0 ${H}Z" class="cube-face-right" fill="var(--cube-right, #CFCCE0)"></path>`
  + `<path d="M-${U} -${R}L0 0L0 ${H}L-${U} ${H - R}Z" class="cube-face-left" fill="var(--cube-left, #E0DCE0)"></path>`
  + `<path d="M0 -${2 * R}L${U} -${R}L0 0L-${U} -${R}Z" class="cube-face-top" fill="var(--cube-top, #F0EBDE)"></path>`;

/** El SVG de la torre en el instante `seconds` (por defecto, hecha), con su nombre accesible. */
export function towerSvg(label, seconds = TOWER_DURATION) {
  const groups = [0, 1, 2].map((i) => `<g data-layer="${i}" transform="${transform(towerPose(i, seconds))}">${CUBE}</g>`).join('');
  return `<svg class="cubos" viewBox="0 0 ${TOWER_VIEW[0]} ${TOWER_VIEW[1]}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">`
    + `<g data-cube-field stroke="currentColor" stroke-width="2" stroke-linejoin="round">${groups}</g></svg>`;
}

/** Anima la torre en línea. Devuelve la instancia del reloj o `null` si el dibujo no es una torre. */
export function animateTower(svg, { onStateChange = () => {}, autoplay = true } = {}) {
  const groups = [...(svg.querySelector('[data-cube-field]')?.children ?? [])].filter((node) => node.tagName === 'g');
  if (groups.length !== 3) return null;
  const draw = (seconds) => groups.forEach((group, i) => group.setAttribute('transform', transform(towerPose(i, seconds))));
  return timeline({ start: 0, end: TOWER_DURATION, back: 2, draw, autoplay, onStateChange });
}
