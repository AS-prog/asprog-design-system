// Monta la figura plana (el SVG de los cubos, sin Three.js) sobre su contenedor .cube-figure:
// la animación de flat.js y el gesto de tocarla. Lo usan CubeFigure.astro, con `engine={false}`,
// y las figuras que el plugin markdown-cubes.mjs deja dentro de una Nota, que no pasan por el
// componente y se montan con mountFlatFigures().
//
// Sirve para la pila de catorce (flat.js) y para la torre de tres (tower.js, `data-figure="tower"`).
//
// El gesto: tocar la figura (o Intro y Espacio) mientras los cubos se mueven la pausa y otro
// toque la reanuda, así la entrada, que dura más de cinco segundos, se puede parar sin botones
// (WCAG 2.2.2). Quieta en un extremo, el toque le da la vuelta: la pila se deshace por el mismo
// camino y, al tocarla otra vez, se rehace. Con movimiento reducido no hay gesto ni vuelo.
import { animateFlatFigure } from './flat.js';
import { animateTower } from './tower.js';

/**
 * Anima la figura de `container` y le pone el gesto. Devuelve la instancia de flat.js, o
 * `null` si ya estaba montada o el dibujo no es el esperado. `onStateChange` recibe cada
 * cambio de estado, para quien añada botones.
 */
export function mountFlatFigure(container, { autoplay = true, onStateChange = () => {} } = {}) {
  if ('mounted' in container.dataset) return null;
  const svg = container.querySelector('svg');
  if (!svg) return null;
  // El nombre accesible de la figura dice qué hará el siguiente toque.
  const gesture = (state) => {
    if (state.reduced) return;
    const what = container.dataset.figure === 'tower' ? 'la torre' : 'la pila';
    container.setAttribute('aria-label', state.paused ? 'Reanudar la animación de los cubos'
      : state.moving ? 'Pausar la animación de los cubos'
      : state.completed ? `Deshacer ${what} de cubos` : `Rehacer ${what} de cubos`);
  };
  // `data-figure="tower"` es la torre de tres cubos (tower.js); sin él, la pila de catorce.
  const animate = container.dataset.figure === 'tower' ? animateTower : animateFlatFigure;
  const flat = animate(svg, {
    autoplay,
    onStateChange: (state) => { gesture(state); onStateChange(state); },
  });
  if (!flat) return null;
  container.dataset.mounted = '';
  if (!flat.state().reduced) {
    container.tabIndex = 0;
    container.setAttribute('role', 'button');
    gesture(flat.state());
    container.addEventListener('click', () => flat.toggle());
    container.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      flat.toggle();
    });
  }
  return flat;
}

/**
 * Monta, cuando se acercan a la vista, las figuras planas animables de `root` que nadie ha
 * montado: `.cube-figure[data-engine="off"][data-animate]`. `data-autoplay="off"` las deja en
 * el fotograma fijo hasta que alguien las toca.
 */
export function mountFlatFigures(root = document) {
  const mount = (container) => mountFlatFigure(container, { autoplay: container.dataset.autoplay !== 'off' });
  root.querySelectorAll('.cube-figure[data-engine="off"][data-animate]:not([data-mounted])').forEach((container) => {
    if (!('IntersectionObserver' in window)) return mount(container);
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      mount(container);
    }, { rootMargin: '100px' });
    observer.observe(container);
  });
}
