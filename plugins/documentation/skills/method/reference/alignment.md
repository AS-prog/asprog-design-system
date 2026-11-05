# Diseño y código alineados

## Ramas

| Rama | Qué lleva | Sale de | Entra en |
|---|---|---|---|
| `main` | Lo integrado y revisado | — | — |
| `develop` | La integración de las features; despliega a pruebas | `main` | `main`, por PR de versión con aprobación |
| `feature/<nombre>` | Un cambio: una ficha o un mapa | `develop` | `develop` |

- **Nada directo a `main` ni a `develop`**: todo entra por PR, sin `push --force` a esas ramas.
- **`<nombre>`** es el tema de la ficha en kebab-case. La ficha dice su rama en una línea `Branch: feature/<nombre>`.
- **Un cambio que toca diseño y código lleva el mismo nombre de rama en los dos repos.** Se integra primero el de gestión y después el de código, para que `develop` y `main` de código nunca contradigan al diseño.
- **Antes de empezar y antes del PR**: `git fetch` en los dos repos y la rama al día con su base.
- **Al integrar**: se borra la rama en local y en el remoto en los dos repos, se cierra la ficha y se regeneran las vistas del diseño si cambió `diseno/`.

## Cada commit de código tiene su reflejo

Todo commit del repo de código que cambia comportamiento, un parámetro, un tamaño, un nombre, un tipo, un esquema o el despliegue lleva, en la misma rama del repo de gestión:

- `diseno/nivel-1/` (qué) y `diseno/nivel-2/` (cómo, en el caso) al día;
- un ADR en `decisiones/` si es difícil de deshacer;
- la ficha actualizada;
- la página técnica del componente (`tecnica/<componente>/`).

Antes de abrir o fusionar el PR se cruzan los `git log origin/develop..` de los dos repos: cada commit de código tiene su commit de diseño, salvo un refactor sin cambio de comportamiento o una corrección menor.

## Desarrollo y pruebas

- **Se desarrolla y se prueba en local** y después se replica en el servicio, en su entorno de pruebas. Nunca se prueba en producción.
- **Las pruebas puntuales de verificación** se escriben, se ejecutan, se registran (resultado en el repo de gestión), se commitean y, una vez verificado lo que se buscaba, se borran del repo en un commit aparte.
- **Antes de abrir un PR**, una revisión independiente del código propone mejoras.
