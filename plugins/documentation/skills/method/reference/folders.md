# La estructura de un proyecto

## Los repos

| Repo | Qué tiene | Quién escribe |
|---|---|---|
| `<proyecto>-management` | Diseño, decisiones, entradas, registro, páginas técnicas, método, fichas de todos los tableros y el sitio | Es la fuente de verdad |
| `<proyecto>-<componente>` (uno o más) | Código, tests, configuración y `GLOSSARY.md` | Implementa lo que dice el diseño |

- **Solo el repo de gestión tiene registro documental.** El de código no tiene `.scratch/` de fichas: un agente que trabaja allí reclama y resuelve su ficha en el de gestión.
- **El código no depende del repo de gestión.** Ningún test ni herramienta del código lee esa carpeta; los agentes sí.
- **Un tablero por área**, todos en el repo de gestión: `diseno` y uno por repo de código, cada uno con sus incidencias. Una ficha que depende de otra de otro tablero lo dice con `Blocked by: <tablero>:<tema>/<NN>`.

## El repo de gestión

```text
<proyecto>-management/
├── AGENTS.md                 las reglas de este proyecto (plantilla abajo)
├── README.md
├── index.html                la portada del sitio, generada
├── diseno/
│   ├── README.md             cómo se publican las vistas del diseño
│   ├── nivel-1/              qué y por qué: 0-readme.md, 1-glossary.md, 2-…
│   └── nivel-2/              cómo, en este caso: las mismas pestañas
├── decisiones/
│   ├── registro.md           todas las decisiones, abiertas y cerradas
│   └── Dnn-<slug>.md         un ADR por decisión cerrada
├── entradas/<AAAA-MM-DD>-<origen>/
├── registro/<tema>/<AAAA-MM-DD>-<tipo>-<objeto>/
├── tecnica/<componente>/
├── metodo/
├── docs/
│   ├── agents/               issue-tracker.md, triage-labels.md, domain.md
│   ├── design-system/vX.Y/   la copia del sistema (site.py vendor)
│   └── site/                 site.toml y home.md
└── .scratch/<área>/<tema>/   fichas, specs, mapas; .scratch/<área>/incidencias/
```

- **Los dos niveles del diseño tienen las mismas pestañas**, con la misma numeración. El nivel 1 no nombra servidores, tablas, ficheros ni commits del caso; el nivel 2 sí, con su evidencia (`<repo>:<ruta>:<línea>`).
- **Las decisiones** llevan un id único `Dnn` en `registro.md`. Mientras están abiertas solo viven allí; al cerrarse, tienen ADR. Una decisión difícil de deshacer siempre tiene ADR.
- **Las entradas** se guardan tal cual llegan, con una `asimilacion.md` que dice qué cambió en `diseno/` o `decisiones/` por ellas.

## AGENTS.md de partida

```markdown
# AGENTS.md

## Rol

Este repo (`<proyecto>-management`) es el punto de diseño y gestión de <proyecto> y la fuente de verdad de `<proyecto>-<componente>`. Aquí se decide qué se construye y por qué.

## Dónde escribe cada agente

| Qué | Dónde | Repo |
|---|---|---|
| Diseño de nivel 1 y nivel 2 | `diseno/nivel-1/`, `diseno/nivel-2/` | management |
| Decisiones y ADR | `decisiones/` | management |
| Lo que llega | `entradas/<AAAA-MM-DD>-<origen>/` | management |
| Documentos fechados | `registro/<tema>/<AAAA-MM-DD>-<tipo>-<objeto>/` | management |
| Páginas técnicas vivas | `tecnica/<componente>/` | management |
| Fichas e incidencias | `.scratch/<área>/<tema>/` | management |
| Código, tests, configuración y glosario | raíz | `<proyecto>-<componente>` |

## Cómo trabajas

- Idioma: español. Código en inglés, comentarios en español, logs en inglés.
- El método es el del plugin `documentation` (skill `method`). Lo de aquí manda donde lo concrete.
- Servicio: <dónde se despliega>. Entorno de pruebas: <cuál>. Nunca se prueba en producción.
- Remoto: <GitHub | Azure DevOps>. Ramas: `main`, `develop`, `feature/<nombre>` (skill `method`, alignment.md).
- Cada cambio es un ensayo: diff o plan, y confirmación antes del commit.
```
