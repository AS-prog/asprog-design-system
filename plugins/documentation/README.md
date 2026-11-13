# Plugin documentation

El método de documentación de los proyectos y su sistema de diseño (identidad Delphos), para que todos los repos se documenten igual.

| Ruta | Qué es |
|---|---|
| `skills/method/` | Dónde va cada documento, los tipos y sus secciones, la voz, las páginas de implementación y técnicas, y el alineamiento entre diseño y código |
| `skills/document/` | La regla visual: hojas, esqueleto, del Markdown al HTML y lo que no se hace |
| `skills/change/` | Un cambio de la issue a la PR: las plantillas de issue y de PR y la comparación hoy \| propuesta con lo nuevo en rojo |
| `skills/check/` | Las nueve reglas de `delphos-check`, para revisar a mano |
| `skills/site/` | El sitio del proyecto: el sistema copiado o desde jsDelivr, páginas nuevas, portada y barra lateral |
| `scripts/delphos-check` | Comprueba un HTML (Node, sin dependencias). El hook lo pasa a cada `.html` que Claude escribe |
| `scripts/figure-png` | Guarda las figuras de una página como PNG, para enseñarlas en una PR (Node con Playwright) |
| `scripts/standalone-html` | Convierte una página en un solo HTML autocontenido, sin barra lateral, para subirlo como artefacto de una issue (Node, sin dependencias) |
| `scripts/site.py` | `vendor`, `new` y `build` del sitio (Python 3.11+ con `markdown`, o `uv`). Con `system` como URL de jsDelivr no copia nada |
| `templates/` | Plantillas de página (implementación, técnica, diseño, documento), de `site.toml` y `home.md`, de la descripción de una PR (`pull_request_template.md`) y de las issues (`issues/build.md`, `issues/design.md`) |
| `system/` | Copia generada de `system/` del repo: no se edita aquí |

## Copia o jsDelivr

Un proyecto enlaza el sistema de una de dos formas, según `[project] system` de su `site.toml`:

- **Copia** (por defecto): `site.py vendor` lo deja en `docs/design-system/vX.Y/` y las páginas lo enlazan con rutas relativas. Se ve sin red y con doble clic, pero cada versión es una copia más en el repo (≈ 0,6 MB) y cada página se queda en la suya.
- **jsDelivr**: `system = "https://cdn.jsdelivr.net/gh/AS-prog/asprog-design-system@vX.Y.Z/system"`. No hay copia; las páginas cargan el sistema de este repo en ese tag, y para subir de versión se cambia el tag y se ejecuta `site.py build`. Sin red, las páginas salen sin estilos. Exige que este repo siga siendo público.

La comparación completa y cómo pasar de una a otra están en `skills/site/`.

Instalación y desarrollo: el README de la raíz del repo.
