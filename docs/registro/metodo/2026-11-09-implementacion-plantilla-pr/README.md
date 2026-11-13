# Implementación: plantilla de PR

Issue #3, PR #2. La página es `plantilla-pr.html`, y la figura de antes y después también está como imagen en `figuras/antes-despues.png` para enseñarla en la PR.

## Conclusión

El método `documentation` tiene una plantilla de PR (`plugins/documentation/templates/pull_request_template.md`) y una guía (`skills/method/reference/pull-requests.md`). Sigue el formato de nano-harness: qué cambia, cómo se comprobó (con cifras reales), avisos, cómo revisarlo y la issue que cierra. Si la PR toca páginas, enseña además la figura del cambio y la tabla de páginas con su estado al fusionar. Hay también dos plantillas de issue, construir y diseñar. Falta publicarla como 0.10.0 y copiarla a nano-harness.

## Qué entra en el cambio

| Ficha | Qué aporta | Commits |
|---|---|---|
| #3 | La plantilla, la guía y los enlaces desde el método, el README del plugin y el CHANGELOG | `a7296a1` |
| #3 | Este sitio y esta página, con la figura en PNG | `bf28db8` |
| #3 | El estándar para dibujar un cambio (`change-figures.md`) y el script `figure-png` | `154245b` |

## Arquitectura: antes y después

Es un cambio grande del recorrido de una ficha: las dos figuras tienen la misma disposición (issue, PR, fusión y rama base arriba; las páginas HTML debajo). Las figuras siguen `change-figures.md`: el antes sin marcas y «CAMBIA» sobre la PR y la fusión en el después.

- **Antes.** La PR es texto libre y cita las páginas como rutas, cuando las cita. Al fusionar no hay ningún paso, así que las páginas siguen en `borrador · PR abierta` y las decisiones de la issue quedan sin marcar.
- **Después.** La PR sigue la plantilla: enseña la figura del cambio y enlaza cada página con su estado al fusionar. La lista «Al fusionar» pasa la implementación a `vigente`, pone al día la técnica y marca las decisiones.

## Cómo funciona

### La plantilla

Secciones, en orden: qué cambia (la conclusión y una viñeta por commit), cómo se comprobó, cómo cambia el desarrollo (opcional, si toca páginas), avisos, cómo revisarlo y `Closes #N`. Una sección que no aplica se quita. Las issues: construir (problema, alcance, fuera, artefactos) y diseñar (temas con propuesta y preguntas abiertas, orden, referencias).

### Cómo cambia el desarrollo

Un cambio grande o propuesto enseña cada figura dos veces, lado a lado: hoy a la izquierda y la propuesta a la derecha, con lo nuevo en el rojo de propuesta y borde discontinuo (el modelo es el «Flujo de la v3» de nano-harness); uno acotado, el mapa actual con lo nuevo marcado igual. La figura va como PNG en `figuras/`, enlazada con `?raw=true`, porque GitHub no muestra HTML.

### El estado de cada página

Implementación: `borrador: PR #N abierta` mientras la PR está abierta y `vigente` al fusionar, con una línea en el Historial. Diseño: `aplicado (PR #N)`. Técnica: al día en la misma rama.

## Dónde está en el código

| Parte | Fichero |
|---|---|
| Plantilla | `asprog-design-system:plugins/documentation/templates/pull_request_template.md` |
| Guía | `asprog-design-system:plugins/documentation/skills/method/reference/pull-requests.md` |
| Enlaces | `document-types.md`, `method/SKILL.md`, `plugins/documentation/README.md` |

## Cómo se comprobó

`npm test` en verde, `delphos-check` en esta página y en la portada, y la PR #2 escrita con la propia plantilla.

## Pendiente

Publicar como 0.10.0; copiar la plantilla a nano-harness y poner al día sus páginas en borrador; decidir si entra una plantilla de issue (#3).

## Historial

- 2026-11-09: primera versión.
