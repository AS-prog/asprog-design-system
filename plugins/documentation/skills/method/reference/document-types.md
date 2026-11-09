# Los tipos de documento

Un solo catálogo para todos los proyectos. El tipo fija la carpeta, el nombre, si el documento es vivo o fechado, si lleva página HTML y sus secciones, en ese orden. Una sección que no aplica se quita; no se deja vacía.

## Fechados: `registro/<tema>/<AAAA-MM-DD>-<tipo>-<objeto>/`

La carpeta lleva el `README.md` (la fuente), la página `<objeto>.html` si el tipo la tiene y `figuras/` si hace falta. `<tema>` es el de la ficha; `<objeto>`, lo tratado en kebab-case.

| Tipo | Para qué | Página | Secciones |
|---|---|---|---|
| `implementacion` | Qué hizo una ficha (o un PR) y cómo se comprobó | Sí, plantilla `implementation` | conclusión · qué entra · arquitectura · cómo funciona · dónde está en el código · cómo se comprobó · pendiente · historial |
| `diseno` | La propuesta de una ficha de diseño antes de construir | Sí, plantilla `design` | conclusión · contexto · propuesta · alternativas · decisiones · pendiente |
| `analisis` | Una pregunta sobre datos, código o un sistema, con su respuesta | Si lleva figuras, tablas grandes o se enseña a negocio | resumen ejecutivo · detalle · siguientes pasos · reproducción |
| `calidad` | Conteos y cotejos de una carga o una capa | No | resumen · conteos y cotejos (tabla) · reproducción |
| `cambios` | Un cambio de datos o de configuración fuera de una ficha | No | qué cambió (antes / después) · validación · reproducción |
| `research` | Lo que dicen las fuentes primarias sobre una pregunta (`/research`) | No | pregunta · fuentes · hallazgos · qué cambia para el proyecto |
| `historia` | Cómo se desarrolló un componente: el recorrido de sus fichas | Sí, plantilla `document` | conclusión · recorrido · qué se aprendió |

Todos llevan arriba la ficha técnica: fecha, estado (`borrador` mientras su cambio no está integrado, `vigente` después), fichas, código (`<repo>@hash`) y decisiones (`Dnn`).

## Vivos

| Tipo | Dónde | Página | Qué lleva |
|---|---|---|---|
| Diseño | `diseno/nivel-1/`, `diseno/nivel-2/`, un `.md` por pestaña | Vista aparte (Claude Docs, sitio) | Nivel 1: qué y por qué. Nivel 2: cómo funciona hoy en el caso, diferencias con el nivel 1, preguntas abiertas, evidencia |
| Decisión | `decisiones/registro.md`; ADR `decisiones/Dnn-<slug>.md` | No | ADR: contexto · decisión · consecuencias · alternativas |
| Técnica | `tecnica/<componente>/` | Sí, plantilla `technical` | [technical-pages.md](technical-pages.md) |
| Método | `metodo/` | Sí | El ciclo de una ficha en este proyecto y lo que concreta del método común |
| Guía | `docs/` o `metodo/`, sin fecha | Sí, plantilla `document` | Cómo hacer algo, en pasos numerados |
| Glosario | `GLOSSARY.md` del repo de código; copia en `diseno/nivel-1/1-glossary.md` | No | Un término por entrada, con lo que se evita decir |

## De entrada y de salida

| Tipo | Dónde | Qué lleva |
|---|---|---|
| Entrada | `entradas/<AAAA-MM-DD>-<origen>/` | El material tal cual llegó y `asimilacion.md`: qué cambió en `diseno/` o `decisiones/` por él |
| Incidencia | `.scratch/<área>/incidencias/issues/INNNN-<slug>.md` | síntoma · causa · resolución · cómo evitarla |
| Entrega | Donde pida el destinatario, autocontenida (skill `document`, entrega suelta) | resumen para negocio · cifras · detalle · nota de método |
| Descripción de un PR | `.github/pull_request_template.md` del repo, copiada de `templates/pull_request_template.md` ([pull-requests.md](pull-requests.md)) | qué y por qué · cambios · cómo cambia el desarrollo · validación · riesgos · pendiente · cómo revisarlo · al fusionar |

## Lo que generan otras skills

Las specs (`/to-spec`), los tickets (`/to-tickets`, `/wayfinder`, con su `map.md`) y el resto de lo que generan las skills de ingeniería van en `.scratch/<área>/<tema>/` con su propio formato, porque los tableros los leen. Este método les aporta la voz y, si van en HTML, el estilo.
