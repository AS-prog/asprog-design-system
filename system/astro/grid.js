// Viene de src/scripts/grid.js de sitio-personal (develop, 1451235); lo carga SiteLayout.
//
// Ajusta a la retícula las reglas del contenido marcadas con `data-rule`.
//
// La retícula —40 px, 28 en móvil— la resuelve el CSS: `tokens.css` define el paso y
// `.page` (css/site.css) redondea el ancho de la página a un múltiplo suyo. Este módulo hace lo único
// que necesita medir el navegador: subir cada regla a la línea de retícula que tiene justo
// por debajo. Vive aparte porque el ticket 08 del prototipo demostró que ese cálculo tiene
// que ser reproducible para que sirva de algo, y aislarlo es lo que permite comprobarlo.
//
// Frente a `align()` del prototipo, dos pasadas: la primera mide todas las posiciones con
// los márgenes sin aplicar, la segunda escribe. Medir y escribir en el mismo bucle hacía que
// cada regla midiera el desplazamiento de las anteriores, y que una fuente a medio sustituir
// convirtiera el error de una línea en un salto de 16 px.

const RULE = '[data-rule]';

/** El paso de la retícula, leído del token para no tener dos fuentes de verdad. */
function step() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--unit');
  return parseFloat(value) || 40;
}

/** Mueve cada regla a la línea de retícula que tiene justo por debajo. */
export function fitRules() {
  const rules = [...document.querySelectorAll(RULE)];
  if (!rules.length) return;

  const unit = step();

  // Pasada 1 — medir. Sin márgenes propios, todas las posiciones de partida son las del
  // layout y ninguna depende de un ajuste ya escrito.
  for (const node of rules) node.style.marginTop = '';
  const origins = rules.map((node) => node.getBoundingClientRect().top + window.scrollY);

  // Pasada 2 — aplicar. `shift` es el desplazamiento que los ajustes anteriores provocan en
  // los siguientes; se descuenta del objetivo para que la última regla de la página también
  // caiga en la retícula y no arrastre el error acumulado.
  let shift = 0;
  rules.forEach((node, index) => {
    const target = origins[index] + shift;
    const delta = (unit - (target % unit)) % unit;
    // Ya está en la línea, o tan cerca que moverla se nota más que dejarla.
    if (delta <= 0.1 || delta >= unit - 0.1) return;
    const base = parseFloat(getComputedStyle(node).marginTop) || 0;
    node.style.marginTop = `${base + delta}px`;
    shift += delta;
  });
}

// Un solo ajuste por fotograma: varias señales en el mismo instante no encolan varias
// pasadas. Repetir el ajuste es inocuo —cada pasada parte de las posiciones sin margen—,
// pero encadenarlas dejaría al descubierto una medición hecha a medio asentar.
let pending = false;
function schedule() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    fitRules();
  });
}

// Las fuentes cambian las métricas y, con ellas, dónde cae cada regla. El tamaño reaprovecha
// otra retícula. Un `details` abierto mueve todo lo que venga detrás.
document.fonts?.ready.then(schedule);
addEventListener('resize', schedule);
document.addEventListener(
  'toggle',
  (event) => {
    if (event.target instanceof HTMLDetailsElement) schedule();
  },
  true,
);
schedule();

// La figura de la portada y el cambio de variante del prototipo reescriben el contenido sin
// recargar; que puedan pedir un ajuste sin conocer este módulo.
window.gridRules = { fit: fitRules, schedule };
