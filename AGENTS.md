# asprog-design-system

## What this is

Sistema de diseño Delphos y método de documentación de los proyectos, publicado como marketplace de Claude Code.

## Place in the setup

- Develop on: Mac mini. El Air y el teléfono entran por Remote Control.
- Delegates to: nadie. No delega trabajo a la Pi.
- Role: ninguno. Sesión de trabajo normal.

## Knowledge packages

Ninguno. Este repo no declara paquetes en `apm.yml`.

## How to verify

`npm run build` y `npm test`; abrir el ejemplo en claro, en oscuro y a 400 px.

## Handoff

El estado se deja en una rama con su PR en borrador: qué está hecho, qué falta y cómo se comprueba. Lo que no es código va al PR o a las notas del vault. Nada queda solo en la sesión.

## Repo notes

### Del AGENTS.md anterior

Guía para cambiar este repo. Para **usar** el sistema en un proyecto, las reglas están en el plugin: `plugins/documentation/skills/` (`method` para qué documento y dónde, `change` para la issue, la comparación y la PR de un cambio, `document` para la regla visual, `site` para el sitio, `check` para las reglas que se comprueban).

### Qué se toca y dónde

| Quiero… | Toco | Y luego |
|---|---|---|
| Cambiar un color, un tamaño, una distancia | `system/tokens.json` | `npm run build` |
| Añadir o cambiar una pieza visual | `system/css/<hoja>.css`, solo con tokens | `npm run build` (renueva `classes.json`) |
| Cambiar qué lleva un tipo de documento | `plugins/documentation/skills/method/reference/` y, si tiene página, su plantilla en `plugins/documentation/skills/site/templates/` | `npm run example` si cambia el ejemplo |
| Cambiar una regla de comprobación | `plugins/documentation/skills/check/scripts/delphos-check` y `skills/check/rules.md`, juntos | `npm test` |
| Cambiar la web (Astro) | `system/astro/` y `system/css/site.css`, solo con tokens | `npm test`; en la web, subir al tag nuevo |
| Cambiar el sitio | `plugins/documentation/skills/site/scripts/site.py`, `system/css/library.css` y `skills/site/SKILL.md` | `npm run example` |

Nunca se editan a mano: `system/tokens.css`, `system/design/`, `plugins/documentation/skills/site/system/`, `plugins/documentation/skills/check/classes.json` ni la `version` de los manifiestos. Los genera `npm run build`.

### Reglas

- **Nada de un cliente o un proyecto concreto.** Hay dos excepciones: la capa web (`system/astro/`, `system/css/site.css`), que es la de andresrsotelo.dev y conserva sus clases sin prefijo de Delphos, y las paletas de marca de `color.palettes` en `tokens.json` (p. ej. `merkle`), que solo traen colores de una guía de marca, con su `source`. Los ejemplos son ficticios (`examples/sample-project/`, el controlador de riego). Un nombre real de cliente, servidor o tabla no entra.
- **El código va en inglés y no lleva comentarios.** Carpetas, ficheros, clases, tokens, funciones y claves de configuración en inglés; README, skills, changelog, commits y todo texto visible, en español. Lo que explicaría un comentario lo dicen los nombres y la forma del código; el porqué va en el commit, la PR o el changelog. Un docstring corto, en inglés, solo en lo público. Se admiten las directivas de herramienta y los avisos de licencia. Los comentarios que ya hay se retiran cuando se toca el archivo o con una tarea expresa.
- **Ningún valor a mano en las hojas.** `scripts/check-css.mjs` lo comprueba. Si falta un paso, se añade a `tokens.json`.
- **Una clase nueva** lleva el prefijo de su capa: `doc-` documento, `lib-` sitio, `d-` diagrama, `hl-` resaltado, `g-` estado.
- **Versión** (SemVer): un cambio de valor en un token existente, o un nombre que desaparece, sube la mayor; una pieza o un token nuevo, la menor; una corrección sin cambio de valores, el parche. En 0.x, lo de la mayor sube la menor. La versión vive en `package.json` y en `system/tokens.json`, iguales (`npm test` lo comprueba); `npm run build` la lleva al plugin y a los manifiestos.
- **Cada skill del plugin lleva dentro lo que usa** (scripts, plantillas, la copia del sistema) y las demás lo piden por la carpeta hermana. Nada en la raíz del plugin salvo el hook: APM solo copia la carpeta de cada skill. El `description` del frontmatter va entre comillas: APM lee YAML estricto.
- **Antes de dar por bueno un cambio**: `npm run build`, `npm test`, y abrir el ejemplo en claro, en oscuro y a 400 px.

<!-- apm:start -->
<!-- apm:end -->
