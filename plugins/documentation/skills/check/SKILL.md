---
name: check
description: Revisa una página HTML del sistema de diseño (o un fragmento de diagrama) contra sus reglas antes de entregarla. Úsala cuando pidan «revisa este html», «¿cumple el sistema?» o al terminar una página hecha con la skill document.
argument-hint: ruta/al/documento.html
---

# check

Es el mismo trabajo que hace el hook de este plugin cada vez que Claude escribe un `.html`; esta skill sirve para pedirlo a mano y como respaldo donde no hay hook (el chat de claude.ai).

1. Si puedes ejecutar comandos: `node ${CLAUDE_PLUGIN_ROOT}/scripts/delphos-check <ruta> …`. Sale con 0 si cumple y con 2 si no; cada fallo lleva línea, número de regla y qué corregir. Corrige y repite hasta que salga limpio.
2. Si no puedes ejecutar nada, lee [rules.md](rules.md) y aplica las nueve reglas una a una, citando línea y regla.
3. Informa en una lista corta: regla, línea y arreglo. Si todo cumple, dilo en una frase.

No corrijas saltándote la regla: un color a mano no se tapa con otro color, se usa la clase o el token que ya existe. Si de verdad falta, se añade al sistema, no a la página.
