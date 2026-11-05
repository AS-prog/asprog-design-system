# Cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y la versión, [SemVer](https://semver.org/lang/es/).

## Sin publicar

## 0.7.1 · 2026-11-05

### Cambiado
- Skill `document`: toda página vive en un sitio con barra lateral. Si el proyecto no tiene `docs/site/site.toml`, se monta con la skill `site` antes de la primera página, y una página no está terminada hasta que tiene la barra y sale en la portada. Una entrega de varias páginas fuera del repo lleva también su portada y su barra.

## 0.7.0 · 2026-11-05

Primera versión de `asprog-design-system`: une en un repo el sistema Delphos (de `delphos-design-system` 0.6.0), el marketplace (`delphos-inc`) y el método de documentación de los proyectos, reescrito sin nada de un cliente concreto.

### Añadido
- `system/css/library.css`: la capa de sitio (barra lateral y portada) con prefijo `lib-`. Tokens nuevos `nav-width` y `nav-break`.
- Plugin `documentation` con cuatro skills: `method` (dónde va cada documento, los tipos, la voz, las páginas de implementación y técnicas, el alineamiento entre diseño y código), `document` (la regla visual), `check` y `site`.
- `scripts/site.py`: `vendor` copia el sistema al proyecto, `new` crea una página desde su plantilla con las rutas calculadas, `build` escribe la portada y la barra lateral desde `docs/site/site.toml` (y `--check` para CI).
- Plantillas de página: implementación, técnica, diseño y documento.
- `examples/sample-project/`: un proyecto ficticio con su sitio.
- `npm test` comprueba tokens, hojas, copias del plugin, el ejemplo y los diagramas con `delphos-check`, y que el sitio del ejemplo está al día.

### Cambiado
- `delphos-check` ya no admite ningún host externo por defecto: las hojas van copiadas en el repo. Admite `css/library.css` como última hoja, vigila el prefijo `lib-` y no cuenta los `h2` de la barra lateral.
- El plugin `diagrams` pasa a este marketplace (`diagrams@asprog`) y remite a `documentation` para la comprobación.

### Quitado
- La capa de la web (`css/site.css`, componentes Astro, figura de cubos, catálogo): sigue en `delphos-design-system` para `sitio-personal`.
- El design system propio del plugin `documentacion` (tokens, `componentes.css`, `estilo.py`): las vistas generadas usan `css/view.css`.
