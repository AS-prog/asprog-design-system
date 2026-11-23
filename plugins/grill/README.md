# grill

Plugin del marketplace `asprog` que adapta el método **`grill-me`** / **`grilling`** de [mattpocock/skills](https://github.com/mattpocock/skills) (licencia MIT) y le añade una **interfaz web autocontenida** construida con el sistema de diseño **Delphos**.

## Qué trae

- Skill **`grill-me`** (`skills/grill-me/SKILL.md`), autocontenida para Claude Code y APM.
- CLI y servidor local en Node.js puro (`skills/grill-me/scripts/grill.mjs`, sin dependencias externas) con actualizaciones en tiempo real por SSE y persistencia de estado temporal en `os.tmpdir()`.
- Interfaz web en un único HTML autocontenido (`skills/grill-me/assets/ui.html`), generado por `npm run build` desde `system/tokens.json`, `system/css/grill.css`, `system/js/grill-app.js` y las tipografías `latin` incrustadas en base64.
- Demo estática precargada en `docs/demo.html` (y ejecutable en vivo con `node plugins/grill/skills/grill-me/scripts/grill.mjs demo`) para comprobar la interfaz en claro, en oscuro y a 400 px sin necesidad de conectar un agente.

## Instalar

```
/plugin marketplace add AS-prog/asprog-design-system
/plugin install grill@asprog
```

## Subcomandos del CLI

```bash
node plugins/grill/skills/grill-me/scripts/grill.mjs start --title "Diseño de ..." [--context "..."] [--palette merkle] [--host 127.0.0.1] [--no-open]
node plugins/grill/skills/grill-me/scripts/grill.mjs round --session <id> --input - [--timeout 180]
node plugins/grill/skills/grill-me/scripts/grill.mjs wait --session <id> [--timeout 180]
node plugins/grill/skills/grill-me/scripts/grill.mjs status --session <id> --message "Buscando..."
node plugins/grill/skills/grill-me/scripts/grill.mjs summary --session <id> --input - [--timeout 180]
node plugins/grill/skills/grill-me/scripts/grill.mjs close --session <id>
node plugins/grill/skills/grill-me/scripts/grill.mjs demo [--palette merkle] [--no-open]
```
