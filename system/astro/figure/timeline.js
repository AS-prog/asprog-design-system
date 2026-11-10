// El reloj de las figuras planas (flat.js, la pila; tower.js, la torre): avanza de `start` a
// `end` con requestAnimationFrame y llama a `draw(segundos)` en cada fotograma. Se pausa, se
// reanuda, se da la vuelta y respeta `prefers-reduced-motion` y la pestaña oculta. La figura
// solo sabe dibujarse en un instante; todo lo demás es de aquí.
//
// `back` es cuánto más deprisa va la vuelta atrás: deshacer es un gesto, no una coreografía.
// Con `autoplay: false` el reloj empieza en `end` sin dibujar nada, porque el SVG ya viene con
// el dibujo de reposo, y no se mueve hasta que alguien lo toca.
export function timeline({ start = 0, end, back = 3, draw, autoplay = true, onStateChange = () => {} }) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let elapsed = start, last = 0, frame = 0, paused = false, direction = 1;
  // `done`: el reloj ha llegado al extremo hacia el que va. `completed`: la figura está hecha.
  const done = () => (direction > 0 ? elapsed >= end : elapsed <= start);
  const state = () => ({ elapsed, paused, direction, reduced: motion.matches, completed: elapsed >= end, moving: !paused && !done() });
  const sync = () => onStateChange(state());

  function tick(now) {
    frame = 0;
    if (paused || motion.matches || document.hidden) return;
    elapsed = Math.max(start, Math.min(end, elapsed + (direction > 0 ? 1 : -back) * (now - last) / 1000));
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
  const replay = () => { elapsed = start; direction = 1; paused = false; draw(start); sync(); play(); };
  const reverse = () => {
    if (motion.matches) return;
    direction = -direction;
    paused = false; sync(); play();
  };
  // El gesto de tocar la figura: en marcha, pausa; en pausa, reanuda; quieta en un extremo
  // (hecha o deshecha), da la vuelta.
  const toggle = () => {
    if (motion.matches) return;
    if (paused) resume();
    else if (!done()) pause();
    else reverse();
  };
  const seek = (seconds) => { elapsed = Math.max(0, Math.min(end, seconds)); draw(elapsed); sync(); };

  // Con movimiento reducido no hay vuelo: el dibujo se queda en reposo, que es como venía.
  if (!autoplay) elapsed = end;
  else if (motion.matches) draw(end); else draw(start);
  motion.addEventListener('change', () => { if (motion.matches) { seek(end); } else sync(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });
  sync();
  play();

  return { play, pause, resume, replay, reverse, toggle, seek, state };
}
