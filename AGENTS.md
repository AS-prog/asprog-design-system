# AGENTS.md

Guía para cambiar este repo. Para **usar** el sistema en un proyecto, las reglas están en el plugin: `plugins/documentation/skills/` (`method` para qué documento y dónde, `document` para la regla visual, `site` para el sitio, `check` para las reglas que se comprueban).

## Qué se toca y dónde

| Quiero… | Toco | Y luego |
|---|---|---|
| Cambiar un color, un tamaño, una distancia | `system/tokens.json` | `npm run build` |
| Añadir o cambiar una pieza visual | `system/css/<hoja>.css`, solo con tokens | `npm run build` (renueva `classes.json`) |
| Cambiar qué lleva un tipo de documento | `plugins/documentation/skills/method/reference/` y, si tiene página, su plantilla en `plugins/documentation/templates/` | `npm run example` si cambia el ejemplo |
| Cambiar una regla de comprobación | `plugins/documentation/scripts/delphos-check` y `skills/check/rules.md`, juntos | `npm test` |
| Cambiar el sitio | `plugins/documentation/scripts/site.py`, `system/css/library.css` y `skills/site/SKILL.md` | `npm run example` |

Nunca se editan a mano: `system/tokens.css`, `plugins/documentation/system/`, `plugins/documentation/skills/check/classes.json` ni la `version` de los manifiestos. Los genera `npm run build`.

## Reglas

- **Nada de un cliente o un proyecto concreto.** Los ejemplos son ficticios (`examples/sample-project/`, el controlador de riego). Un nombre real de cliente, servidor o tabla no entra.
- **El código va en inglés y los comentarios en español.** Carpetas, ficheros, clases, tokens, funciones y claves de configuración en inglés; README, skills, changelog, commits y todo texto visible, en español.
- **Ningún valor a mano en las hojas.** `scripts/check-css.mjs` lo comprueba. Si falta un paso, se añade a `tokens.json`.
- **Una clase nueva** lleva el prefijo de su capa: `doc-` documento, `lib-` sitio, `d-` diagrama, `hl-` resaltado, `g-` estado.
- **Versión** (SemVer): un cambio de valor en un token existente, o un nombre que desaparece, sube la mayor; una pieza o un token nuevo, la menor; una corrección sin cambio de valores, el parche. En 0.x, lo de la mayor sube la menor. La versión vive en `package.json` y en `system/tokens.json`, iguales (`npm test` lo comprueba); `npm run build` la lleva al plugin y a los manifiestos.
- **Antes de dar por bueno un cambio**: `npm run build`, `npm test`, y abrir el ejemplo en claro, en oscuro y a 400 px.
