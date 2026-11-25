# El taller en asprog-design-system

El sistema de diseño Delphos y el método de documentación de los proyectos, publicado como plugin de Claude Code. Ningún nombre de cliente real entra en el repo: los ejemplos son ficticios (un controlador de riego, en `examples/sample-project/`).

## Dónde va cada cosa

- Colores, tamaños, distancias: `system/tokens.json`. Un color nuevo es un token, nunca un valor suelto en una hoja.
- Piezas visuales: `system/css/<hoja>.css`, solo con `var(--token)`.
- Qué lleva cada tipo de documento: `plugins/documentation/skills/method/reference/`.
- Plantillas y sitio: `plugins/documentation/skills/site/`.
- Reglas del chequeo: `plugins/documentation/skills/check/`.

## Reglas que no se rompen

- Código en inglés: carpetas, ficheros, clases, tokens, funciones y claves. Lo que se lee (README, skills, páginas, changelog) en español.
- Sin comentarios en el código: lo que explicaría un comentario lo dicen los nombres y la forma del código. Se admiten las directivas de herramienta y los avisos de licencia.
- Ningún valor a mano en las hojas: `scripts/check-css.mjs` lo comprueba y `npm test` lo ejecuta.
- Prefijo de cada clase nueva: `doc-` documento, `lib-` sitio, `d-` diagrama, `hl-` resaltado, `g-` estado.
- SemVer: un token o una pieza nueva sube la menor; cambiar el valor de un token existente o quitar un nombre, la mayor; una corrección sin cambio de valores, el parche. La versión vive igual en `package.json` y en `system/tokens.json`.
- No se editan a mano: `system/tokens.css`, `system/design/`, `plugins/documentation/skills/site/system/`, `plugins/documentation/skills/check/classes.json` ni la versión de los manifiestos. Los genera `npm run build`.
- Nada de un proyecto concreto: lo que entra son las reglas, no el caso.

## Órdenes

- `npm run build`: tras tocar `system/tokens.json` o cualquier hoja de `system/css/`.
- `npm run example`: tras cambiar la versión del sistema o una página de `examples/sample-project/`.
- `npm test`: antes de dar un cambio por bueno. Tiene que salir verde y sin avisos; si no, se arregla, no se comenta.
- Se hace commit de todo lo que generan `npm run build` y `npm run example`, no solo de lo escrito a mano.
