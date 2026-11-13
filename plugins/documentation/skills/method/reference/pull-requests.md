# Pull requests

Cada PR enseña cómo cambia el desarrollo, no solo qué ficheros toca. Quien la revisa entiende el cambio desde la descripción y llega a la página que lo explica con un clic.

## Las plantillas

Siguen el formato que se asentó en nano-harness: corto, con la conclusión primero y cifras reales. Están en `templates/`:

| Fichero | Se copia a | Para |
|---|---|---|
| [`pull_request_template.md`](../../../templates/pull_request_template.md) | `.github/pull_request_template.md` | Cada PR |
| [`issues/build.md`](../../../templates/issues/build.md) | `.github/ISSUE_TEMPLATE/build.md` | Una issue con alcance cerrado, lista para construir |
| [`issues/design.md`](../../../templates/issues/design.md) | `.github/ISSUE_TEMPLATE/design.md` | Una issue para pensar antes de construir |

```
cp <plugin>/templates/pull_request_template.md .github/pull_request_template.md
mkdir -p .github/ISSUE_TEMPLATE && cp <plugin>/templates/issues/*.md .github/ISSUE_TEMPLATE/
```

GitHub las ofrece al abrir una PR o una issue. Un agente que las abre con una herramienta que no las lee (MCP, `gh pr create --body`) parte del fichero del repo y rellena sus secciones, en su orden. Si el repo ya tiene plantillas propias, mandan las del repo. Una sección que no aplica se quita; no se deja vacía.

## Qué lleva la PR

| Sección | Contenido |
|---|---|
| Qué cambia | Una o dos frases con la conclusión y lo que lo pide; después, una viñeta por commit o por pieza, con el nombre en negrita y el hash |
| Cómo se comprobó | Comandos copiables y cifras reales: pruebas antes y después, aceptaciones, la ejecución con su tiempo. Si hay varias tareas, una tabla |
| Cómo cambia el desarrollo | Opcional, solo si toca páginas del registro: la figura como imagen y la tabla de páginas con su estado al fusionar |
| Avisos | Choques con otras PR, lo que no se toca y por qué, avisos de `delphos-check` |
| Cómo revisarlo | Por dónde empezar |
| `Closes #N` | Al final. Si no la cierra entera, `refs #N` y lo que falta |

## Qué lleva la issue

- **Construir**: Problema (con la evidencia, sin la solución) · Alcance (una casilla por pieza, y una prueba que lo fija) · Fuera (con la issue que se lo lleva) · Artefactos (documentos e issues relacionadas).
- **Diseñar**: de dónde sale · un apartado numerado por tema, con lo que pasa hoy, la propuesta a discutir y las preguntas abiertas · Orden que sugiere · Referencias.

## Cómo se enseña el cambio

El estándar completo, con las marcas, el texto que cabe en cada caja y la exportación a PNG, está en [change-figures.md](change-figures.md). En corto:

- **Un cambio grande** (varias piezas, otra forma de conectarse) enseña el diagrama de antes y el de después con la misma disposición, uno encima del otro, en la página de implementación.
- **Un cambio acotado** (una pieza nueva, sin conectar o en un solo sitio) enseña el mapa actual de la página técnica con lo nuevo marcado: relleno (`d-fill`) y la etiqueta «NUEVO» en `d-tm`. En la tinta: el verde de solución es solo para la barra lateral y las ramas.
- **Sin diagrama** (documentación, configuración) basta la tabla de páginas.

Si la PR toca páginas, la figura va también en ella como imagen, para verla sin salir de GitHub: un PNG en `figuras/` de la carpeta de la página, hecho con `scripts/figure-png`, enlazado con `…/blob/<rama>/<ruta>.png?raw=true` (funciona en repos privados). Un enlace a un `.html` del repo abre su código fuente; por eso la página llega como artefacto de la issue (abajo) y la PR lo enlaza.

## La página como artefacto de la issue

GitHub muestra un HTML como **artefacto de una issue** (`gh issue artifact`, gh 2.103.0 o posterior; en vista previa desde octubre de 2026): se ve renderizado, con su historial de versiones. Los artefactos cuelgan de la issue, no de la PR, así que la PR enlaza la issue que cierra y su artefacto.

```bash
node <plugin>/scripts/standalone-html <página.html> /tmp/<objeto>.html   # un solo HTML, sin barra lateral
gh issue artifact create <N> /tmp/<objeto>.html                          # la primera vez
gh issue artifact list <N>                                               # su número y su URL
gh issue artifact edit <N> <número> --body-file /tmp/<objeto>.html       # cada vez que cambia la página
```

- `standalone-html` mete las hojas, las fuentes y las imágenes en la página y quita la barra lateral y los scripts externos: el artefacto se lee solo.
- El nombre del fichero es el del artefacto: letras, números, puntos, guiones y guiones bajos.
- El artefacto es una vista: la fuente sigue siendo la página del repo, y no se commitea.
- Al fusionar, el artefacto se vuelve a subir con la página en `vigente`.
- Si el repo no tiene artefactos (no está en la vista previa o gh es anterior), la PR enlaza la página en la rama, como hasta ahora.

## El estado de cada página

Solo para las PR que tocan páginas del registro. Una página fechada es `borrador` mientras su PR está abierta. La PR dice en qué estado queda cada página al fusionar, y el último commit de la rama, una vez aprobada, la deja así, para que la rama base nunca diga «PR abierta»:

| Tipo | Mientras la PR está abierta | Al fusionar |
|---|---|---|
| Implementación | `borrador: PR #N abierta` | `vigente · fusionado en <rama base> (PR #N)` y una línea en el Historial |
| Diseño | `borrador` o `propuesta` | `aplicado (PR #N)`; si se eligió una opción, cuál |
| Técnica | — | Al día con lo que entra, en la misma rama |

Una PR no se fusiona con una página que diga «PR abierta» ni con decisiones de la ficha sin marcar: o se marcan con lo decidido, o pasan a otra ficha y la PR lo dice en «Pendiente».
