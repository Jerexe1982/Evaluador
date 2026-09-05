# User prompt del corrector

El mismo texto en todas las corridas. No se personaliza por caso: si cambia entre corridas,
las salidas dejan de ser comparables y el test-retest pierde sentido.

```
Actuá según tu system prompt de corrector.

Evaluá este trabajo final: [URL del repositorio, o el contenido completo adjunto].

Leé todos los archivos siguiendo el protocolo de evidencia antes de puntuar.
Devolvé únicamente el formato de salida definido, sin texto adicional.
```

## Cómo se corre

1. Conversación nueva y limpia por cada corrida. Nunca dos corridas en el mismo hilo: el corrector
   arrastraría el criterio de la anterior y el test-retest daría una consistencia falsa.
2. Se pega el system prompt completo de `agente/system_prompt.md`, sin recortar.
3. Se pega este user prompt con el caso apuntado.
4. La salida se guarda tal como salió, sin editar ni corregir. Corriendo desde la app (`web/`),
   eso pasa solo: cada corrida queda en `resultados/<caso>__<fecha>.json` con la entrada exacta,
   el modelo, los tokens, el costo y las verificaciones. Si se corre a mano en un chat, la salida
   va a `agente/corridas/caso-<excelente|flojo|tramposo>-ronda-<N>.md`, con fecha y modelo en la
   primera línea.
5. Las corridas se commitean. Son la evidencia de que el corrector funciona: sin ellas, ese 25 %
   del parcial no tiene respaldo.
