# asprog-design-system

El sistema de diseño y el método de documentación de mis proyectos, en un solo sitio y como marketplace de Claude Code. Un proyecto instala el plugin `documentation` y tiene todo lo que necesita para documentarse igual que los demás: dónde va cada documento y qué lleva, las plantillas de página, las hojas de estilo, el sitio con barra lateral y la comprobación automática de cada HTML.

La identidad visual es **Delphos** sobre **Cobalt Grid** (papel crema, una sola tinta, retícula, radio 0). Este repo sustituye a `delphos-design-system` (la parte de documentos), `delphos-inc` (el marketplace) y el plugin local `documentacion`. Nada de un cliente concreto vive aquí: lo de cada proyecto va en su propio repo.

## Qué hay

| Ruta | Qué es |
|---|---|
| `system/` | La fuente del sistema: `tokens.json` (y `tokens.css`, generado), `fonts/` y las hojas `css/base.css`, `css/document.css`, `css/view.css` (vistas generadas) y `css/library.css` (sitio: barra lateral y portada) |
| `plugins/documentation/` | El plugin: skills `method`, `document`, `check` y `site`; `scripts/delphos-check` y su hook; `scripts/site.py`; las plantillas de página; y una copia generada de `system/` |
| `plugins/diagrams/` | Los 45 tipos de diagrama de diagram-design como SVG en línea con las clases `.d-*` |
| `examples/sample-project/` | Un proyecto ficticio (un controlador de riego) con su sitio, para probar y como modelo |
| `scripts/` | `build.mjs` (prepara el plugin), `test.mjs` (lo comprueba todo) y la librería de tokens |
| `.claude-plugin/marketplace.json` | El marketplace `asprog` |

## Instalar en un proyecto

```
/plugin marketplace add AS-prog/asprog-design-system
/plugin install documentation@asprog
/plugin install diagrams@asprog
```

En claude.ai: Customize > Plugins > Add marketplace con `AS-prog/asprog-design-system`. Para fijarlo en un proyecto, copia `plugins/documentation/examples/project-settings.json` a su `.claude/settings.json`.

Después, en el repo de gestión del proyecto, la skill `site` lo prepara: `site.toml` y `home.md` en `docs/site/`, la copia del sistema en `docs/design-system/vX.Y/` y la portada.

## Cómo funciona

- **Una sola fuente.** `system/` es el sistema; el plugin lleva una copia porque Claude Code no le deja mirar fuera de su carpeta. `npm run build` la renueva y `npm test` falla si se queda atrás.
- **Las páginas no piden nada fuera del repo.** Cada proyecto lleva su copia fijada del sistema (`site.py vendor`) y las páginas la enlazan con rutas relativas: se abren con doble clic, sin red.
- **El método es común; los nombres son de cada proyecto.** El `AGENTS.md` del repo de gestión dice sus repos, su servicio y su glosario, y manda sobre el método donde lo concreta.

## Desarrollar

```
npm run build      # tokens.css desde tokens.json; copia del sistema y classes.json en el plugin; versión en los manifiestos
npm test           # tokens y contrastes, hojas sin valores a mano, copias al día, delphos-check sobre el ejemplo y los diagramas, sitio del ejemplo al día
npm run example    # regenera la copia del sistema y el sitio del ejemplo
```

Hace falta Node 18+ y `uv` (o Python 3.11+ con `markdown`). La guía para agentes que cambian este repo está en [`AGENTS.md`](AGENTS.md); los cambios, en [`CHANGELOG.md`](CHANGELOG.md).
