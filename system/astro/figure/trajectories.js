// Copia de src/lib/figure/trajectories.js (sitio-personal, develop, 1451235) con un solo cambio:
// Three.js se importa como paquete (`three`, 0.181.2) en vez de desde ./vendor/.
// Las trayectorias del vuelo: sobre una pose guía por cubo, calcula arcos de
// separación suaves para que ningún sólido atraviese a otro durante la
// transición. Es un portado de `figura-cubos-3d/trayectorias.js`; los
// identificadores van en inglés y los comentarios en español (regla del repo).
import * as THREE from 'three';
import { createPath, envelope } from './path.js';

const FREQUENCY = 120;
const CLEARANCE = 2;
const TOLERANCE = 1e-5;
const MAX_PASSES = 100;
const radius = (box, normal) => box.axes.reduce(
  (sum, axis, i) => sum + Math.abs(axis.dot(normal)) * box.h[i], 0);

// SAT: los seis ejes de cara y los nueve productos de aristas. Las cajas
// giradas pueden atravesarse por una arista aunque sus caras parezcan separadas.
function overlap(a, b, margin) {
  const delta = b.pos.clone().sub(a.pos);
  const axes = [...a.axes, ...b.axes];
  for (const u of a.axes) for (const v of b.axes) {
    const normal = new THREE.Vector3().crossVectors(u, v);
    if (normal.lengthSq() > 1e-12) axes.push(normal.normalize());
  }
  return axes.every(normal =>
    radius(a, normal) + radius(b, normal) + margin - Math.abs(delta.dot(normal)) > 0);
}

// Un arco suave común: cada cubo conserva exactamente su origen y su destino,
// sin salto de posición ni de velocidad al entrar o salir. A diferencia de un
// arco basado en el progreso individual, permite que un cubo ya llegado deje
// espacio al siguiente en vez de bloquearle la entrada.

export function solidPath(desiredPose, count, duration, boxOf) {
  const controls = Array.from({ length: count }, () => new THREE.Vector3());
  const finals = Array.from({ length: count }, (_, i) => boxOf(desiredPose(i, duration)));

  // Las direcciones de salida se eligen según la pila final, no según el lado
  // accidental de un cruce. Empujar siempre por la penetración mínima puede
  // encerrar un cubo detrás de su vecino e impedir que alcance su destino.
  const pairs = [];
  for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
    const delta = finals[j].pos.clone().sub(finals[i].pos);
    const normals = finals[i].axes
      .filter(axis => Math.abs(delta.dot(axis)) >= radius(finals[i], axis) + radius(finals[j], axis) - 1e-6)
      .map(axis => axis.clone().multiplyScalar(delta.dot(axis) < 0 ? -1 : 1));
    // Este planificador termina en cajas alineadas, como la figura original.
    if (!normals.length) throw new Error(`Los destinos de los cubos ${i} y ${j} se interpenetran`);
    pairs.push({ i, j, normals });
  }

  const steps = Math.ceil(duration * FREQUENCY);
  const samples = Array.from({ length: steps + 1 }, (_, k) => {
    const t = k * duration / steps;
    return {
      weight: envelope(t, duration),
      boxes: Array.from({ length: count }, (_, i) => boxOf(desiredPose(i, t))),
    };
  });

  // Se ajustan los controles de toda la trayectoria, no las posiciones del
  // fotograma mostrado. Así los desvíos son curvas continuas, sin correcciones
  // repentinas de un motor físico ni dependencia de los fps o del orden de seek.
  let converged = false;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let worst = 0;
    for (const { weight, boxes: originals } of samples) {
      if (weight < 1e-10) continue;
      const boxes = originals.map((box, i) => ({
        ...box, pos: box.pos.clone().addScaledVector(controls[i], weight),
      }));
      const margin = CLEARANCE * weight;
      for (const { i, j, normals } of pairs) {
        const a = boxes[i], b = boxes[j];
        if (!overlap(a, b, margin)) continue;
        const delta = b.pos.clone().sub(a.pos);
        let depth = Infinity, normal;
        for (const n of normals) {
          const missing = radius(a, n) + radius(b, n) + margin - delta.dot(n);
          if (missing < depth) { depth = missing; normal = n; }
        }
        worst = Math.max(worst, depth);
        // Preferir profundidad a desplazamiento en pantalla: la dirección
        // (1,1,1) no cambia la proyección. Se conserva una componente lateral
        // para poder rodear los cruces que la profundidad sola no resuelve.
        const direction = normal.clone().addScalar(6 * (normal.x + normal.y + normal.z));
        direction.divideScalar(normal.dot(direction));
        controls[i].addScaledVector(direction, -depth / (2 * weight));
        controls[j].addScaledVector(direction, depth / (2 * weight));
        a.pos.addScaledVector(direction, -depth / 2);
        b.pos.addScaledVector(direction, depth / 2);
      }
    }
    if (worst < TOLERANCE) { converged = true; break; }
  }
  if (!converged) throw new Error('No se encontró un recorrido sin intersecciones');

  const coordinates = controls.map(control => control.toArray());
  const path = createPath(desiredPose, duration, coordinates);
  path.controls = coordinates;
  return path;
}
