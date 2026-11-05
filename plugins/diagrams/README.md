# Plugin diagrams

Los 45 tipos de diagrama de [diagram-design](https://github.com/cathrynlavery/diagram-design) (MIT, Cathryn Lavery) con la identidad visual Delphos. Este es el código canónico: vive aquí, no es una copia de otro repo.

| Ruta | Qué es |
|---|---|
| `.claude-plugin/plugin.json` | El manifiesto. |
| `skills/diagram/SKILL.md` | La skill: qué cargar, el flujo, las reglas de conectores, el presupuesto y la lista de comprobación. Escrita aquí, en español. |
| `skills/diagram/references/style-guide.md` | El contrato Delphos: las clases `.d-*`, la traducción desde los términos de upstream, los marcadores. Escrito aquí. |
| `skills/diagram/references/output-spec.md` | La forma de la salida (un `figure.figwrap` con SVG en línea), dónde se pega y cómo se comprueba. Escrito aquí. |
| `skills/diagram/references/types.md` | La tabla de los 45 tipos. **Generado.** |
| `skills/diagram/references/type-*.md` (45) y `primitives-core.md`, `layout-budget.md`, `semantic-patterns.md`, `primitive-annotation.md` | Las referencias de upstream traducidas al contrato. **Generadas**: la prosa queda en inglés; los fragmentos SVG llevan clases en vez de `fill`/`stroke`/`font-*`; fuera las secciones de color, iconos, modo oscuro y ejemplos. |
| `skills/diagram/examples/` | Siete fragmentos de salida (flujo, secuencia, estados, arquitectura, línea de tiempo, barras, mapa de calor) que pasan `delphos-check`. |
| `docs/examples/` | Los siete renderizados a PNG en claro y oscuro, con un README que los muestra. |
| `LICENSE-diagram-design` | La licencia MIT de upstream, que las referencias conservan. **Generado.** |

Lo que la skill necesita del sistema de diseño son solo las clases `.d-*` de `system/css/base.css` de este repo (`asprog-design-system`); ningún valor de color o tamaño se escribe en el diagrama. Si un tipo pide una clase que no existe, se añade allí y se publica antes de usarla aquí. Para revisar un fragmento se usa `delphos-check`, del plugin `documentation`.

## Instalar

```
/plugin marketplace add AS-prog/asprog-design-system
/plugin install diagrams@asprog
```

O desde claude.ai, en el catálogo del marketplace. Funciona solo; `documentation` aporta además el hook que revisa cada fragmento guardado como `.html`.

## Refrescar desde upstream

> [!IMPORTANT]
> Pendiente. Los scripts que traducen upstream (`vendor-diagram-design.mjs`, `diagram-design-adapt.mjs`) y `plugins/sources.json` siguen en `AS-prog/delphos-inc` y aún no se han traído a este repo. Hasta entonces, las referencias generadas (`references/type-*.md` y compañía) no se tocan a mano: se refrescan allí y se copian aquí.

Qué se descarta de upstream y por qué está en `plugins/sources.json` de `delphos-inc` (`dropped`): estilo y perfiles (los sustituye el contrato), tamaños y exportación (la salida es un fragmento), animación, importadores, iconos, terminal y mano alzada.
