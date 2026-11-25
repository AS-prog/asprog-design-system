# Etiquetas

Cada issue lleva una etiqueta de tipo y, como mucho, una de estado. Los nombres son los que usa el código (`issue_intake.py`, `issue_launch.py`).

## Tipo

| Etiqueta | Quién la pone |
|---|---|
| `plan` | `to-spec`, al publicar un plan |
| `enhancement` | Quien publica una petición a demanda |
| `bug` | Quien publica un bug. Sin «Tipo de tarea», su ticket es `fix` |

## Estado: triage

| Papel | Etiqueta | Quién la pone |
|---|---|---|
| Por triar | `needs-triage` | Al publicar una petición o un bug |
| Falta información | `needs-info` | Triage. Vuelve a `needs-triage` con la respuesta |
| Listo para el taller | `ready-for-agent` | Triage, solo en tickets y solo si pasan `nano-harness tickets --repo AS-prog/asprog-design-system --issue N`. Es la frontera entre la dirección y el taller. Un plan nunca la lleva |
| Para una persona | `ready-for-human` | Triage, o el taller cuando una tarea falla |
| No se hará | `wontfix` | Triage |

## Estado: taller

| Etiqueta | Quién la pone |
|---|---|
| `orq:running` | El lote, al reclamar el ticket (quita `ready-for-agent`) |
| `orq:review` | El taller, si la tarea pasa: PR con «Closes #n» |
| `orq:failed` | El taller, si la tarea falla, junto a `ready-for-human` |

Si una tarea se salta porque falló el ticket que la bloquea, el taller le devuelve `ready-for-agent`.

Un plan no lleva etiqueta de estado: está troceado si tiene sub-issues y hecho si está cerrado.
