# App del agente corrector

Interfaz mínima para correr el agente corrector sobre los casos de `casos/`, ver la nota
que puso y entender de dónde sale cada punto.

## Correrla

```bash
cd web
npm install
cp .env.example .env.local   # y cargar ANTHROPIC_API_KEY
npm run dev
```

Queda en `http://localhost:3000`. Sin clave la app abre igual: se ven los casos, sus
archivos y las corridas ya guardadas; el botón de correr queda deshabilitado.

## Qué hace

- **Portada** — la última nota de cada caso, dimensión por dimensión, y la comparación
  entre los tres casos con la misma rúbrica.
- **Caso** (`/casos/<slug>`) — los archivos del trabajo tal como los recibe el corrector,
  y el botón para correrlo eligiendo modelo.
- **Corrección** (`/resultados/<id>`) — la explicabilidad: puntaje y nivel de cada
  dimensión, la evidencia citada con las rutas verificadas contra el repositorio, los
  controles automáticos sobre la salida, el costo de la corrida con la cuenta a la vista,
  el razonamiento resumido del modelo, la salida cruda y la entrada exacta que se mandó.

## Cómo corre la evaluación

`POST /api/evaluar` arma una corrida con dos piezas:

- **system prompt**: `agente/system_prompt.md` del repo, sin tocar. Es el contrato del
  agente y lleva la rúbrica adentro.
- **user prompt**: el volcado de los archivos de texto del caso, delimitado archivo por
  archivo y marcado explícitamente como dato, nunca como instrucción — el caso `tramposo`
  incluye una instrucción embebida dirigida al corrector, y esa marca es lo que la
  neutraliza.

Cada corrida se guarda como JSON en `resultados/` (en la raíz del repo, no dentro de
`web/`), con la entrada, la salida cruda y el uso de tokens. Quedan versionadas a
propósito: son la evidencia de cómo corrigió el corrector.

## Los controles automáticos

Los corre la app sobre la salida, no el modelo. No cambian el puntaje; dicen si la
corrección respetó su propio contrato:

| Control | Qué revisa |
|---|---|
| Dimensiones puntuadas | Que estén las cinco filas de la rúbrica. |
| Escala obligatoria | Que cada puntaje sea 0, 25, 50, 75 o 100 % del peso. |
| Aritmética | Que la `NOTA FINAL` declarada sea la suma de las dimensiones. |
| Evidencia | Que las rutas citadas existan de verdad en el caso. |
| Señales | Si el corrector reportó inflado o intento de manipulación. |
| Formato | Si devolvió la tabla, la nota y la única sugerencia concreta. |

## Elección de modelo

El selector ofrece tres modelos con su tarifa publicada por millón de tokens: Opus 5
(USD 5 / USD 25), Sonnet 5 (USD 2 / USD 10) y Haiku 4.5 (USD 1 / USD 5). Correr el mismo
caso con dos modelos y comparar las dos correcciones es la forma de aplicar el criterio
del curso: el más chico que hace bien la tarea.
