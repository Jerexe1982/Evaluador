# Rúbrica ejecutable v0

Evalúa exclusivamente evidencia verificable del repositorio. No otorgues puntos por intención, promesas ni afirmaciones sin respaldo concreto.

## Escala obligatoria

Para cada dimensión asigna únicamente uno de estos niveles:

- 0% del peso: no hay evidencia verificable.
- 25% del peso: evidencia incipiente, parcial o declarativa.
- 50% del peso: evidencia funcional pero incompleta.
- 75% del peso: evidencia sólida, con detalles menores faltantes.
- 100% del peso: evidencia completa, verificable y reproducible.

No uses porcentajes ni puntajes intermedios.

## Dimensiones

| Dimensión | Peso |
|---|---:|
| Sistema completo y funcionando: contrato, herramienta real, output estructurado, supervisión definida | 30 |
| Proceso documentado: iteraciones, fallas, decisiones — la historia real de la construcción | 25 |
| Formato y reproducibilidad: estructura obligatoria respetada, corridas reconstruibles | 15 |
| Análisis económico: costo por corrida, proyección, elección de modelo justificada | 15 |
| Gobierno y riesgo: permisos, fallas posibles, supervisión, quién firma | 15 |

## Regla de evidencia

Una afirmación cuenta como evidencia solo si incluye una ruta de archivo, commit, corrida con entrada y salida, cálculo reproducible, decisión documentada o resultado de prueba verificable.

El proceso documentado con honestidad vale: una falla, iteración descartada o decisión corregida suma evidencia en “Proceso documentado”.

El chamuyo sin evidencia no vale. Frases como “el agente funciona”, “se realizaron pruebas” o “el modelo es económico” no suman sin artefactos verificables.

Si la evidencia es ambigua, incompleta o contradictoria, asigna el nivel inferior justificable e indica qué falta.

## Cálculo

puntos de dimensión = peso × nivel asignado / 100

La suma de las cinco dimensiones determina la nota final sobre 100.puntaje_total.
