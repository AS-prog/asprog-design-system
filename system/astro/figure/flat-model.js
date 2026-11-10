// El dibujo plano de la figura de los catorce cubos: las constantes copiadas de la landing
// y la pose de cada cubo en el viewBox a lo largo del tiempo. No sabe nada de Three.js: lo
// usan el modelo 3D (model.js), que le añade la profundidad, y la animación del SVG
// (flat.js), que solo necesita la pantalla. Una sola definición: mover un valor aquí mueve
// las dos figuras.

// Un cubo y una retícula, y todo lo demás derivado. Unidades del viewBox de la landing.
export const U = 48;                    // semiancho proyectado de un cubo
export const PITCH = U * 1.4;           // 67,2 · paso entre columnas: solape deliberado
export const ROW = U * 0.825;           // 39,6 · paso entre filas del rombo
export const RISE = U * 1.35;           // 64,8 · subida nominal de una capa
export const CENTRE = [250, 261.2];     // centro del montón dentro del viewBox
export const VIEW = [502, 664];         // viewBox de la figura
export const BASE = 2;                  // el suelo del cubo sube para que su trazo no engorde la planta
export const STROKE = 2;                // grosor del trazo de la landing

// La proyección de la landing no es el isométrico exacto. Su rombo mide 48 de ancho por 28
// de alto, y en un isométrico de verdad esa razón sería √3 = 1,732 y no 1,714: el factor
// horizontal que gasta es 6/7 = 0,8571, no cos30 = 0,8660. De ahí sale también su `EDGE`
// de 7/12, que no es más que 28/48. Se copia su proyección, no la de libro.
export const PROJECTION = 6 / 7;
export const SEMI = U / (2 * PROJECTION); // 28 · semilado del cubo en X y en Z
export const SIDE = 2 * SEMI;             // 56 · lado del cubo
export const HEIGHT = SIDE - BASE;        // 54 · alto del cubo: el suelo sube BASE

export const CADENCE = [[1.3, 0.17, 5.4], [5.8, 0.2, 4.4], [8.2, 0, 3.4]];
export const TILT = [-7, 5, -5, 6, -4, 7, -6, 4, -3, 5, -4, 6, -5, 3];
export const BONUS = 180;               // lo que la landing suma a la clave por cada capa
export const BORN = 0.85;               // escala al empezar el recorrido
export const GROWN = 1.2;               // escala al terminarlo: la pila se asienta crecida
export const SCATTERED = [
  [80, 95], [197, 82], [316, 105], [425, 162], [94, 245], [239, 226], [387, 304],
  [77, 405], [207, 380], [330, 429], [428, 463], [98, 568], [247, 553], [399, 581],
];
export const DURATION = 11.8;

// Capas: cuadrados que encogen de uno en uno y quedan centrados sobre su huella. El centro
// vertical es `layers - 1`, así que el montón crece alrededor del mismo punto.
export const pileBase = layers => CENTRE[1] - (layers - 1) * ROW + (layers - 1) / 2 * RISE;

export function model(layers) {
  const out = [];
  for (let layer = 0; layer < layers; layer++) {
    const width = layers - layer;
    const first = out.length;
    for (let row = 0; row < width; row++) for (let col = 0; col < width; col++) {
      out.push({
        layer, col, row,
        index: out.length - first,
        x: CENTRE[0] + (col - row) * PITCH,
        y: pileBase(layers) + (col + row + layer) * ROW - layer * RISE,
      });
    }
  }
  return out;
}

export const targets = model(3);
export const cubes = SCATTERED.map((start, i) => {
  const t = targets[i];
  const [delay, step, travel] = CADENCE[Math.min(t.layer, CADENCE.length - 1)];
  return { start, target: [t.x, t.y], layer: t.layer, tilt: TILT[i], delay: delay + t.index * step, travel };
});

export const mix = (a, b, t) => a + (b - a) * t;
export const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };

// La escala la manda un solo reloj, el de la figura entera: nace desparramada al 0,85 y
// se asienta crecida al 1,2, de principio a fin. No la manda el reloj de cada cubo —su
// `delay` y su `travel` son para su camino, que es lo que sí es suyo—, porque entonces
// quien todavía no ha sido llamado se queda en 0,85 mientras los demás ya están en 1,2,
// y en el punto más abierto del vuelo la figura se leía al revés de como es. Un `ease`
// de extremo a extremo deja los dos extremos donde estaban y conserva la velocidad nula
// al empezar y al acabar.
export const scaleAt = seconds => mix(BORN, GROWN, ease(seconds / DURATION));

// La pose del cubo `i` en el dibujo plano: dónde está, cuánto ha avanzado, su escala y su
// inclinación en grados, que se deshace a medida que llega. Es lo que el SVG pinta tal cual
// con `translate rotate scale`; el modelo 3D parte de aquí y le añade la profundidad.
export function flatPose(i, seconds, still = false) {
  const cube = cubes[i];
  const p = still ? 1 : ease((seconds - cube.delay) / cube.travel);
  return {
    p,
    x: mix(cube.start[0], cube.target[0], p),
    y: mix(cube.start[1], cube.target[1], p),
    scale: scaleAt(seconds),   // un reloj para los catorce: `p` es de cada uno
    tilt: cube.tilt * (1 - p),
  };
}

// La clave del pintor de la landing: quién dibuja encima. Es la `y` en pantalla más un
// bono por capa; al asentarse, deja a la pila en el orden del SVG.
export const painterOrder = (i, y) => y + BONUS * cubes[i].layer;
