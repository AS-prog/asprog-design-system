---
name: change
description: "Lleva un cambio de la issue a la PR enseñando cómo cambia el desarrollo: la issue con su plantilla (construir o diseñar), la comparación hoy | propuesta con lo nuevo en rojo, el PNG y el artefacto de la issue, y la PR con su plantilla, y los borradores que se publican como issue. Úsala al abrir una issue o una PR, al proponer un diseño o cuando pidan «enseña el cambio», «antes y después» «la propuesta en rojo» o «publícalo»."
---

# change

Un cambio se cuenta igual de principio a fin: una **issue** que dice qué falta, una **comparación** que enseña hoy y la propuesta con la misma disposición, y una **PR** que dice qué entró y cómo se comprobó. Quien revisa entiende el cambio sin abrir el código.

Las rutas `templates/…` y `scripts/…` son relativas a la carpeta de esta skill, la que tiene este `SKILL.md` (como plugin y con APM). Si el repo ya tiene plantillas en `.github/`, mandan las del repo.

## Pasos

1. **La issue.** Si el cambio aún se discute, plantilla `templates/issues/design.md`: un apartado por tema con lo que pasa hoy, la propuesta y las preguntas abiertas. Si el alcance está cerrado, `templates/issues/build.md`: problema con su evidencia, alcance en casillas, fuera (con la issue que se lo lleva) y artefactos. Hecho cuando cada casilla del alcance se puede comprobar al cerrar y cada pregunta abierta nombra la decisión que falta.
2. **La comparación**, si el cambio mueve piezas. Cada figura sale dos veces en un `.doc-compare`: hoy a la izquierda, sin marcas; la propuesta a la derecha, con todo lo nuevo en rojo (`d-new`, `doc-new`) y borde discontinuo o el número de issue al lado. Las marcas, las medidas de las cajas y el esqueleto HTML están en [../method/reference/change-figures.md](../method/reference/change-figures.md); la página, con la skill `document`. Hecho cuando las piezas que sobreviven ocupan el mismo sitio en las dos columnas y no hay rojo en la de hoy.
3. **La página llega a GitHub.** `scripts/figure-png <página> <carpeta>/figuras/<nombre>.png` para la PR; `scripts/standalone-html` y `gh issue artifact create <N>` para la issue (gh 2.103.0 o posterior). Hecho cuando el PNG está en el mismo commit que la página y la issue tiene el artefacto al día.
4. **La PR.** Plantilla `templates/pull_request_template.md`: qué cambia (la conclusión y una viñeta por commit con su hash), cómo se comprobó (comandos y cifras reales, antes y después), avisos, cómo revisarlo y `Closes #N`. La sección de la comparación va solo si la PR toca páginas, con el PNG enlazado con `?raw=true`. La guía completa está en [../method/reference/pull-requests.md](../method/reference/pull-requests.md). Hecho cuando cada cifra salió de una ejecución de esta rama y cada sección que no aplica está quitada.
5. **Al fusionar**, las páginas que la PR toca pasan a su estado final (implementación `vigente`, diseño `aplicado`) y la propuesta de la comparación deja de serlo: la columna de la derecha pasa a ser la de hoy en la siguiente.

## Un borrador que acaba en issue

Un plan, una petición o un bug cuya fuente final es un issue nace como borrador y no queda en el repo. Las plantillas están en `templates/drafts/` (`plan.md`, `enhancement.md`, `bug.md`).

1. **Borrador.** Copia la plantilla de su tipo a `.scratch/<tema>/borrador.md` del repo destino. `.scratch/` va en su `.gitignore`. Rellena el frontmatter (`type`, `title`, `repo`, `labels`, `parent`, `status: borrador`, `date`) y el cuerpo con las secciones del issue. Hecho cuando no queda ningún `<…>` de la plantilla.
2. **Vista.** Regenera el HTML desde el `.md` cada vez que cambie, con la skill `document`, para verlo como página. El borrador se reescribe cuanto haga falta.
3. **Publicar**, solo cuando la persona lo ordena («publícalo»). El modelo puede proponerlo, pero no hacerlo por su cuenta. Se hace con `scripts/publish-draft .scratch/<tema>/borrador.md`: sin `--apply` enseña el plan (repo, título, etiquetas, padre, artefacto y los archivos que borraría) y no escribe nada en GitHub; con `--apply` crea el issue con el cuerpo sin frontmatter y sus etiquetas, lo enlaza como sub-issue de `parent` (un número, o `dueño/nombre#N` si el padre está en otro repo), sube la vista como artefacto y borra el borrador. La vista es `borrador.html`, al lado del `.md`, u otra con `--html`; antes de publicar pasa `delphos-check`. No publica si falta `title` o `repo`, si queda un `<…>` de la plantilla o si la página no pasa. Si un paso falla, se para, dice qué quedó hecho y no borra nada. Necesita `gh` con sesión (2.103.0 o posterior para el artefacto). Hecho cuando el issue tiene su texto, sus etiquetas, su padre y el artefacto.
4. **Borrar el borrador.** Lo hace `publish-draft` al terminar: se borran el `.md` y el HTML de `.scratch/<tema>/`, y en el repo no queda nada. Desde aquí la fuente es el issue. Un cambio se hace en el issue y se vuelve a subir el artefacto.

Los tickets no pasan por borrador: `to-tickets` los publica como sub-issues del plan cuando la persona aprueba el troceo.

## Lista

- [ ] La issue sigue su plantilla y su alcance se comprueba en casillas.
- [ ] Cada figura de un cambio que mueve piezas es una comparación hoy | propuesta, con el rojo solo a la derecha.
- [ ] La página pasa `delphos-check` y su PNG de `figuras/` está al día.
- [ ] La PR sigue su plantilla, con cifras reales y `Closes #N` al final.
- [ ] Un borrador se publica con `scripts/publish-draft`, solo por orden de la persona: tiene su issue con texto, etiquetas, padre y artefacto, y ya no está en `.scratch/`.
