# Figura

`cubes.svg` es la figura de la portada en su forma estática: catorce cubos isométricos en tres capas (3×3, 2×2, 1×1). Es el respaldo del lienzo WebGL y lo que se ve sin JavaScript o sin WebGL.

- `cubes.svg`: colores fijos (aristas `#1F2BE0`, caras `#F0EBDE` / `#E0DCE0` / `#CFCCE0`), para usar como `<img>`. No sigue el tema oscuro: en oscuro las aristas cobalto desaparecen sobre el fondo.
- `cubes-inline.svg`: la misma figura con caras `var(--cube-top)`, `var(--cube-right)`, `var(--cube-left)` (con los valores fijos de respaldo) y aristas `currentColor`. Pegada en línea sigue al tema: en oscuro las aristas son papel.
- Proporción 502 × 664: la caja que la contiene manda por `aspect-ratio`, no por altura.
- Texto alternativo: «Catorce cubos organizados en tres capas: 3 por 3, 2 por 2 y 1 por 1».
- No se imprime.

La versión animada (catorce sólidos en WebGL que vuelan hasta ordenarse, con arrastre para girar la pila) vive en la web, no aquí. Cómo está hecha y cómo reproducirla: [`docs/cube-figure.md`](../../docs/cube-figure.md).
