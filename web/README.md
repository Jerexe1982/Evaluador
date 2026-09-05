# App del agente corrector

Interfaz mínima para correr el agente corrector sobre los casos de `casos/`, ver la nota
que puso y entender de dónde sale cada punto.

## Correrla

```bash
cd web
npm install
codex login          # una sola vez, eligiendo «Sign in with ChatGPT»
npm run dev
```

Queda en `http://localhost:3000`. Sin sesión de ChatGPT la app abre igual: se ven los
casos, sus archivos y las corridas ya guardadas; el botón de correr queda deshabilitado.

No hace falta ninguna clave de API. La app corre el corrector contra el backend de Codex
—el que atiende a las suscripciones de ChatGPT Plus/Pro— usando la sesión que el CLI de
Codex deja en `~/.codex/auth.json`. Lee ese archivo, renueva el access token contra
`auth.openai.com` cuando venció y guarda el token rotado en el mismo lugar, para no dejar
al propio CLI sin sesión. El flujo está tomado del proveedor «OpenAI (ChatGPT Plus/Pro)»
del agente [pi](https://pi.dev/docs/latest/providers), que hace exactamente esto.

## Qué hace

- **Portada** — la última nota de cada caso, dimensión por dimensión, y la comparación
  entre los tres casos con la misma rúbrica.
- **Caso** (`/casos/<slug>`) — los archivos del trabajo tal como los recibe el corrector,
  y el botón para correrlo eligiendo modelo.
- **Corrección** (`/resultados/<id>`) — la explicabilidad: puntaje y nivel de cada
  dimensión, la evidencia citada con las rutas verificadas contra el repositorio, los
  controles automáticos sobre la salida, el consumo de tokens de la corrida,
  el razonamiento resumido del modelo, la salida cruda y la entrada exacta que se mandó.

## Cómo corre la evaluación

`POST /api/evaluar` manda un pedido a `chatgpt.com/backend-api/codex/responses` —la
Responses API de OpenAI, pero autenticada con la suscripción— armado con dos piezas:

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

El selector ofrece los modelos que la suscripción habilita vía Codex, del más capaz al más
chico: GPT-6-Astra, GPT-5.6-Sol, GPT-5.6-Terra, GPT-5.6-Luna, GPT-5.5 y GPT-5.4-Mini.
Todos corren con el mismo esfuerzo de razonamiento, así que la comparación mide el modelo
y no la configuración. Correr el mismo caso con varios modelos y comparar las correcciones
es la forma de aplicar el criterio del curso: el más chico que hace bien la tarea.

La lista es la de `lib/modelos.ts` y sale del catálogo que Codex expone para el plan. Si
alguna vez OpenAI renombra o retira un modelo, la corrida falla con el error del backend y
hay que actualizar esa lista.

Como la suscripción no factura por token, la app ya no muestra el costo en dólares sino el
consumo: tokens de entrada, de salida, de razonamiento y lo que se leyó del caché. El
límite pasa a ser el cupo del plan, no el presupuesto.
