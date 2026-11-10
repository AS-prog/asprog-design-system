# Iconos

Los dos únicos iconos del sistema, los del conmutador de tema (`ThemeToggle`): `sun.svg` en el tema claro y `moon.svg` en el oscuro. Caja de 18 × 18 (`viewBox`), trazo de 1.5px con extremos redondeados; en el sitio se pintan a 17px.

Los ficheros llevan solo el dibujo: ni tamaño, ni clase, ni `aria-hidden`. Quien los pega en línea añade `width`, `height`, `class` y `aria-hidden="true"`, como hace `components/ThemeToggle/preview.html`.

Su tinta es `currentColor`: en línea toman `muted` y pasan a `ink` al pasar. Como `<img>` se ven en negro; para usarlos, pégalos en línea.
