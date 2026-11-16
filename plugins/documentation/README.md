# Plugin documentation

El método de documentación de los proyectos y su sistema de diseño (identidad Delphos), para que todos los repos se documenten igual.

| Ruta | Qué es |
|---|---|
| `skills/method/` | Dónde va cada documento, los tipos y sus secciones, la voz, las páginas de implementación y técnicas, y el alineamiento entre diseño y código |
| `skills/document/` | La regla visual: hojas, esqueleto, del Markdown al HTML y lo que no se hace |
| `skills/change/` | Un cambio de la issue a la PR: las plantillas de issue y de PR y la comparación hoy \| propuesta con lo nuevo en rojo |
| `skills/check/` | Las nueve reglas de `delphos-check`, para revisar a mano |
| `skills/site/` | El sitio del proyecto: copia del sistema, páginas nuevas, portada y barra lateral |
| `skills/check/scripts/delphos-check` | Comprueba un HTML (Node, sin dependencias). El hook lo pasa a cada `.html` que Claude escribe |
| `skills/change/scripts/figure-png` | Guarda las figuras de una página como PNG, para enseñarlas en una PR (Node con Playwright) |
| `skills/change/scripts/standalone-html` | Convierte una página en un solo HTML autocontenido, sin barra lateral, para subirlo como artefacto de una issue (Node, sin dependencias) |
| `skills/change/templates/` | Plantillas de la descripción de una PR (`pull_request_template.md`) y de las issues (`issues/build.md`, `issues/design.md`) |
| `skills/site/scripts/site.py` | `vendor`, `new` y `build` del sitio (Python 3.11+ con `markdown`, o `uv`) |
| `skills/site/templates/` | Plantillas de página (implementación, técnica, diseño, documento) y de `site.toml` y `home.md` |
| `skills/site/system/` | Copia generada de `system/` del repo: no se edita aquí |

Cada skill lleva dentro los scripts y plantillas que usa, y las demás los piden por la carpeta hermana (`../check/`, `../site/`). Así funcionan igual como plugin de Claude Code y instaladas con APM, que solo copia la carpeta de cada skill.

Instalación y desarrollo: el README de la raíz del repo.
