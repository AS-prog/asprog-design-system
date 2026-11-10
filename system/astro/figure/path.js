// Copia de src/lib/figure/path.js (sitio-personal, develop, 1451235) con un solo cambio:
// Three.js se importa como paquete (`three`, 0.181.2) en vez de desde ./vendor/.
import { Vector3 } from 'three';

export const envelope = (t, duration) => t <= 0 || t >= duration
  ? 0 : Math.sin(Math.PI * t / duration) ** 2;

// El navegador solo evalúa la curva; la búsqueda de colisiones ocurre al construir.
export function createPath(desiredPose, duration, coordinates) {
  const controls = coordinates.map(point => new Vector3(...point));
  const path = seconds => {
    const t = Math.max(0, Math.min(duration, seconds));
    const weight = envelope(t, duration);
    return controls.map((control, i) => {
      const pose = desiredPose(i, t);
      pose.pos.addScaledVector(control, weight);
      return pose;
    });
  };
  path.maxDeviation = Math.max(...controls.map(control => control.length()));
  return path;
}
