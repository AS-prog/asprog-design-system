# Páginas de implementación

Cada implementación deja en el repo de gestión una página que explica cada parte de lo construido: qué hace, dónde está en el código, qué decisión cumple y cómo se comprobó. Quien revisa el cambio la lee para entenderlo sin abrir el código.

## Dónde va

```text
registro/<tema>/<AAAA-MM-DD>-implementacion-<objeto>/
├── README.md        la fuente
├── <objeto>.html    la página (site.py new implementation …)
└── figuras/         si hacen falta
```

- Va en la misma rama `feature/<nombre>` que la ficha, y la ficha la enlaza al cerrarse.
- Mientras el cambio no está integrado es un borrador y se reescribe para que cuente todo lo que implementa. Integrado, solo admite notas fechadas al final del `.md`, y la página se regenera desde él.

## Qué lleva

| Sección | Contenido |
|---|---|
| Cabecera | Título con lo implementado y, debajo, las fichas (`p.eyebrow`). Una frase de entrada y la ficha técnica: fecha, estado, fichas, código (`<repo>@hash`) y diseño (`Dnn`) |
| Conclusión | Qué quedó implementado y qué falta, en un párrafo |
| Qué entra en el cambio | Tabla ficha → qué aporta → commits de código |
| Arquitectura | Un diagrama de todas las piezas, configuración incluida, y la tabla de puertos y adaptadores por entorno si los hay |
| Configuración | Los ficheros de configuración que usa, comentados, con sus campos y lo que se valida |
| Cómo funciona | Una subsección por parte, cada una con su diagrama: qué recibe, qué hace y qué deja |
| Dónde está en el código | Tabla parte → `<repo>:<ruta>` → decisión |
| Cómo se comprobó | Tests y ejecuciones en local y en el servicio, con los comandos para repetirlo |
| Pendiente | Lo que queda abierto, con su ficha, en `notice-pending` |
| Historial | Fecha y qué cambió en la página; enlace a la página técnica que esta ficha actualizó |

Si el código contradice el diseño, la página lo dice y enlaza la ficha que lo resuelve.
