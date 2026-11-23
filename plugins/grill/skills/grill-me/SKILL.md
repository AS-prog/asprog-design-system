---
name: grill-me
description: "Entrevista implacable por rondas sobre un plan, diseño o idea hasta alcanzar entendimiento compartido, con interfaz web autocontenida en Delphos y respaldo en texto."
argument-hint: plan, idea o cambio que quieres someter a entrevista
---

# grill-me

Adaptación del método `grilling` de [mattpocock/skills](https://github.com/mattpocock/skills) (MIT) con interfaz web autocontenida en el sistema de diseño Delphos.

Entrevista a la persona sin descanso hasta llegar a un **entendimiento compartido** del diseño o plan. Modela el problema como un **árbol de decisiones**: cada decisión se ramifica en las decisiones que cuelgan de ella. No ejecutes ni cambies código del plan hasta que la persona confirme explícitamente el entendimiento compartido.

## 1. Principios del método

1. **Trabaja por rondas sobre la frontera.** La **frontera** son todas las decisiones cuyos prerrequisitos ya están cerrados: preguntas que puedes hacer *ahora* sin adivinar respuestas pendientes. Pregunta toda la frontera en una sola ronda y espera las respuestas antes de la siguiente.
2. **Independencia dentro de la ronda.** Ninguna pregunta de una ronda puede depender de la respuesta a otra pregunta abierta en la misma ronda; si depende, pertenece a una ronda posterior.
3. **Recomendación aceptable con «sí».** Cada pregunta lleva una recomendación concreta y está redactada de modo que responder «sí» acepte tu recomendación.
4. **Los hechos se investigan; no se preguntan.** Cuando una decisión necesite un dato del repositorio, archivos, configuración o herramientas, búscalo tú (o delega una búsqueda en un subagente con contexto limpio) antes de preguntar. Si una investigación en segundo plano bloquea una rama, lanza las preguntas de las demás ramas ahora y deja la rama bloqueada para la siguiente ronda.
5. **Sin escritura de documentos del proyecto.** Esta skill solo conduce la entrevista hasta confirmar el entendimiento compartido; no crea ADRs ni modifica el repo durante la sesión.
6. **Cierre explícito.** La entrevista termina cuando la frontera queda vacía (ninguna rama importante asumida en silencio) y la persona confirma el resumen de entendimiento compartido.

## 2. Cuándo usar la interfaz web vs texto

- **Por defecto: interfaz web local** mediante `scripts/grill.mjs` (en la misma carpeta que esta skill), siempre que dispongas de terminal local con Node >= 18.
- **Degradación elegante a texto**: usa el formato clásico en el chat si la persona pide «en texto» / «en el chat», o si el entorno no puede arrancar el servidor o abrir/alcanzar la URL local (por ejemplo, una sesión puramente remota sin navegador).

### Formato clásico de respaldo en texto

```markdown
❓ **Q1** - **<título>**: <cuerpo de la pregunta, con opciones si aplica>

➡️ <recomendación aceptable con «sí»>

---

❓ **Q2** - **<título>**: <cuerpo>

➡️ <recomendación>
```

## 3. Flujo con la interfaz web

Ubica el script relativo a esta skill: `scripts/grill.mjs`.

### Paso 1 · Iniciar la sesión

```bash
node scripts/grill.mjs start --title "<título corto>" --context "<resumen en 1-2 frases>"
```

Opciones útiles:
- `--palette <id>`: aplica una paleta de marca de Delphos (por ejemplo `merkle`).
- `--no-open`: no abre el navegador automáticamente (útil si vas a abrir la URL en el panel de preview o en otro dispositivo).
- `--host 0.0.0.0`: escucha en todas las interfaces cuando la persona entra desde otro dispositivo en la red/Tailscale (la URL siempre exige el token secreto).

Guarda `sessionId` y `url` del JSON devuelto y comparte brevemente la URL en el chat por si la persona quiere abrirla manualmente.

### Paso 2 · Informar mientras investigas (opcional)

Si antes de la primera ronda o entre rondas necesitas leer archivos o investigar el repo, actualiza el estado visible en la pestaña:

```bash
node scripts/grill.mjs status --session <sessionId> --message "Revisando scripts/build.mjs y tokens.json…"
```

### Paso 3 · Publicar una ronda y esperar respuestas

Envía el JSON de la ronda por entrada estándar (`--input -`). El comando publica la ronda por SSE en la misma pestaña y bloquea hasta recibir respuestas o agotar `--timeout` (por defecto 180 s):

```bash
node scripts/grill.mjs round --session <sessionId> --input - <<'EOF'
{
  "round": 1,
  "title": "Arquitectura y alcance",
  "intro": "Resumen breve en **Markdown** de qué cubre esta ronda.",
  "tree": [
    {
      "id": "root",
      "label": "Tema principal",
      "status": "frontier",
      "children": [
        { "id": "Q1", "label": "Transporte", "status": "frontier", "round": 1 },
        { "id": "Q2", "label": "Empaquetado", "status": "frontier", "round": 1 },
        { "id": "detalles", "label": "Detalles de interacción", "status": "pending" }
      ]
    }
  ],
  "questions": [
    {
      "id": "Q1",
      "branch": "Transporte",
      "title": "Cómo se comunica la interfaz con el agente",
      "body": "Texto en **Markdown** (admite listas, código, citas y tablas).\n\n¿Usamos un servidor local efímero de sesión continua?",
      "recommendation": "Sí, servidor local efímero de sesión continua con botón de respaldo para copiar en Markdown.",
      "options": [
        { "id": "A", "label": "Servidor local efímero", "description": "Mantiene la pestaña viva entre rondas.", "recommended": true },
        { "id": "B", "label": "HTML estático", "description": "Requiere copiar y pegar cada ronda." }
      ],
      "multiSelect": false
    }
  ]
}
EOF
```

Notas del esquema:
- `tree`: actualiza el árbol en el panel lateral. Cada nodo admite `id`, `label`, `status` (`"settled"` | `"frontier"` | `"pending"`), `round` (opcional), `decision` (resumen corto cuando está resuelta) y `children`.
- `options`: opcional; úsalo cuando haya alternativas claras. Marca `"recommended": true` en la opción recomendada para sincronizarla con el botón «Sí, aceptar recomendación».
- Si el comando sale con **código 2** (`"status": "pending"`), el usuario sigue pensando y su borrador sigue intacto en el navegador: vuelve a esperar con:

```bash
node scripts/grill.mjs wait --session <sessionId> --timeout 180
```

- Cuando devuelve `"status": "answered"`, revisa:
  - `answers`: respuestas por `id` (`mode`: `accept`, `option`, `custom` o `defer`, más `selectedOptions`, `note` y `summary`). Si una pregunta vuelve en `defer`, investiga lo pedido o posponla a una ronda posterior.
  - `revisions`: cambios propuestos por la persona sobre decisiones cerradas en rondas anteriores; reevalúa las ramas afectadas antes de calcular la nueva frontera.
  - `generalNote`: contexto transversal añadido a la ronda.
- Si devuelve `"status": "cancelled"`, cierra el servidor con `close` y detén la entrevista.

### Paso 4 · Confirmación final del entendimiento compartido

Cuando la frontera quede vacía, publica el resumen final con `summary`:

```bash
node scripts/grill.mjs summary --session <sessionId> --input - <<'EOF'
{
  "title": "Entendimiento compartido",
  "summary": "Síntesis clara en **Markdown** de todo lo acordado.",
  "tree": [ ... ],
  "decisions": [
    { "id": "Q1", "title": "Transporte", "decision": "Servidor local efímero de sesión continua." }
  ]
}
EOF
```

- Si devuelve `"status": "confirmed"`, cierra la sesión con `close`, resume brevemente en el chat y queda listo para ejecutar según lo acordado.
- Si devuelve `"status": "adjust"`, revisa `comment` y `revisions` y publica una nueva ronda con `round`.

### Paso 5 · Cerrar la sesión

Siempre detén el servidor al terminar o cancelar:

```bash
node scripts/grill.mjs close --session <sessionId>
```
