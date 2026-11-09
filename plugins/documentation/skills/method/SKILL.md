---
name: method
description: El método de documentación de los proyectos: dónde va cada documento (diseño en dos niveles, decisiones, entradas, registro fechado, páginas técnicas vivas, fichas), qué tipo es, qué secciones lleva, con qué voz se escribe y cómo se mantiene alineado con el código. Úsala al escribir o colocar cualquier documento, al montar el repo de gestión de un proyecto nuevo o cuando pregunten «¿dónde va esto?» o «¿qué lleva esta página?».
---

# method

Cada proyecto se documenta igual: un **repo de gestión** con el diseño, las decisiones y las fichas, y uno o más **repos de código** que lo implementan. Lo propio de cada proyecto (sus nombres, sus repos, su servicio, su glosario) vive en el `AGENTS.md` de su repo de gestión y manda sobre esta skill donde la concrete.

## Pasos

1. **Busca antes de crear.** Mira `diseno/`, `decisiones/`, `registro/`, `tecnica/` y `.scratch/`. Si un documento ya cubre el tema, amplíalo; si es fechado, añade una nota fechada al final. Hecho cuando puedes nombrar el documento que amplías o afirmar que no hay ninguno.
2. **Elige el tipo** en [reference/document-types.md](reference/document-types.md). El tipo fija la carpeta, el nombre, si es vivo o fechado y sus secciones.
3. **Escribe el `.md`** con las secciones del tipo, en su orden, y la voz de [reference/voice.md](reference/voice.md). El `.md` es siempre la fuente.
4. **Si el tipo lleva página HTML**, hazla con la skill `document` y llévala al sitio con la skill `site`. Las páginas de implementación y las técnicas tienen guía propia: [reference/implementation-pages.md](reference/implementation-pages.md) y [reference/technical-pages.md](reference/technical-pages.md).
5. **Si el cambio toca código**, cumple [reference/alignment.md](reference/alignment.md): el diseño y el código van en ramas con el mismo nombre, y cada commit de código tiene su reflejo en el diseño. La PR sigue [reference/pull-requests.md](reference/pull-requests.md): enseña cómo cambia el desarrollo y enlaza sus páginas.
6. **Revisa** con la lista final.

## Dónde va cada cosa

La estructura entera, con el `AGENTS.md` de partida, está en [reference/folders.md](reference/folders.md). En corto:

| Qué | Dónde | Vivo o fechado |
|---|---|---|
| Diseño: qué y por qué (general, sin nombres del caso) | `diseno/nivel-1/` | Vivo |
| Diseño: cómo, en este caso concreto | `diseno/nivel-2/`, mismas pestañas que el nivel 1 | Vivo |
| Decisiones | `decisiones/registro.md` y un ADR por decisión cerrada (`Dnn-slug.md`) | El ADR no se reescribe |
| Lo que llega (correos, hojas, respuestas) | `entradas/<AAAA-MM-DD>-<origen>/` con `asimilacion.md` | Fechado |
| Análisis, calidad, cambios, research, diseño e implementación de una ficha | `registro/<tema>/<AAAA-MM-DD>-<tipo>-<objeto>/` | Fechado |
| Cómo funciona hoy cada componente | `tecnica/<componente>/` | Vivo |
| El método del proyecto | `metodo/` | Vivo |
| Fichas, specs, mapas e incidencias | `.scratch/<área>/<tema>/` | Estado en la ficha |
| Glosario | `GLOSSARY.md` en la raíz del repo de código | Vivo |

## Reglas que no cambian de un proyecto a otro

- **El `.md` es la fuente.** Una página HTML, un Claude Doc o una vista generada son vistas que se regeneran desde él.
- **Lo fechado no se reescribe.** Un documento de `registro/` o `entradas/` se corrige con una nota fechada al final. Mientras su cambio no está integrado es un borrador y sí se reescribe.
- **Lo vivo se mantiene al día.** Una página técnica desfasada se corrige con un cambio propio, no con una nota.
- **El diseño manda.** Si el código contradice `diseno/` o `decisiones/`, se dice: o se corrige el código, o se abre una ficha para cambiar el diseño.
- **Solo se citan hashes publicados.** `<repo>@hash` o `<repo>:<ruta>`; tras un rebase, el hash nuevo.
- **Cada cambio es un ensayo.** Se enseña el diff o el plan y se pide confirmación antes del commit.

## Lista final

- [ ] No duplica un documento existente (paso 1).
- [ ] Carpeta, nombre y secciones del tipo; ficha técnica (`doc-meta`) si es fechado.
- [ ] Voz: conclusión primero, cifras reales o marcadas con `≈`, comandos copiables.
- [ ] Si lleva página: pasa `delphos-check`, está en el mapa del sitio y se ve bien en claro y en oscuro.
- [ ] Si toca código: el diseño tiene su reflejo en la misma rama.
- [ ] Si abre una PR: sigue la plantilla, enlaza sus páginas y dice en qué estado quedan al fusionar.
