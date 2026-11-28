# Destinos de un solo fichero

Qué cambia según dónde acaba la página. El esqueleto, las clases y los diagramas son siempre los mismos.

| Destino | `--target` | Fuentes | Qué lleva | Límite |
|---|---|---|---|---|
| Artifact de claude.ai | `artifact` | `google` | Sin `<!doctype>`, `<html>`, `<head>` ni `<body>` propios: el visor pone el documento. Sí lleva `<title>` y `meta[name=description]` | 16 MB |
| Artefacto de una issue de GitHub | `file` | `embed` | El documento completo | El de GitHub para artefactos |
| Fichero suelto o enlace | `file` | `embed` | El documento completo. Se abre con doble clic y sin red | Ninguno práctico |
| Adjunto de correo | `file` | `embed` | El documento completo | El del correo, a menudo 10 a 25 MB |

## Artifact de claude.ai

- La CSP solo deja cargar hojas y fuentes de `fonts.googleapis.com` y `fonts.gstatic.com`, y scripts de unos pocos CDN. Por eso `artifact` pide las tres familias (Newsreader, Hanken Grotesk, DM Mono) a Google Fonts. Si no llegan, la página cae a la pila de respaldo de cada familia.
- El `<title>` es un nombre de dos a cuatro palabras, no una frase. La frase va en `meta[name=description]` y en la descripción del Artifact.
- Sin `window.print()`, sin descargas y sin `alert()` ni `confirm()`. El conmutador de tema es el único script.
- `localStorage` puede fallar en una ventana privada o en la vista previa. El script ya lo envuelve en `try`, y la página se ve bien sin él.
- El margen lateral respeta `env(safe-area-inset-*)`, así que en un móvil con muesca el texto no queda debajo.

## Fichero, issue o correo

- Las fuentes van dentro como data URI (unos 700 KB en total). Así la página no pide nada a nadie y se ve igual sin red, en `file://` o en un visor de correo que bloquea lo remoto.
- Si el peso importa más que verse sin red, `--fonts google` deja la página en unos 25 KB. Sin red, cae a las fuentes de respaldo.
- Un enlace a otra página del repo no lleva a nada fuera de él. Si hace falta, se enlaza por su URL de GitHub.
- Para un issue: `gh issue artifact create <N> <ruta.html>`. El nombre del fichero solo lleva letras, números, puntos, guiones y guiones bajos.
