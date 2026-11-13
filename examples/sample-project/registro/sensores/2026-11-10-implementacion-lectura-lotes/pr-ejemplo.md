## Qué cambia

El lector de sensores pide la humedad de las doce parcelas en una sola consulta y guarda el lote en una transacción. El ciclo baja de ≈ 4,1 s a ≈ 0,6 s, y la programación del riego deja de ver ciclos a medias (ficha RS 02, decisión D05).

- **Leer lote**: `read_batch()` manda una consulta de difusión al bus y recoge las doce respuestas; un sensor que no contesta queda como ausente (`8c41d07`).
- **Guardar**: `save_batch()` escribe el lote en una transacción en lugar de un `INSERT` por sensor (`b2e6a90`).

## Cómo se comprobó

```
pytest tests/sensors tests/storage   # 48 pruebas en verde (39 antes)
python -m sensors.bench --cycles 50  # ciclo medio: 4,1 s antes, 0,6 s después
```

## Cómo cambia el desarrollo

![Antes y después de la lectura de sensores](https://github.com/ejemplo/riego-management/blob/feature/lectura-lotes/registro/sensores/2026-11-10-implementacion-lectura-lotes/figuras/antes-despues.png?raw=true)

| Página | Tipo | Estado al fusionar |
|---|---|---|
| [RS 02 · Lectura por lotes](https://github.com/ejemplo/riego-management/issues/12): artefacto `rs02-lectura-lotes.html` de la issue #12 | implementación | borrador → vigente |
| [Cómo funciona el lector](https://github.com/ejemplo/riego-management/blob/feature/lectura-lotes/tecnica/lector-sensores/lector-sensores.html) | técnica | actualizada en esta rama |

## Avisos

- Falta probarlo en el invernadero de pruebas con los doce sensores reales (#13).

## Cómo revisarlo

Empieza por la figura. Después lee `sensors/batch.py` y termina con `storage/readings.py`.

Closes #12
