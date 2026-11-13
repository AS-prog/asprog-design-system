# Cómo se dibuja un cambio

Las figuras que enseñan cómo cambia el desarrollo se dibujan siempre igual, para que quien revisa una página o una PR lea cualquier cambio sin aprender un dibujo nuevo. Las dibuja la skill `diagram` (plugin `diagrams`) con las clases `.d-*`. Esta guía fija lo que es propio de un cambio: qué forma se elige, cómo se marca lo que cambia, cuánto texto cabe y cómo llega la figura a la PR.

## Qué forma

| El cambio | Forma | Dónde |
|---|---|---|
| Grande o propuesto: varias piezas, otra forma de conectarse, o un diseño aún sin decidir | **Hoy y propuesta, lado a lado**: la misma figura dos veces, con la misma disposición | Página de diseño o de implementación, una comparación por figura |
| Acotado: una pieza nueva o una que cambia en un solo sitio | **Lo nuevo marcado** sobre el mapa actual de la página técnica, con las mismas marcas | Página de implementación, sección «Arquitectura» |
| Sin piezas que se muevan: valores, configuración, textos | **Tabla** con las filas nuevas marcadas; sin figura | Página de implementación o PR |
| Una migración con muchas piezas que aparecen, se van y se reconectan | Tipo **architecture delta** de la skill `diagram`, con su registro de cambios | Página de diseño o de implementación |

El modelo es el «Flujo de la v3» de nano-harness (`docs/registro/arquitectura/2026-11-13-diseno-alta-repos/flujo-v3.html`): cada diagrama sale dos veces, la v3 de hoy a la izquierda y lo que propone el issue a la derecha.

## Hoy y propuesta

```html
<figure class="figwrap">
  <div class="doc-compare">
    <div class="doc-compare-col"><p class="doc-compare-label">v3 hoy</p><svg>…</svg></div>
    <div class="doc-compare-col"><p class="doc-compare-label doc-new">Con el #60 (propuesta)</p><svg>…</svg></div>
  </div>
  <figcaption>… <span class="doc-new">A la derecha, en rojo y discontinuo, los pasos que añade el #60.</span></figcaption>
</figure>
```

1. **Dibuja primero la propuesta**, y copia sus coordenadas a la de hoy. Las piezas que sobreviven ocupan el mismo sitio en las dos; si la propuesta añade pasos, la de hoy se queda con su altura y sus piezas en el mismo orden.
2. **`.doc-compare`** pone las dos columnas lado a lado desde 62.5rem, fuera del ancho del documento (hasta `--compare-width`, 1400 px), y las apila en estrecho. Cada columna lleva su etiqueta (`.doc-compare-label`): la de hoy dice qué versión es («v3 hoy»); la de la propuesta, de qué issue sale, en `doc-new`.
3. **La de hoy va sin marcas.** Todas las marcas van en la columna de la propuesta.
4. **Ids con prefijo propio** en cada figura (`<slug>-hoy-…`, `<slug>-60-…`), también en los marcadores de flecha. La propuesta lleva un segundo marcador con `class="d-new"` para sus flechas rojas.
5. **El pie dice cómo se lee**: qué es lo de la derecha y qué significa el rojo, en un `<span class="doc-new">`.

## Las marcas

Lo nuevo va en el rojo de propuesta (`--proposal`, clase `d-new` en el SVG y `doc-new` en el HTML). El rojo nunca va solo: lo acompaña el borde discontinuo o el número de issue, para que se lea también en blanco y negro.

| Marca | Cómo |
|---|---|
| **Pieza nueva** | `<g class="d-new">` con la caja en `d-fill` y `stroke-dasharray="5 4"`, y su texto dentro |
| **Flecha nueva** | `d-line d-new` con el marcador rojo |
| **Cambia una pieza que ya existe** | La caja sigue en la tinta; debajo de su detalle, una línea `d-sm d-mid d-new` con lo que añade («+ setup de la ficha») |
| **Un tramo nuevo del recorrido** | Una nota `d-sm d-new` en el margen, con el issue: «#60 · una vez por repo» |
| **Fila nueva de una tabla** | `<tr class="doc-new">`, y la primera celda empieza por el issue: «#60 · Preparar» |
| **Lo que propone el texto** | Una frase en `<span class="doc-new">` en la entradilla o en el pie |
| **Se va** | En la de hoy, la caja en `d-dash`; en la propuesta, el hueco, y el pie lo dice |

Si las marcas pasan de la mitad de la figura, la propuesta es otra figura: se cuenta con architecture delta o se parte en dos comparaciones.

## Cuánto texto cabe

Las cajas miden de la rejilla de 4 px (`layout-budget.md` de la skill `diagram`). El ancho de una caja sale de su texto más largo:

| Texto | Clase | Por carácter | Caja de 136 | Caja de 160 |
|---|---|---|---|---|
| Nombre de la pieza | `d-t` | ≈ 8 px | 15 caracteres | 18 caracteres |
| Detalle debajo del nombre | `d-tm` | ≈ 8 px | 15 caracteres | 18 caracteres |
| Etiqueta de flecha o de marca | `d-tm`, mayúsculas | ≈ 8 px | 14 caracteres como máximo | — |

Regla: **ancho de la caja ≥ caracteres × 8 + 16**. Si no cabe, se acorta el texto antes que ensanchar la caja; un detalle que no cabe en 18 caracteres va al pie.

## Cómo llega a la PR

La página entera llega como artefacto de la issue ([pull-requests.md](pull-requests.md)). La descripción de la PR no admite HTML, así que además enseña la figura como imagen:

```bash
node <plugin>/scripts/figure-png <página.html> <carpeta>/figuras/antes-despues.png
```

`figure-png` abre la página en modo claro a 1300 px de ancho (así una comparación sale lado a lado), recorta desde la primera `figure.figwrap` hasta la última (o solo la que se pida con `--figure N`, contando desde 1) y guarda un PNG a doble resolución. Necesita Playwright con Chromium; si no está, lo dice y sale con 1. La imagen se regenera cada vez que cambia la figura y entra en el mismo commit.

En la PR se enlaza con `https://github.com/<owner>/<repo>/blob/<rama>/<ruta>.png?raw=true`, que funciona también en repos privados.

## Lista

- [ ] La forma de la tabla de arriba, según el tamaño del cambio.
- [ ] Hoy y propuesta con la misma disposición y las piezas que sobreviven en el mismo sitio.
- [ ] Todo el rojo en la columna de la propuesta, y cada marca con su borde discontinuo o su issue.
- [ ] Ningún texto se sale de su caja (ancho ≥ caracteres × 8 + 16).
- [ ] La página pasa `delphos-check` y el PNG de `figuras/` está al día.
