# Controlador de riego

Un proyecto ficticio que lee la humedad del suelo, decide cuándo regar y abre las válvulas. Este sitio reúne su documentación y sirve de modelo para un proyecto real.

## De qué va

Cada parcela tiene un sensor de humedad y una válvula. El controlador lee los sensores cada diez minutos, compara la humedad con el umbral de la parcela y abre la válvula el tiempo que haga falta.

## Los repos

| Repo | Qué tiene |
|---|---|
| `riego-management` | El diseño, las decisiones, las fichas y este sitio. Es la fuente de verdad |
| `riego-controller` | El código, los tests, la configuración y el glosario |

## Cómo leer el sitio

Cada tema tiene tres tipos de página: **cómo funciona** (la página técnica, viva), **implementación** (fechada, una por ficha) y **diseño** (fechada, la propuesta antes de construir).
