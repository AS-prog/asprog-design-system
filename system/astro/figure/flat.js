// La entrada de los catorce cubos sobre el propio SVG, sin motor ni Three.js: cada cubo es un
// `<g transform>` del dibujo plano y aquí se le escribe, fotograma a fotograma, la misma pose
// que el motor usa de guía (flat-model.js): sale desparramado, inclinado y al 0,85, y se
// asienta en su sitio, recto y al 1,2. Quién dibuja encima lo decide la clave del pintor de la
// landing (`y` más un bono por capa), reordenando los grupos cuando hace falta; al terminar,
// el SVG queda byte a byte como estaba, que es el dibujo de reposo.
//
// Lo que no hace: ni gira al arrastrar ni evita que dos cubos se crucen en el vuelo. Es un
// dibujo plano, y en él la superposición es solo el orden de pintado.
import { cubes, DURATION, flatPose, painterOrder } from './flat-model.js';

const FIELD = '#cube-field';
// El reloj arranca cuando sale el primer cubo, no en el cero de la coreografía: antes de
// su `delay` nadie se mueve y la figura se quedaba ahí casi un segundo y medio, quieta y
// desparramada. La escala apenas ha crecido en ese tramo, así que saltárselo no se nota.
const LEAD = Math.min(...cubes.map((cube) => cube.delay));
// La vuelta atrás va más deprisa que la llegada: deshacer la pila es un gesto, no una
// coreografía. A 3× los 10,5 s de la entrada se quedan en 3,5 s.
const BACK = 3;

const pose = (i, seconds) => {
  const { x, y, scale, tilt } = flatPose(i, seconds);
  return `translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${tilt.toFixed(3)}) scale(${scale.toFixed(4)})`;
};

/**
 * Anima el SVG en línea de la figura. Devuelve la instancia (`play`, `pause`, `resume`,
 * `replay`, `reverse`, `seek`, `state`) o `null` si el dibujo no es el esperado.
 *
 * `reverse` da la vuelta al reloj: con la pila hecha, los cubos se desordenan por el mismo
 * camino por el que llegaron; desordenados, vuelven a apilarse; a medio vuelo, se dan la
 * vuelta donde están.
 */
export function animateFlatFigure(svg, { onStateChange = () => {} } = {}) {
  const field = svg.querySelector(FIELD);
  const groups = field ? [...field.children].filter((node) => node.tagName === 'g') : [];
  if (groups.length !== cubes.length) return null;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let elapsed = LEAD, last = 0, frame = 0, paused = false, direction = 1;
  // `done`: el reloj ha llegado al extremo hacia el que va. `completed`: la pila está hecha.
  const done = () => (direction > 0 ? elapsed >= DURATION : elapsed <= LEAD);
  const state = () => ({ elapsed, paused, direction, reduced: motion.matches, completed: elapsed >= DURATION, moving: !paused && !done() });
  const sync = () => onStateChange(state());

  // Un fotograma: la pose de cada cubo y, si el orden del pintor ha cambiado, los grupos
  // se recolocan. `append` sobre un hijo existente lo mueve, no lo duplica.
  function draw(seconds) {
    const ys = cubes.map((_, i) => flatPose(i, seconds).y);
    groups.forEach((group, i) => group.setAttribute('transform', pose(i, seconds)));
    const order = groups.map((_, i) => i).sort((a, b) => painterOrder(a, ys[a]) - painterOrder(b, ys[b]));
    if (order.some((i, position) => field.children[position] !== groups[i])) {
      for (const i of order) field.append(groups[i]);
    }
  }

  function tick(now) {
    frame = 0;
    if (paused || motion.matches || document.hidden) return;
    elapsed = Math.max(LEAD, Math.min(DURATION, elapsed + (direction > 0 ? 1 : -BACK) * (now - last) / 1000));
    last = now;
    draw(elapsed);
    if (done()) { sync(); return; }
    frame = requestAnimationFrame(tick);
  }
  function play() {
    if (frame || paused || motion.matches || done()) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
  const pause = () => { paused = true; if (frame) cancelAnimationFrame(frame); frame = 0; sync(); };
  const resume = () => { paused = false; sync(); play(); };
  const replay = () => { elapsed = LEAD; direction = 1; paused = false; draw(LEAD); sync(); play(); };
  const reverse = () => {
    if (motion.matches) return;
    direction = -direction;
    paused = false; sync(); play();
  };
  // El gesto de tocar la figura: en marcha, pausa; en pausa, reanuda; quieta en un extremo
  // (la pila hecha o deshecha), da la vuelta.
  const toggle = () => {
    if (motion.matches) return;
    if (paused) resume();
    else if (!done()) pause();
    else reverse();
  };
  const seek = (seconds) => { elapsed = Math.max(0, Math.min(DURATION, seconds)); draw(elapsed); sync(); };

  // Con movimiento reducido no hay vuelo: el dibujo se queda en reposo, que es como venía.
  if (motion.matches) draw(DURATION); else draw(LEAD);
  motion.addEventListener('change', () => { if (motion.matches) { seek(DURATION); } else sync(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });
  sync();
  play();

  return { play, pause, resume, replay, reverse, toggle, seek, state };
}
