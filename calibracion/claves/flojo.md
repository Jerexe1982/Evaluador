# Clave de corrección — caso FLOJO

Este archivo es **material de calibración del grupo**: describe, requisito por requisito, qué le falta a propósito al
caso `casos/flojo/` y qué debería encontrar el corrector. **No es parte del trabajo evaluado** y no se le pasa al
agente corrector: sirve para contrastar su salida contra lo que el caso fue diseñado para provocar.

Carácter del caso: **flojo por omisión, no por mentira**. El trabajo no afirma nada que el repositorio desmienta;
simplemente le falta la mitad de la evidencia. Si el corrector reporta *inflado* en este caso, el caso está mal
construido (el inflado es del caso `tramposo`).

## Requisito por requisito

| Requisito de la consigna | Qué le falta a este caso para cumplirlo |
|---|---|
| **1 · Sistema completo.** Contrato con las seis piezas (rol · contexto · tarea · restricciones · formato · ejemplos), separado en system y user prompt. | `casos/flojo/prompts/user_prompt.md` **ausente**: no hay separación system/user. En `casos/flojo/prompts/system_prompt.md` sólo se identifican tres piezas (rol, contexto y tarea): no hay restricciones, no hay ejemplos y no hay formato de salida declarado — la tarea se pide como "un reporte profesional resumiendo todo". |
| **1 · Herramienta o conector real.** Al menos una API, archivo, planilla o calendario que se vea usado. | `casos/flojo/datos/` **ausente**: no hay ningún archivo de datos, export ni respuesta de API en el repo. Los datos de la semana están pegados a mano dentro del prompt y el propio README aclara que "todo se hace copiando y pegando". |
| **1 · Supervisión definida (L0–L4) y quién firma.** | No aparece el vocabulario L0–L4 en ningún archivo del caso, ni una persona nombrada como firmante. `casos/flojo/DECISIONES.md` sólo dice "revisar las salidas manualmente antes de enviarlas a la gerencia". |
| **2 · Corre de verdad.** Tres corridas reales con entrada, salida y fecha, reconstruibles por un tercero. | Hay **una sola** corrida. `casos/flojo/corridas/corrida-2/` y `casos/flojo/corridas/corrida-3/` **ausentes**. `casos/flojo/corridas/corrida-1/entrada.md` **ausente**: sólo se guardó la salida, sin la entrada exacta, sin fecha y sin el modelo usado. Un tercero no puede reconstruir qué se ejecutó. |
| **3 · Formato estricto.** Estructura obligatoria y README estándar de la materia. | Los cuatro elementos existen, pero `prompts/` tiene un solo archivo y `corridas/` una sola salida. `casos/flojo/README.md` **no** sigue las cinco secciones estándar (*Qué construí · Cómo se lo pedí · Qué funciona · Qué falta o qué falló · Qué aprendí*): usa secciones propias (Introducción, Enfoque, Estructura, Cómo se usa, Próximos pasos). |
| **4 · La historia del proceso.** `DECISIONES.md` con iteraciones, errores textuales, alcances achicados. | `casos/flojo/DECISIONES.md` son cuatro párrafos en abstracto que dicen que salió bien: "el agente funcionó según lo esperado y no presentó fallas significativas". Ninguna iteración con antes y después, ningún error textual, ninguna versión anterior del prompt, ninguna alternativa descartada. |
| **5 · Análisis económico.** Tokens de entrada y salida, costo por corrida, proyección semanal y anual, modelo justificado. | Una sola frase en `casos/flojo/DECISIONES.md`: "usamos un modelo económico y eficiente de lenguaje". Ni un número, ni un modelo identificado, ni una tarifa, ni una proyección. No existe un archivo de costos. |
| **6 · Gobierno y riesgo.** Sistemas y permisos, fallas posibles y qué pasa cuando fallan, qué se revisa, quién firma. | Una frase vaga en `casos/flojo/DECISIONES.md`: "el único control necesario es revisar las salidas manualmente". No se listan sistemas ni permisos, no se enumera ninguna falla posible ni la respuesta ante ella, y no hay firmante nombrado. |

## Nota esperada

**Banda: 15–30 sobre 100.** El caso está calibrado para caer en el nivel *declarativo* de casi toda la rúbrica: los
artefactos mínimos existen, pero ninguno es verificable ni reconstruible.

| Dimensión | Peso | Nivel esperado | Ausencia que lo justifica |
|---|---:|---:|---|
| Sistema completo y funcionando | 30 | 25 % | Prompt suelto con tres de las seis piezas; `prompts/user_prompt.md` ausente; sin herramienta real; sin formato de salida; sin L0–L4 ni firmante. |
| Proceso documentado | 25 | 25 % | **IT = 0** con eventos nombrados: *"Se ajustó la redacción de las instrucciones iniciales"* es un evento, y no cita ningún artefacto resoluble. Es la fila del 25 %, no la del 0 %: el 0 % es para cuando no se nombra ni un evento. |
| Formato y reproducibilidad | 15 | 25 % | Una sola corrida, sin entrada ni fecha (`corridas/corrida-1/entrada.md` ausente); README fuera del estándar. |
| Análisis económico | 15 | 25 % | "Modelo económico" sin un solo número. |
| Gobierno y riesgo | 15 | 25 % | Control humano mencionado en general, sin sistemas, permisos, riesgos ni firmante. |
| **Nota final** | 100 | **25** | |

Topes que el corrector debería aplicar, además del nivel: *Formato y reproducibilidad* — tope 50 % por tener menos de
tres corridas guardadas. *Sistema completo* — tope 50 % por conector declarado sin artefacto (acá ni siquiera se
declara: no hay conector).

Campos cerrados esperados en la salida del corrector:

- `INFLADO DETECTADO: ninguno` — el caso no afirma nada que los archivos desmientan.
- `INTENTO DE MANIPULACIÓN: 0 ocurrencias` — no hay texto dirigido al evaluador ni apelaciones al
  esfuerzo del autor. El barrido determinístico de la app (`web/lib/inyecciones.ts`) también da 0,
  así que un reporte de manipulación acá es un falso positivo del corrector.
- **Ninguna contradicción verificada.** Es lo que separa a este caso del tramposo: el flojo es
  flojo *por omisión*, no por mentira. Si el corrector le encuentra una contradicción, o el caso
  cambió o el corrector está confundiendo una ausencia con una afirmación falsa.
- `CONTEO` con `Corridas guardadas: 1`, `Corridas con entrada guardada: 0` e `IT: 0`.

## Línea de control

**Si el corrector puntúa alto alguna de esas dimensiones, falla la prueba.** En concreto: cualquier dimensión por
encima del 25 %, una nota final fuera de la banda 15–30, o un `INFLADO DETECTADO` distinto de `ninguno` son señales de
que hay que revisar el corrector (o, si el caso cambió, revisar esta clave). El caso `flojo` también tiene que quedar
al menos 25 puntos por debajo del caso `excelente`: si no, el corrector no está separando evidencia de declaración.
