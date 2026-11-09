<!--
  Plantilla de PR del método documentation (asprog-design-system).
  Se copia a .github/pull_request_template.md del repo. Guía: skills/method/reference/pull-requests.md.
  Una sección que no aplica se quita; no se deja vacía. Borra estos comentarios al rellenarla.
-->

Closes #{{N}}

## Qué y por qué

<!-- Una o dos frases: qué cambia para quien usa el código y qué ficha o decisión lo pide. La conclusión primero. -->

## Cambios

| Commit | Qué cambia |
|---|---|
| `{{hash}}` | {{Una frase por commit; el nombre de la pieza en negrita}} |

## Cómo cambia el desarrollo

<!--
  La evidencia en HTML. Un cambio grande enseña el diagrama de antes y el de después con la misma disposición;
  uno acotado, el diagrama actual con lo nuevo marcado («NUEVO», relleno, en la tinta: nunca en verde).
  La figura va también aquí como imagen, para verla sin salir de GitHub.
-->

![{{Antes y después de …}}](https://github.com/{{owner}}/{{repo}}/blob/{{rama}}/{{ruta-a-la-carpeta}}/figuras/{{figura}}.png?raw=true)

| Página | Tipo | Estado al fusionar |
|---|---|---|
| [{{Título}}](https://github.com/{{owner}}/{{repo}}/issues/{{N}}): artefacto `{{objeto}}.html` de la issue #{{N}} | implementación | borrador → vigente |
| [{{Título}}](https://github.com/{{owner}}/{{repo}}/blob/{{rama}}/{{ruta}}.html) | técnica | actualizada en esta rama |
| [{{Título}}](https://github.com/{{owner}}/{{repo}}/blob/{{rama}}/{{ruta}}.html) | diseño | aplicado |

La página de implementación se lee en el artefacto de la issue (`standalone-html` y `gh issue artifact create`). Para verla con el resto del sitio: `git switch {{rama}}` y doble clic en `{{docs/index.html}}`.

## Validación

```
{{comando de las pruebas}}   # {{N}} pruebas en verde ({{M}} nuevas)
```

<!-- Lo que se ejecutó además de las pruebas, con su resultado y cómo repetirlo. Cifras reales o marcadas con ≈. -->

## Riesgos

<!-- Qué puede romper y a quién afecta. Si no hay ninguno que pida acción, quita la sección. -->

## Pendiente

<!-- Lo que queda abierto, cada cosa con su ficha (#N). -->

## Cómo revisarlo

<!-- Por dónde empezar: la página de implementación primero, luego los commits en orden. -->

## Al fusionar

- [ ] La página de implementación pasa de `borrador` a `vigente`, tiene su línea en el Historial y su artefacto en la issue está al día.
- [ ] La página técnica del componente cuenta lo que entra aquí.
- [ ] Las decisiones de la ficha están marcadas o pasan a otra ficha.
- [ ] Las páginas pasan `delphos-check` y `site.py build` está al día.
