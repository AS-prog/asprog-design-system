<!--
  Plantilla de PR del método documentation (asprog-design-system), con el formato que se usa en nano-harness.
  Se copia a .github/pull_request_template.md del repo. Guía: skills/method/reference/pull-requests.md.
  Una sección que no aplica se quita; no se deja vacía. Borra estos comentarios al rellenarla.
-->

## Qué cambia

<!-- Una o dos frases: qué cambia para quien usa el código y qué issue o decisión lo pide. La conclusión primero. -->

- **{{Pieza}}**: {{qué cambia}} (`{{hash}}`).
- {{Una viñeta por commit o por pieza; el nombre en negrita, el hash al final}}.

## Cómo se comprobó

<!-- Cifras reales: pruebas antes y después, aceptaciones, la ejecución con su tiempo. Comandos copiables. -->

```
{{comando de las pruebas}}   # {{N}} pruebas en verde ({{antes}} antes)
```

<!--
  Opcional, solo si la PR toca páginas del registro:

## Cómo cambia el desarrollo

![{{Antes y después de …}}](https://github.com/{{owner}}/{{repo}}/blob/{{rama}}/{{ruta}}/figuras/{{figura}}.png?raw=true)

| Página | Tipo | Estado al fusionar |
|---|---|---|
| [{{Título}}]({{artefacto de la issue o enlace a la rama}}) | implementación | borrador → vigente |
-->

## Avisos

<!-- Choques con otras PR, lo que no se toca y por qué, avisos de delphos-check. Si no hay ninguno, quita la sección. -->

## Cómo revisarlo

<!-- Por dónde empezar: el fichero o la página primero, luego el resto. -->

Closes #{{N}}
