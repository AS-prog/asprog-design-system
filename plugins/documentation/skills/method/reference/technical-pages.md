# Páginas técnicas

Una página técnica explica cómo funciona hoy un componente, con diagramas, para que un ingeniero que llega sin contexto lo entienda sin leer el código ni las páginas de implementación.

| | Página técnica | Página de implementación |
|---|---|---|
| Pregunta | Cómo funciona hoy este componente | Qué se hizo en esta ficha y cómo se comprobó |
| Dónde | `tecnica/<componente>/` | `registro/<tema>/<AAAA-MM-DD>-implementacion-<objeto>/` |
| Quién la lee | Quien llega al componente | Quien revisa o cierra la ficha |
| Cambia | Sí, en la rama de cada ficha que cambia el componente | No: notas fechadas al final |

Por eso la página técnica no cuenta el hito: ni cuántos tests pasaron, ni qué se corrigió en la revisión, ni qué faltaba aquel día.

## Qué lleva

| Sección | Qué contiene | Figura |
|---|---|---|
| Cabecera | Nombre, una frase de entrada, «Vigente a», el código que describe (`<repo>@hash`), el diseño y las decisiones | — |
| En una frase | Qué hace y qué no hace | — |
| Mapa general | De dónde lee, dónde escribe y qué otros sistemas toca | Obligatoria |
| Vocabulario | Los términos que usa la página, con las palabras del glosario | — |
| Cómo funciona | Una subsección por flujo o mecanismo. Cada paso dice qué recibe, qué hace y qué deja | Una por subsección |
| Qué deja | Tablas, columnas, ficheros o eventos que produce | Si ayuda |
| Despliegue | Cómo llega del repo al servicio y qué protege de tocar producción | Obligatoria |
| Cómo se opera | Comandos en local y en el servicio; consultas; tabla «síntoma → qué pasa → qué hacer» | — |
| Límites conocidos | Lo que no hace o puede fallar hoy: `notice-risk` si pide acción, `notice-pending` si está abierto | — |
| Dónde está en el código | Tabla parte → `<repo>:<ruta>` | — |
| Historial | Una fila por ficha que cambió el componente, con enlace a su página de implementación | — |

## Qué diagrama para qué

| Para explicar | Tipo (skill `diagram`) |
|---|---|
| Qué toca el componente | Mapa o arquitectura |
| Cómo se separa el código | Capas: núcleo, puertos, un adaptador por entorno |
| Qué pasa en una ejecución | Flujo |
| Quién llama a quién | Secuencia |
| Cómo evoluciona una cosa | Estados |
| Una regla con datos | Ejemplo trabajado con pocos valores |
| Cómo llega al servicio | Despliegue |

## Cuándo se actualiza

- Cada ficha que cambia el componente actualiza su página en la misma rama: el contenido, «Vigente a», el hash y una fila del historial.
- Un componente nuevo nace con su página técnica en la ficha que lo construye.
- Si alguien la encuentra desfasada, se corrige con un cambio propio.

## Antes de darla por buena

- [ ] Alguien que no conoce el componente podría ejecutarlo y explicarlo leyendo solo esta página.
- [ ] Cada mecanismo no obvio tiene su figura, y cada figura su pie.
- [ ] «Vigente a» y el hash corresponden al código descrito, y el hash está publicado.
- [ ] Nada describe el hito.
