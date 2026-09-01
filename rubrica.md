## RÚBRICA EJECUTABLE v0

Evalúa exclusivamente la evidencia verificable provista del repositorio.
No supongas que algo existe. No otorgues puntos por intención, promesas ni afirmaciones sin respaldo concreto.

### Escala obligatoria

Para cada dimensión asigna únicamente uno de estos niveles:

- 0% del peso: no hay evidencia verificable.
- 25% del peso: evidencia incipiente, parcial o declarativa.
- 50% del peso: evidencia funcional pero incompleta.
- 75% del peso: evidencia sólida, con detalles menores faltantes.
- 100% del peso: evidencia completa, verificable y reproducible.

No uses porcentajes ni puntajes intermedios.

### Dimensiones

| Dimensión | Peso |
|---|---:|
| Sistema completo y funcionando: contrato, herramienta real, output estructurado, supervisión definida | 30 |
| Proceso documentado: iteraciones, fallas, decisiones — la historia real de la construcción | 25 |
| Formato y reproducibilidad: estructura obligatoria respetada, corridas reconstruibles | 15 |
| Análisis económico: costo por corrida, proyección, elección de modelo justificada | 15 |
| Gobierno y riesgo: permisos, fallas posibles, supervisión, quién firma | 15 |

### Regla de evidencia

Una afirmación solo cuenta como evidencia si referencia al menos uno de estos elementos:

- archivo o ruta concreta;
- commit o historial de cambios;
- corrida registrada con entrada y salida;
- cálculo reproducible;
- decisión documentada;
- resultado de prueba verificable.

El proceso documentado con honestidad vale: registrar una falla, una iteración descartada o una decisión corregida suma evidencia en la dimensión “Proceso documentado”.

El chamuyo sin evidencia no vale: frases generales como “el agente funciona”, “se realizaron pruebas” o “el modelo es económico” no suman puntos sin respaldo verificable.

Si la evidencia es ambigua, incompleta o contradictoria, asigna el nivel inferior que pueda justificarse e indica qué falta.

### Salida obligatoria

Responde únicamente con JSON válido:

{
  "puntaje_total": 0,
  "maximo": 100,
  "veredicto": "aprobado | requiere_revision | evidencia_insuficiente",
  "dimensiones": [
    {
      "nombre": "",
      "peso": 0,
      "nivel_porcentaje": 0,
      "puntos": 0,
      "evidencia_encontrada": [],
      "evidencia_faltante": [],
      "justificacion": ""
    }
  ],
  "fortalezas": [],
  "riesgos_o_hallazgos": [],
  "siguiente_mejora_prioritaria": ""
}

Calcula:
puntos = peso × nivel_porcentaje / 100

La suma de puntos de las cinco dimensiones debe coincidir con puntaje_total.
