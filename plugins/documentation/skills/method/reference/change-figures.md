# Cómo se dibuja un cambio

Las figuras que enseñan cómo cambia el desarrollo se dibujan siempre igual, para que quien revisa una página o una PR lea cualquier cambio sin aprender un dibujo nuevo. Las dibuja la skill `diagram` (plugin `diagrams`) con las clases `.d-*`. Esta guía fija lo que es propio de un cambio: qué forma se elige, cómo se marca lo que cambia, cuánto texto cabe y cómo llega la figura a la PR.

## Qué forma

| El cambio | Forma | Dónde |
|---|---|---|
| Grande: varias piezas, otra forma de conectarse | **Antes y después**: dos figuras, una encima de otra, con la misma disposición | Página de implementación, sección «Arquitectura: antes y después» |
| Acotado: una pieza nueva o una que cambia en un solo sitio | **Lo nuevo marcado** sobre el mapa actual de la página técnica | Página de implementación, sección «Arquitectura» |
| Sin piezas que se muevan: valores, configuración, textos | **Tabla** antes → después; sin figura | Página de implementación o PR |
| Una migración con muchas piezas que aparecen, se van y se reconectan | Tipo **architecture delta** de la skill `diagram`, con su registro de cambios | Página de diseño o de implementación |

Antes y después va en vertical y no en paralelo: cada figura conserva su ancho de 560 a 760, se lee en el móvil sin desplazarse de lado y se exporta como una sola imagen.

## Antes y después

1. **Dibuja primero el después**, y copia sus coordenadas al antes. Las piezas que sobreviven ocupan el mismo sitio en las dos figuras; una pieza que se mueve sin que eso sea el cambio confunde.
2. **El mismo `viewBox`** en las dos. Si el antes tiene menos piezas, deja el hueco vacío: el hueco es parte de la comparación.
3. **El antes va sin marcas**, salvo lo que desaparece. Las marcas del cambio van en el después.
4. **Ids con prefijo propio** en cada figura (`<slug>-before-…`, `<slug>-after-…`), también en los marcadores de flecha.
5. **El pie empieza por la palabra**: `<strong>Antes.</strong>` y `<strong>Después.</strong>`, y dice en una frase qué falla y qué lo arregla.

## Las marcas

Una sola tinta: lo que cambia lo dice una palabra, y el relleno y el trazo la acompañan. El verde de solución y los colores de rama no se usan en estas figuras.

| Marca | Dónde | Cómo |
|---|---|---|
| **NUEVO** | Después | La caja en `d-fill` y la palabra en `d-tm` justo encima (`y` de la caja − 8), alineada a su izquierda |
| **CAMBIA** | Después | Igual que NUEVO; el pie dice qué era antes y qué es ahora |
| **SE VA** | Antes | La caja en `d-dash` y la palabra encima; en el después, el hueco |
| **Conexión que cambia** | Antes y después | La de antes en `d-dash` con su etiqueta; la de después en `d-line` con la nueva |
| **Sin conectar** | Después | `NUEVO · SIN CONECTAR` encima de la caja, sin flechas hacia ella |

Como mucho **dos piezas marcadas** por figura (el presupuesto de nodos focales). Si hay más, el cambio es grande: se parte en dos figuras o se cuenta con architecture delta.

## Cuánto texto cabe

Las cajas miden de la rejilla de 4 px (`layout-budget.md` de la skill `diagram`). El ancho de una caja sale de su texto más largo:

| Texto | Clase | Por carácter | Caja de 136 | Caja de 160 |
|---|---|---|---|---|
| Nombre de la pieza | `d-t` | ≈ 8 px | 15 caracteres | 18 caracteres |
| Detalle debajo del nombre | `d-tm` | ≈ 8 px | 15 caracteres | 18 caracteres |
| Etiqueta de flecha o de marca | `d-tm`, mayúsculas | ≈ 8 px | 14 caracteres como máximo | — |

Regla: **ancho de la caja ≥ caracteres × 8 + 16**. Si no cabe, se acorta el texto antes que ensanchar la caja; un detalle que no cabe en 18 caracteres va al pie.

## Cómo llega a la PR

GitHub no muestra un HTML, así que la PR enseña la figura como imagen:

```bash
node <plugin>/scripts/figure-png <página.html> <carpeta>/figuras/antes-despues.png
```

`figure-png` abre la página en modo claro, recorta desde la primera `figure.figwrap` hasta la última (o solo la que se pida con `--figure N`, contando desde 1) y guarda un PNG a doble resolución. Necesita Playwright con Chromium; si no está, lo dice y sale con 1. La imagen se regenera cada vez que cambia la figura y entra en el mismo commit.

En la PR se enlaza con `https://github.com/<owner>/<repo>/blob/<rama>/<ruta>.png?raw=true`, que funciona también en repos privados.

## Lista

- [ ] La forma de la tabla de arriba, según el tamaño del cambio.
- [ ] Antes y después con el mismo `viewBox` y las piezas que sobreviven en el mismo sitio.
- [ ] Cada marca con su palabra; dos piezas marcadas como mucho.
- [ ] Ningún texto se sale de su caja (ancho ≥ caracteres × 8 + 16).
- [ ] La página pasa `delphos-check` y el PNG de `figuras/` está al día.
