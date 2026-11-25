# Issue tracker: GitHub

Los issues de este repo están en GitHub Issues, en `AS-prog/asprog-design-system`. Son la fuente documental de la dirección: un plan, una petición o un bug nace como borrador en `.scratch/<tema>/`, que git ignora, y al publicarlo la fuente pasa a ser el issue.

## Tipos de issue

| Tipo | Etiqueta | Qué es |
|---|---|---|
| Plan | `plan` | El issue padre con el spec. Se trocea en tickets, que son sus sub-issues. **Nunca lleva `ready-for-agent`** y nunca se ejecuta |
| A demanda | `enhancement` | Una petición suelta. Triage la lleva a ticket, o a plan si es grande |
| Bug | `bug` | Un fallo. Su ticket lleva la prueba de regresión en «Pruebas», con el prefijo `rojo:` |

## Tickets

Un ticket es una tarea del lote. Usa el formulario de [`.github/ISSUE_TEMPLATE/ticket.yml`](../../.github/ISSUE_TEMPLATE/ticket.yml), con cinco secciones: Qué construir, Criterios de aceptación, Tipo de tarea, Archivos que puede tocar y Pruebas. `to-tickets` los escribe como sub-issues del plan cuando se aprueba el troceo.

- Los bloqueos entre tickets son **bloqueos nativos de GitHub** («Blocked by»), no texto en el cuerpo. `issue_intake` los convierte en `depends_on`.
- Un ticket solo lleva `ready-for-agent` si pasa la comprobación de la frontera: `nano-harness tickets --repo AS-prog/asprog-design-system --issue N` sale con 0.
- Antes de lanzar, `nano-harness tickets --repo AS-prog/asprog-design-system` enseña en seco qué tickets entrarían en un lote.

## Órdenes

- Leer: `gh issue view N --repo AS-prog/asprog-design-system --json number,title,body,labels`.
- Crear: `gh issue create --repo AS-prog/asprog-design-system --title T --body-file F --label L`.
- Etiquetas: [triage-labels.md](triage-labels.md).
