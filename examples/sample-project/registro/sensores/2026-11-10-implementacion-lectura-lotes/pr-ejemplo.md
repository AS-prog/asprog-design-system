Closes #12

## Qué y por qué

El lector de sensores pide la humedad de las doce parcelas en una sola consulta y guarda el lote en una transacción. El ciclo baja de ≈ 4,1 s a ≈ 0,6 s, y la programación del riego deja de ver ciclos a medias (ficha RS 02, decisión D05).

## Cambios

| Commit | Qué cambia |
|---|---|
| `8c41d07` | **Leer lote**: `read_batch()` manda una consulta de difusión al bus y recoge las doce respuestas; un sensor que no contesta queda como ausente |
| `b2e6a90` | **Guardar**: `save_batch()` escribe el lote en una transacción en lugar de un `INSERT` por sensor |

## Cómo cambia el desarrollo

![Antes y después de la lectura de sensores](https://github.com/ejemplo/riego-management/blob/feature/lectura-lotes/registro/sensores/2026-11-10-implementacion-lectura-lotes/figuras/antes-despues.png?raw=true)

| Página | Tipo | Estado al fusionar |
|---|---|---|
| [RS 02 · Lectura por lotes](https://github.com/ejemplo/riego-management/issues/12): artefacto `rs02-lectura-lotes.html` de la issue #12 | implementación | borrador → vigente |
| [Cómo funciona el lector](https://github.com/ejemplo/riego-management/blob/feature/lectura-lotes/tecnica/lector-sensores/lector-sensores.html) | técnica | actualizada en esta rama |

La página se lee directamente en el artefacto de la issue. Para verla con el resto del sitio: `git switch feature/lectura-lotes` y doble clic en `index.html`.

## Validación

```
pytest tests/sensors tests/storage   # 48 pruebas en verde (9 nuevas)
python -m sensors.bench --cycles 50  # ciclo medio: 4,1 s antes, 0,6 s después
```

## Pendiente

- Probarlo en el invernadero de pruebas con los doce sensores reales (#13).

## Cómo revisarlo

Empieza por la figura. Después lee `sensors/batch.py` y termina con `storage/readings.py`.

## Al fusionar

- [ ] La página de implementación pasa de `borrador` a `vigente`, tiene su línea en el Historial y el artefacto de la issue se actualiza.
- [ ] La página técnica del lector cuenta la lectura por lotes.
- [ ] Las decisiones de la ficha están marcadas o pasan a otra ficha.
- [ ] Las páginas pasan `delphos-check` y `site.py build` está al día.
