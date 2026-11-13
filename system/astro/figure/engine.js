// Copia de src/lib/figure/engine.js (sitio-personal, develop, 1451235) con un solo cambio:
// Three.js se importa como paquete (`three`, 0.181.2) en vez de desde ./vendor/.
// El motor de la figura de los catorce cubos, en Three.js.
//
// Portado de `figura-cubos-3d/pieza.js`, donde vive la página de estudio. Allí la pieza se
// arrancaba sola sobre `#lienzo` y leía sus parámetros de la URL; aquí es una función que
// recibe su lienzo, para que la portada la importe de forma diferida y el respaldo estático
// siga vivo si JavaScript o WebGL no están. Identificadores en inglés, comentarios en
// español (regla del repo). La geometría, la proyección y las trayectorias no cambian: son
// las medidas copiadas de la landing y su equivalencia píxel a píxel está verificada allí.
//
// Los materiales leen los tokens de la página —`--ink`, `--cube-top`, `--cube-right`,
// `--cube-left`— en cada fotograma, así que la pila teñida por capas sigue al tema sin
// tocar código.
import * as THREE from 'three';
import { createFigureModel } from './model.js';
import { createPath } from './path.js';
import pathControls from './path-controls.json';

export function mountCubeFigure({ canvas, container, fit = 'contain', onStateChange = () => {} }) {
  const {
    VIEW, BASE, STROKE, PROJECTION, SEMI, SIDE, HEIGHT, DURATION, ROW, BORN, GROWN,
    BONUS, RISE_GAIN, TOP, DEPTH_SCALE, VIEW_AXIS, model, targets, cubes,
    screenX, screenY, fromScreen, targetDepth, startDepth, destinations, ease, mix, desiredPose,
  } = createFigureModel();

  // ── La escena ──────────────────────────────────────────────────────────────
  // Valores de respaldo: los tonos que manda la página llegan por CSS y el motor no sabe
  // nada de temas. Están aquí solo porque el lienzo existe antes de que llegue el primer
  // estilo computado.
  const INK = 0x1f2be0;
  const PAPER = 0xf0ebde;
  const CUBE_RIGHT = 0xcfcce0;   // cara +X, la que cae a la derecha
  const CUBE_LEFT = 0xe0dce0;    // cara +Z, la que cae a la izquierda
  const CUBE_TOP = PAPER;        // cara +Y

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  // El encuadre es exactamente el viewBox de la figura. La cámara no puede mirar con una
  // sola escala: como la proyección de la landing no es isótropa, una unidad del viewBox
  // vale 1/(6/7·√2) = 0,8250 unidades de cámara en horizontal y √(2/3) = 0,8165 en vertical.
  // El frustum usa las dos, y así cada unidad del viewBox cae en su píxel justo por los dos
  // ejes. La cámara apunta al centro del viewBox, no al centro del montón: son dos puntos
  // distintos y confundirlos desplaza la figura entera.
  const CAM_H = 1 / (PROJECTION * Math.SQRT2);
  const CAM_V = Math.sqrt(2 / 3);
  const worldCentre = fromScreen(VIEW[0] / 2, VIEW[1] / 2, 0);

  // Cuánto ocupa la figura a lo largo del eje de vista: eso es lo que la cámara tiene que
  // abarcar. Se saca de la profundidad de los catorce cubos y no de un número fijo.
  const REACH = Math.max(...targetDepth.map(Math.abs),
    ...startDepth.map(Math.abs)) / Math.SQRT2 + TOP + 20;
  const DISTANCE = REACH + 1000;             // ortográfica: solo importa que no recorte nada
  const camera = new THREE.OrthographicCamera(
    -VIEW[0] * CAM_H / 2, VIEW[0] * CAM_H / 2, VIEW[1] * CAM_V / 2, -VIEW[1] * CAM_V / 2,
    DISTANCE - REACH, DISTANCE + REACH,
  );

  // El eje de vista apunta del centro de la figura hacia la cámara, así que también es el
  // eje sobre el que giran las inclinaciones: la landing gira en el plano de la pantalla, y
  // aquí eso es girar alrededor de este eje.
  camera.position.copy(worldCentre).add(VIEW_AXIS.clone().multiplyScalar(DISTANCE));
  camera.up.set(0, 1, 0);
  camera.lookAt(worldCentre);

  // ── Mirar la figura desde otro sitio ───────────────────────────────────────
  // La figura no se mueve: se mueve el punto de vista. Al soltar, la cámara vuelve sola al
  // encuadre exacto, que es el único desde el que la figura coincide con la landing. Lo que
  // se ve mientras se arrastra es justo lo que el dibujo plano no puede enseñar: que la pila
  // es un montón de sólidos y que es la profundidad, y no un criterio de dibujo, la que
  // decide quién tapa a quién.
  const YAW_LIMIT = 1.15;                    // ≈ 66°, en redondo sobre el eje vertical
  const PITCH_LIMIT = 0.62;                  // ≈ 35°, de alza y de picado
  const RIGHT = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const restPosition = camera.position.clone();
  const qRest = camera.quaternion.clone();

  // La órbita gira alrededor del centro del montón, no del punto que la cámara enfila: la
  // figura está repartida a lo largo del eje de vista y girar alrededor del segundo la
  // sacaría del encuadre. En reposo las dos coinciden, así que el encuadre exacto no se toca.
  const pileCentre = destinations.reduce((s, p) => s.add(p), new THREE.Vector3())
    .multiplyScalar(1 / destinations.length);
  const fromPile = restPosition.clone().sub(pileCentre);

  const orbit = { yaw: 0, pitch: 0, active: false };
  let drag = null;

  const UP = new THREE.Vector3(0, 1, 0);
  const qYaw = new THREE.Quaternion();
  const qPitch = new THREE.Quaternion();
  const offset = new THREE.Vector3();
  const clamp = (v, limit) => Math.max(-limit, Math.min(limit, v));

  function placeCamera() {
    if (orbit.yaw === 0 && orbit.pitch === 0) {
      camera.position.copy(restPosition);
      camera.quaternion.copy(qRest);
      return;
    }
    qYaw.setFromAxisAngle(UP, orbit.yaw);
    qPitch.setFromAxisAngle(RIGHT, orbit.pitch);
    qYaw.premultiply(qPitch);
    camera.quaternion.copy(qYaw).multiply(qRest);
    offset.copy(fromPile).applyQuaternion(qYaw);
    camera.position.copy(pileCentre).add(offset);
  }

  // Un cubo son seis caras de color y doce aristas de tinta. La landing dibuja cada cara con
  // un `stroke` de 2 centrado en su camino, así que la tinta queda a caballo de la arista:
  // una unidad dentro del cubo y otra fuera, medidas en la pantalla.
  //
  // Esa banda es una medida de pantalla, y en 3D solo la reproduce una cosa: un cilindro.
  // La silueta de un cilindro bajo una proyección ortográfica mide su diámetro, se mire
  // desde donde se mire —una barra de sección cuadrada mide entre 2 y 2√2 según el ángulo,
  // y en isométrico sale un 35% de más—. Además los cilindros se juntan en las esquinas en
  // una bolita, que es justo lo que hace el `stroke-linejoin: round` de la landing.
  const half = SEMI;                         // 28 · semilado en X y en Z
  const floor = -SEMI + BASE;                // −26 · el suelo del cubo, con BASE de holgura
  const centreY = BASE / 2;                  // 1 · lo que hay que subir del origen al centro del cajón
  const square = new THREE.PlaneGeometry(SIDE, SIDE);
  const lateral = new THREE.PlaneGeometry(SIDE, HEIGHT);
  // Las aristas de la planta miden SIDE y las verticales HEIGHT, que no es lo mismo: el cubo
  // es dos unidades más bajo que ancho, y su trazo tiene que salir del mismo sitio que el suyo.
  const barFloor = new THREE.CylinderGeometry(STROKE / 2, STROKE / 2, SIDE + STROKE, 12);
  const barHeight = new THREE.CylinderGeometry(STROKE / 2, STROKE / 2, HEIGHT + STROKE, 12);
  const inkMaterial = new THREE.MeshBasicMaterial({ color: INK });

  // Los tonos llevan el nombre de la landing —derecha, izquierda, arriba—, que son sitios en
  // la pantalla y no ejes del mundo. Por eso el color se decide en cada fotograma mirando
  // dónde cae la cara, y no se fija al construir el cubo: así la figura se sigue leyendo
  // igual desde cualquier punto de vista, que es como la dibuja la landing.
  const palette = (top, right, left) => ({
    top: new THREE.MeshBasicMaterial({ color: top }),
    right: new THREE.MeshBasicMaterial({ color: right }),
    left: new THREE.MeshBasicMaterial({ color: left }),
  });

  // Una paleta por capa: la planta conserva los tonos de la landing y la cúspide sube al
  // cobalto de la tinta, con las capas de en medio en el punto medio. La página manda: los
  // tonos de la planta se leen de sus tokens en cada fotograma y la cúspide se calcula
  // desde su tinta, así que la rampa se mueve con el tema sin un token nuevo y sin tocar
  // la figura.
  const SIDES = ['top', 'right', 'left'];
  const LAYERS = Math.max(...targets.map(t => t.layer)) + 1;
  const SHADES = Array.from({ length: LAYERS }, () => palette(CUBE_TOP, CUBE_RIGHT, CUBE_LEFT));

  // La cúspide no es un color suelto: es --cube-apex en tres claridades, y en el mismo orden
  // que los tonos de la landing. Con la tinta a secas en las tres caras el cubo de arriba
  // sería un rombo plano —sus aristas son de su mismo color—; con tres cobaltos las aristas
  // se siguen leyendo y el cubo se lee azul sin dejar de leerse cubo.
  const LIGHTNESS = { top: 0.68, left: 0.58, right: 0.38 };
  const BASE_ = { top: new THREE.Color(), right: new THREE.Color(), left: new THREE.Color() };
  const APEX = { top: new THREE.Color(), right: new THREE.Color(), left: new THREE.Color() };
  const hsl = { h: 0, s: 0, l: 0 };
  const rgb = { from: { r: 0, g: 0, b: 0 }, to: { r: 0, g: 0, b: 0 } };

  // Los catorce tonos salen de mezclar los de la planta con los de la cúspide, capa a capa.
  // El estilo llega computado del elemento contenedor: son los tokens de la página.
  function tintLayers(style) {
    inkMaterial.color.set(style.getPropertyValue('--ink').trim() || INK);
    BASE_.top.set(style.getPropertyValue('--cube-top').trim() || CUBE_TOP);
    BASE_.right.set(style.getPropertyValue('--cube-right').trim() || CUBE_RIGHT);
    BASE_.left.set(style.getPropertyValue('--cube-left').trim() || CUBE_LEFT);
    // Las claridades se piden en sRGB, no en el espacio de trabajo: `getHSL` y `setHSL`
    // trabajan en lineal por defecto, y en lineal el cobalto de la tinta ya está en 0,38 de
    // claridad. Pedirle 0,38 devolvía la tinta misma y 0,68 salía lavado; con las tres
    // claridades en sRGB son las que un ojo llama claras, medias y oscuras.
    // El tono de la cúspide es --cube-apex: cobalto en los dos temas. En oscuro ink es papel,
    // y la cúspide salía marrón sobre azul noche, como un negativo.
    APEX.top.set(style.getPropertyValue('--cube-apex').trim() || INK);
    APEX.top.getHSL(hsl, THREE.SRGBColorSpace);
    for (const side of SIDES) APEX[side].setHSL(hsl.h, hsl.s, LIGHTNESS[side], THREE.SRGBColorSpace);
    for (const side of SIDES) {
      // La mezcla se hace en sRGB, que es el espacio en el que están escritos los tokens y
      // las claridades de la cúspide. `Color.lerp` mezcla en lineal, y ahí el punto medio de
      // un papel y un cobalto sale bastante más claro que el ojo que lo mira: la capa de en
      // medio quedaría pegada a la planta en vez de entre las dos.
      BASE_[side].getRGB(rgb.from, THREE.SRGBColorSpace);
      APEX[side].getRGB(rgb.to, THREE.SRGBColorSpace);
      SHADES.forEach((shades, layer) => {
        const t = LAYERS > 1 ? layer / (LAYERS - 1) : 1;
        shades[side].color.setRGB(
          mix(rgb.from.r, rgb.to.r, t),
          mix(rgb.from.g, rgb.to.g, t),
          mix(rgb.from.b, rgb.to.b, t),
          THREE.SRGBColorSpace);
      });
    }
  }

  // Las seis caras, con la normal hacia fuera: al ser un sólido cerrado, el motor descarta
  // las tres que quedan detrás y no hace falta que cubran nada. Las de la planta van a
  // `half` y a `floor` —el suelo no está en −half, la landing lo sube BASE—, y las cuatro
  // laterales son más bajas que anchas y van centradas en el cajón, no en el origen.
  const FACES = [
    { normal: [0, 1, 0], euler: [-Math.PI / 2, 0, 0], pos: [0, half, 0], geo: square },
    { normal: [0, -1, 0], euler: [Math.PI / 2, 0, 0], pos: [0, floor, 0], geo: square },
    { normal: [1, 0, 0], euler: [0, Math.PI / 2, 0], pos: [half, centreY, 0], geo: lateral },
    { normal: [-1, 0, 0], euler: [0, -Math.PI / 2, 0], pos: [-half, centreY, 0], geo: lateral },
    { normal: [0, 0, 1], euler: [0, 0, 0], pos: [0, centreY, half], geo: lateral },
    { normal: [0, 0, -1], euler: [0, Math.PI, 0], pos: [0, centreY, -half], geo: lateral },
  ];

  // Las doce aristas: cuatro a lo largo de cada eje. El cilindro viene con el eje en Y, así
  // que se gira para tumbarlo sobre el eje que toca, y las verticales llevan su propio largo.
  const EDGES = [];
  for (const y of [half, floor]) for (const z of [1, -1]) {
    EDGES.push({ bar: barFloor, euler: [0, 0, Math.PI / 2], pos: [0, y, z * half] });
  }
  for (const x of [1, -1]) for (const z of [1, -1]) {
    EDGES.push({ bar: barHeight, euler: [0, 0, 0], pos: [x * half, centreY, z * half] });
  }
  for (const x of [1, -1]) for (const y of [half, floor]) {
    EDGES.push({ bar: barFloor, euler: [Math.PI / 2, 0, 0], pos: [x * half, y, 0] });
  }

  const qCameraInverse = new THREE.Quaternion();
  const screenNormal = new THREE.Vector3();

  function faceShade(normal, qCube, layer) {
    screenNormal.set(...normal).applyQuaternion(qCube).applyQuaternion(qCameraInverse);
    const shades = SHADES[layer];
    if (screenNormal.y > 0) return shades.top;      // la que mira arriba lleva el tono claro
    return screenNormal.x > 0 ? shades.right : shades.left;
  }

  const groups = cubes.map(cube => {
    const group = new THREE.Group();
    for (const { bar, euler, pos } of EDGES) {
      const mesh = new THREE.Mesh(bar, inkMaterial);
      mesh.rotation.copy(new THREE.Euler(...euler));
      mesh.position.set(...pos);
      group.add(mesh);
    }
    const faceMeshes = FACES.map(({ euler, pos, geo }) => {
      const mesh = new THREE.Mesh(geo, SHADES[cube.layer].top);
      mesh.rotation.copy(new THREE.Euler(...euler));
      mesh.position.set(...pos);
      group.add(mesh);
      return mesh;
    });
    scene.add(group);
    return { group, faceMeshes };
  });

  // ── Presentación ───────────────────────────────────────────────────────────
  // Los arcos se precalculan al construir. Aquí se evalúa el mismo recorrido continuo,
  // sin repetir la búsqueda de colisiones en cada visita.
  const data = cubes.map(() => ({ x: 0, y: 0, angle: 0, scale: 1 }));

  const path = createPath(desiredPose, DURATION, pathControls);

  // Los rodeos ocupan más profundidad que la recta entre origen y destino. Alejar la cámara
  // ortográfica no cambia el encuadre; ampliar el fondo evita cortar las caras de un cubo
  // que se aparta detrás del resto.
  const pathMargin = VIEW_AXIS.clone().multiplyScalar(path.maxDeviation);
  camera.position.add(pathMargin);
  restPosition.add(pathMargin);
  fromPile.add(pathMargin);
  camera.far += 2 * path.maxDeviation;
  camera.updateProjectionMatrix();

  function draw(seconds, still = false) {
    // La página es dueña de su paleta: los tokens se leen en cada fotograma, no al montar
    // la escena, para que el cambio de tema o de tinta teña la pila sin tocar código.
    tintLayers(getComputedStyle(container));
    const poses = still ? cubes.map((_, i) => desiredPose(i, DURATION, true)) : path(seconds);
    placeCamera();
    qCameraInverse.copy(camera.quaternion).invert();
    cubes.forEach((cube, i) => {
      const { pos, scale, spin } = poses[i];
      const { group, faceMeshes } = groups[i];
      group.position.copy(pos);
      group.quaternion.setFromAxisAngle(VIEW_AXIS, spin);
      group.scale.setScalar(scale);
      FACES.forEach(({ normal }, k) => {
        faceMeshes[k].material = faceShade(normal, group.quaternion, cube.layer);
      });

      data[i].x = screenX(pos);
      data[i].y = screenY(pos);
      data[i].angle = -spin * 180 / Math.PI;
      data[i].scale = scale;
    });
    renderer.render(scene, camera);
  }

  // ── El reloj ───────────────────────────────────────────────────────────────
  // Igual que en la landing: el instante es una entrada, no un contador que solo avanza. Al
  // mismo bucle se le encomienda la vuelta de la cámara, que es interfaz y no figura; por
  // eso el tiempo de la figura y el de la cámara se cuentan por separado y el de la figura
  // no se toca mientras se mira desde otro sitio.
  const motion = matchMedia('(prefers-reduced-motion: reduce)');

  let elapsed = 0, last = null, raf = null;
  let reduced = motion.matches, visible = true, playing = false, paused = false;

  const done = () => elapsed >= DURATION;
  const render = () => reduced ? draw(DURATION, true) : draw(elapsed, done());
  const state = () => ({ elapsed, playing, paused, reduced, visible, completed: done(), orbit: { ...orbit } });
  const notify = () => onStateChange(state());
  // La pausa explícita también detiene la vuelta automática de la cámara.
  const returning = () => orbit.active && !drag && !paused && !reduced && visible && !document.hidden;

  const BRAKE = 5.5;                          // con qué rapidez vuelve la cámara al encuadre
  const STILL = 0.0008;                       // a partir de aquí, el encuadre es el de reposo

  function returnCamera(dt) {
    if (drag) return;
    const f = Math.exp(-dt * BRAKE);
    orbit.yaw *= f;
    orbit.pitch *= f;
    if (Math.abs(orbit.yaw) < STILL && Math.abs(orbit.pitch) < STILL) {
      orbit.yaw = 0; orbit.pitch = 0; orbit.active = false;
    }
  }

  function frame(now) {
    raf = null;
    const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
    last = now;
    if (playing) {
      elapsed += dt;
      if (done()) { elapsed = DURATION; playing = false; notify(); }
    }
    if (returning()) returnCamera(dt);
    render();
    if (playing || returning()) raf = requestAnimationFrame(frame);
  }

  const wake = () => {
    if (raf === null) { last = null; raf = requestAnimationFrame(frame); }
  };
  const halt = () => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null; last = null;
  };
  const sync = () => {
    halt();
    playing = !paused && !reduced && visible && !document.hidden && !done();
    if (playing || returning()) wake();
    notify();
  };

  const seek = t => { elapsed = Math.max(0, Math.min(DURATION, t)); render(); sync(); };
  const pause = () => { paused = true; sync(); };
  const resume = () => {
    if (reduced) return;
    if (done()) elapsed = 0;
    paused = false;
    sync();
  };
  const resetView = () => {
    orbit.yaw = 0; orbit.pitch = 0; orbit.active = false;
    render(); sync();
  };
  // Cada pulsación deja un encuadre estable, sin exigir mantener una tecla pulsada.
  const rotate = (yaw, pitch) => {
    orbit.yaw = clamp(orbit.yaw + yaw, YAW_LIMIT);
    orbit.pitch = clamp(orbit.pitch + pitch, PITCH_LIMIT);
    orbit.active = false;
    render(); sync();
  };

  // ── El arrastre ────────────────────────────────────────────────────────────
  // Un grado de giro por cada tercio de ancho recorrido, y de alza algo menos: así el gesto
  // se siente igual en un lienzo grande y en uno pequeño, sin depender del tamaño en píxeles.
  canvas.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY };
    orbit.active = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
    sync();
  });

  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const width = Math.max(container.clientWidth, 1);
    orbit.yaw = clamp(orbit.yaw + (e.clientX - drag.x) / width * 3.2, YAW_LIMIT);
    orbit.pitch = clamp(orbit.pitch - (e.clientY - drag.y) / width * 2.2, PITCH_LIMIT);
    drag.x = e.clientX;
    drag.y = e.clientY;
    render();
  });

  const release = e => {
    if (!drag) return;
    drag = null;
    canvas.classList.remove('dragging');
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    // Sin movimiento automático, el encuadre elegido queda disponible para inspeccionarlo.
    if (reduced || paused) orbit.active = false;
    sync();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  // Un doble clic devuelve el encuadre sin esperar a la vuelta.
  canvas.addEventListener('dblclick', resetView);

  // Ajuste del lienzo: el viewBox manda, el contenedor solo decide el tamaño.
  function resize() {
    const contain = fit === 'contain';
    const width = contain
      ? Math.min(container.clientWidth || VIEW[0], (container.clientHeight || VIEW[1]) * VIEW[0] / VIEW[1])
      : container.clientWidth || VIEW[0];
    const height = width * VIEW[1] / VIEW[0];
    renderer.setSize(width, height, contain);
    render();
  }
  new ResizeObserver(resize).observe(container);

  // Gancho de verificación. La portada no lo necesita; el arnés de `verificacion/` (ticket
  // 08) sí, para pedir un instante sin esperarlo y para leer la geometría desde donde vive.
  const handle = {
    draw, duration: DURATION, model, cubes, targets, seek,
    state, pause, resume, rotate, resetView,
    cubes2d: data,
    project: ({ x, y, z }) => new THREE.Vector3(x, y, z).project(camera),
    // La geometría en 3D: es lo que la comprobación necesita para saber si dos cubos se
    // cortan o si el orden de profundidad contradice al del pintor. El cajón no es simétrico
    // en Y —la planta sube BASE—, así que lo que se cuenta es su centro y sus tres semiejes
    // ya escalados: con eso el arnés rehace las ocho esquinas sin saber de dónde salen.
    world: (seconds = elapsed) => path(seconds).map(({ p, scale, spin, pos }, i) => {
      const cube = cubes[i];
      const q = new THREE.Quaternion().setFromAxisAngle(VIEW_AXIS, spin);
      const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
        .map(a => new THREE.Vector3(...a).applyQuaternion(q));
      const centre = pos.clone().add(axes[1].clone().multiplyScalar(scale * centreY));
      return {
        i, layer: cube.layer, p, scale, pos: centre,
        h: [scale * half, scale * HEIGHT / 2, scale * half],
        axes,
        // Profundidad a lo largo del eje de vista: mayor = más cerca de la cámara.
        depth: pos.dot(VIEW_AXIS),
        x: screenX(pos), y: screenY(pos),
      };
    }),
    // La clave del pintor de la landing, para poder comparar los dos órdenes en el mismo instante.
    key: (seconds = elapsed) => cubes.map((cube, i) => {
      const p = ease((seconds - cube.delay) / cube.travel);
      const y = mix(cube.start[1], cube.target[1], p);
      return y + cube.layer * BONUS * p;
    }),
    side: SIDE, height: HEIGHT, top: TOP, row: ROW, rise: RISE_GAIN, depthScale: DEPTH_SCALE,
    bornScale: BORN, finalScale: GROWN, bonus: BONUS, duration: DURATION,
  };

  // Solo retirar la imagen de respaldo después del primer render correcto.
  resize();
  container.dataset.ready = '';
  motion.addEventListener('change', () => {
    reduced = motion.matches;
    if (reduced) orbit.active = false;
    render(); sync();
  });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(container);
  new MutationObserver(render).observe(document.documentElement, {
    attributes: true, attributeFilter: ['style', 'class', 'data-theme'],
  });
  sync();

  return handle;
}
