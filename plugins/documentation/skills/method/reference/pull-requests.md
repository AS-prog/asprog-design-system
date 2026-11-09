# Pull requests

Cada PR enseña cómo cambia el desarrollo, no solo qué ficheros toca. Quien la revisa entiende el cambio desde la descripción y llega a la página que lo explica con un clic.

## La plantilla

Está en [`templates/pull_request_template.md`](../../../templates/pull_request_template.md). Un proyecto la copia una vez a cada repo que tenga PR:

```
cp <plugin>/templates/pull_request_template.md .github/pull_request_template.md
```

GitHub la pone en cada PR nueva. Un agente que abre la PR con una herramienta que no la lee (MCP, `gh pr create --body`) parte del fichero del repo y rellena sus secciones, en su orden. Si el repo ya tiene una plantilla propia, manda la del repo.

## Qué lleva

| Sección | Contenido |
|---|---|
| `Closes #N` | La ficha que cierra. Si no la cierra entera, `Ficha: #N` |
| Qué y por qué | La conclusión: qué cambia y qué lo pide |
| Cambios | Tabla commit → qué cambia, un commit por fila |
| Cómo cambia el desarrollo | La figura del cambio como imagen y la tabla de páginas con su estado al fusionar |
| Validación | Comandos copiables, cifras reales |
| Riesgos | Solo si hay alguno que pida acción |
| Pendiente | Cada cosa con su ficha |
| Cómo revisarlo | Por dónde empezar |
| Al fusionar | La lista que deja las páginas al día |

## Cómo se enseña el cambio

- **Un cambio grande** (varias piezas, otra forma de conectarse) enseña el diagrama de antes y el de después con la misma disposición, uno encima del otro, en la página de implementación.
- **Un cambio acotado** (una pieza nueva, sin conectar o en un solo sitio) enseña el mapa actual de la página técnica con lo nuevo marcado: relleno (`d-fill`) y la etiqueta «NUEVO» en `d-tm`. En la tinta: el verde de solución es solo para la barra lateral y las ramas.
- **Sin diagrama** (documentación, configuración) basta la tabla de páginas.

La figura va también en la PR como imagen, para verla sin salir de GitHub: una captura PNG en `figuras/` de la carpeta de la página, enlazada con `…/blob/<rama>/<ruta>.png?raw=true` (funciona en repos privados). GitHub no muestra un HTML: los enlaces a las páginas abren el código fuente, y por eso la PR dice cómo abrirlas.

## El estado de cada página

Una página fechada es `borrador` mientras su PR está abierta. La PR dice en qué estado queda cada página al fusionar, y el último commit de la rama, una vez aprobada, la deja así, para que la rama base nunca diga «PR abierta»:

| Tipo | Mientras la PR está abierta | Al fusionar |
|---|---|---|
| Implementación | `borrador: PR #N abierta` | `vigente · fusionado en <rama base> (PR #N)` y una línea en el Historial |
| Diseño | `borrador` o `propuesta` | `aplicado (PR #N)`; si se eligió una opción, cuál |
| Técnica | — | Al día con lo que entra, en la misma rama |

Una PR no se fusiona con una página que diga «PR abierta» ni con decisiones de la ficha sin marcar: o se marcan con lo decidido, o pasan a otra ficha y la PR lo dice en «Pendiente».
