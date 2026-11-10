// Copia de src/lib/figure/model.js (sitio-personal, develop, 1451235) con dos cambios:
// Three.js se importa como paquete (`three`, 0.181.2) en vez de desde ./vendor/, y las
// constantes del dibujo plano viven en flat-model.js, compartidas con la animación del SVG.
// Modelo compartido por el render y el precálculo: una sola definición de la geometría.
import * as THREE from 'three';
import * as flat from './flat-model.js';

export function createFigureModel() {
  // ── El modelo, copiado de la landing ───────────────────────────────────────
  // Las constantes y la pose plana viven en flat-model.js, compartidas con la animación del
  // SVG: aquí solo se les añade la profundidad.
  const {
    PITCH, ROW, RISE, VIEW, BASE, STROKE, PROJECTION, SEMI, SIDE, HEIGHT, BONUS, BORN, GROWN,
    DURATION, pileBase, model, targets, cubes, mix, ease, scaleAt, flatPose,
  } = flat;

  // ── De la pantalla al mundo ────────────────────────────────────────────────
  // La pantalla no conoce la profundidad: todos los puntos de una recta paralela al eje de
  // vista caen en el mismo píxel, así que la profundidad es una decisión y no un dato. La
  // figura trae consigo una sola medida de profundidad —la clave con la que la landing
  // decide qué cubo dibuja encima, `y + BONUS` por capa— y se usa tal cual, multiplicada
  // por el mínimo que sostiene la figura sin que los sólidos se corten.
  const RISE_GAIN = RISE - ROW;            // 25,20 · lo que la composición ya sube por capa
  const TOP = GROWN * SIDE;                // 67,20 · lado del cubo cuando la pila reposa
  const DEPTH_SCALE = 3 * TOP / (2 * ROW) - 1;   // 1,5455 · el mínimo que no corta diagonales

  // La clave del pintor, sin la parte constante: `(col+row)·ROW` es el avance por fila y
  // `layer·(ROW − RISE + BONUS)` el salto por capa.
  const painterKey = t => (t.col + t.row) * ROW + t.layer * (ROW - RISE + BONUS);

  // La proyección de la landing: x = (X−Z)·6/7, y = (X+Z)/2 − Y.
  const screenX = p => (p.x - p.z) * PROJECTION;
  const screenY = p => (p.x + p.z) * 0.5 - p.y;

  // Todos los puntos que proyectan a (sx, sy) forman una recta paralela a (1,1,1). Se elige
  // uno con `depth`, que es la coordenada a lo largo del eje de vista: mayor = más cerca de
  // la cámara. Moverla no cambia la proyección, solo de qué lado queda el cubo.
  const VIEW_AXIS = new THREE.Vector3(1, 1, 1).normalize();

  function fromScreen(sx, sy, depth) {
    const half = sx / (2 * PROJECTION);
    const m = (depth + sy) / 3;          // despejado de X+Y+Z = 3m − sy
    return new THREE.Vector3(half + m, m - sy, -half + m);
  }

  // Destino y origen, cada uno con su profundidad. En el origen la clave del pintor es la
  // `y` a secas —el bono por capa todavía no ha entrado—, así que basta con escalarla.
  const targetDepth = targets.map(t => DEPTH_SCALE * (pileBase(3) + painterKey(t)));
  const startDepth = cubes.map(cube => DEPTH_SCALE * cube.start[1]);

  const destinations = cubes.map((cube, i) =>
    fromScreen(cube.target[0], cube.target[1], targetDepth[i]));

  const half = SEMI;
  const centreY = BASE / 2;

  // Pose guía, antes de evitar contactos. La profundidad sigue aquí la clave del pintor;
  // el recorrido definitivo puede cambiar ese orden para rodear a otro sólido.
  function desiredPose(i, seconds, still = false) {
    const { p, x, y, scale, tilt } = flatPose(i, seconds, still);
    return {
      p,
      scale,
      spin: -tilt * Math.PI / 180,   // signo: el SVG gira al revés
      pos: fromScreen(x, y, mix(startDepth[i], targetDepth[i], p)),
    };
  }

  function boxOf(p) {
    const q = new THREE.Quaternion().setFromAxisAngle(VIEW_AXIS, p.spin);
    const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
      .map(a => new THREE.Vector3(...a).applyQuaternion(q));
    return {
      pos: p.pos.clone().addScaledVector(axes[1], p.scale * centreY),
      axes,
      h: [p.scale * half, p.scale * HEIGHT / 2, p.scale * half],
    };
  }

  return {
    VIEW, BASE, STROKE, PROJECTION, SEMI, SIDE, HEIGHT, DURATION, ROW, BORN, GROWN,
    BONUS, RISE_GAIN, TOP, DEPTH_SCALE, VIEW_AXIS, model, targets, cubes,
    screenX, screenY, fromScreen, targetDepth, startDepth, destinations, ease, mix, desiredPose, boxOf,
  };
}
