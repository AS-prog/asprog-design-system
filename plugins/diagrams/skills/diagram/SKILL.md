---
name: diagram
description: Dibuja cualquiera de los 45 tipos de diagrama de diagram-design (arquitectura y su delta, flujo, secuencia, estados, ER y esquema de base de datos, línea de tiempo, carriles, cuadrante, radar, polar, bucle, anidado, árbol, organigrama, capas, axonometría explotada y en planta, Venn, pirámide y embudo, barras, cascada, treemap y marimekko, mapa de calor, líneas (slopegraph, ridgeline, streamgraph, bump), Gantt, dispersión (burbujas, beeswarm), alto nivel, proceso, medallion, flujo de datos, integración y matriz de seguridad de una plataforma de datos, Sankey, espina de pez, Wardley, kanban, viaje de usuario, service blueprint, despliegue, dependencias, clases UML, story map) con la identidad visual Delphos, como figura SVG en línea dentro de un documento o una publicación. Úsala cuando pidan «diagrama», «esquema», «gráfico», «dibuja el flujo», «mapa» o «cómo se conecta» en cualquier proyecto que use Delphos.
argument-hint: qué hay que dibujar y dónde va
---

# diagram

Los 45 tipos de [diagram-design](https://github.com/cathrynlavery/diagram-design) (MIT, Cathryn Lavery), con su gramática de trazado intacta y el estilo cambiado por el de Delphos: una sola tinta, `currentColor` y clases `.d-*`, sin iconos, sin sombras, sin esquinas, sin un solo valor escrito a mano. La salida es siempre un `figure.figwrap` con un SVG en línea que hereda los tokens del documento, nunca una página aparte.

## 1. Qué cargar

1. [references/style-guide.md](references/style-guide.md): el contrato (las clases, la traducción desde upstream, los marcadores). **Manda sobre todo lo demás.**
2. [references/types.md](references/types.md): la tabla de los 45 tipos. Elige uno y **carga su `type-*.md`** antes de dibujar.
3. Si el diagrama cuenta un comportamiento (cola, cuello de botella, frontera de confianza, ciclo de vida, trazas de política), primero [references/semantic-patterns.md](references/semantic-patterns.md) y elige un patrón; después el tipo que mejor lo dispone.
4. [references/primitives-core.md](references/primitives-core.md) (marcado de nodos, etiquetas, leyenda y las seis reglas de conectores) y [references/layout-budget.md](references/layout-budget.md) (rejilla de 4 px y presupuesto por tipo). [references/primitive-annotation.md](references/primitive-annotation.md) solo si hace falta una llamada al margen.
5. [references/output-spec.md](references/output-spec.md): la forma del fragmento, dónde se pega y cómo se comprueba.

Las referencias de upstream están en inglés y hablan de *coral*, *accent*, *muted*, *Geist*: la tabla de traducción de `style-guide.md` dice qué es cada cosa en Delphos. Sus fragmentos SVG ya vienen traducidos.

## 2. Flujo

1. **¿Hace falta dibujar?** Si una tabla de tres columnas o un párrafo cuentan lo mismo, no se dibuja. Un diagrama de una sola forma es una frase.
2. **Tipo.** De `types.md`; si dos encajan, el del eje dominante. Carga la referencia.
3. **Plan en una línea** antes de dibujar: tipo (y patrón, si lo hay), ancho del `viewBox` y qué deja fuera el presupuesto. Si quien pide está, que redirija; si no, sigue y anota las suposiciones junto al resultado. Sáltalo solo cuando la petición ya fija tipo y contenido.
4. **Borra antes que añadir.** Densidad 4/10: dos nodos que siempre van juntos son uno; una flecha que se deduce del orden sobra; más de 9 nodos son dos diagramas (vista general + detalle).
5. **Dibuja** como fragmento (`output-spec.md`): flechas antes que cajas, máscaras `d-mask` bajo cada etiqueta de flecha, ids con el prefijo del diagrama. Clases y nada más: cero `fill`, `stroke`, `font-*`, `rx`, `style`.
6. **Pega** donde va (publicación `.md`, página Astro o `article.doc-prose`) y pasa `delphos-check` o la lista de §5.

## 3. Reglas de conectores (no negociables)

Texto completo y casos límite en `primitives-core.md`.

1. **Ortogonales.** Entre nodos que no comparten x o y, codo en ángulo recto con arco `r=8` (`r=6` en apretado). Una `<line>` recta solo si comparten eje. Las diagonales fallan.
2. **Etiqueta con hueco.** Cada etiqueta de flecha (14 caracteres, mayúsculas, `d-tm`) va sobre un `d-mask` con 6 a 10 px visibles hasta el trazo; junto a los tramos verticales, nunca encima.
3. **Sin solapes.** Dos conectores no comparten trazo; rutas paralelas a 12 px o más; en un cruce, puente.
4. **Puntos de anclaje repartidos.** N conectores en un mismo lado de una caja entran en `L·k/(N+1)`, a 12 px o más entre sí.
5. **Sin pasar por detrás de un nodo ajeno.** Se desvía. Si es geométricamente inevitable: `d-dash`, etiqueta en el extremo visible, sin punta sobre el nodo intermedio.
6. **Máscara antes que nodo.** Una máscara de etiqueta no pisa un nodo dibujado después.

## 4. Presupuesto

| Límite | Valor |
|---|---|
| Nodos | 9 |
| Flechas o transiciones | 12 |
| Nodos focales (`d-fill` entre `d-box`) | 2 |
| Llamadas al margen | 2 |
| Series en un gráfico | 3 |

Los límites por tipo (líneas de vida, carriles, barras, fases…) están en `layout-budget.md`. Si se pasa, se divide.

## 5. Antes de darlo por bueno

- [ ] Una tabla o un párrafo no lo contarían igual.
- [ ] Cargada la referencia del tipo; dicho el plan antes de dibujar.
- [ ] Nada que borrar: ni nodo, ni flecha, ni etiqueta que la forma ya cuente.
- [ ] Un foco, dos como mucho, y marcado con `d-fill` o con una palabra, no con un color.
- [ ] Los estados `g-ok` / `g-warn` / `g-stop` siempre con una palabra o una forma.
- [ ] Solo clases de `style-guide.md`; ningún `fill`, `stroke`, `font-family`, `font-size`, `rx`, `stroke-width`, `style`, `<style>`, `<filter>`, `<image>`, hex.
- [ ] `svg` con `viewBox` (560 a 760 de ancho), `role="img"`, `aria-labelledby`; `<title>` primero y `<desc>` con ids `{slug}-title` / `{slug}-desc`.
- [ ] Flechas antes que cajas; marcadores con id prefijado; las seis reglas del §3.
- [ ] Mono (`d-tm`) solo para dato; nombres en `d-t`; etiquetas pequeñas en `d-sm`.
- [ ] Geometría en la rejilla de 4 px; leyenda, si la hay, en una fila al pie.
- [ ] Pie en `figcaption`, en español, si aporta algo.
- [ ] `delphos-check` pasa (plugin `documentation`), o la lista anterior repasada a mano.

## 6. Qué no hay

Ni variantes claro/oscuro/editorial (el tema lo pone el documento), ni animación, ni exportación a PNG/SVG, ni importación de Mermaid o draw.io, ni iconos, ni variante terminal o a mano alzada, ni perfiles de cliente. Si un tipo necesita una clase que no existe, no se inventa: se añade a `css/base.css` del sistema de diseño, se publica, y entonces se usa.

Ejemplos de salida en `examples/`: flujo, secuencia, estados, arquitectura, línea de tiempo, barras y mapa de calor.
