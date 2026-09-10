import { createHash } from "node:crypto";

/**
 * Corrección a ciegas: el corrector no tiene por qué saber de quién es el trabajo que
 * corrige.
 *
 * Por qué existe. El agente que gane la prueba de fuego corrige *todos* los trabajos
 * finales, incluidos los de quienes lo construimos. Hasta el 10/09 el user prompt le
 * decía la URL del repositorio —`https://github.com/JLeonStack/agents-final`—, el nombre
 * de cada autor en la historia de commits y, en los casos de prueba, la carpeta del caso:
 * `casos/tramposo/` le anunciaba cuál era el tramposo antes de leer un archivo. Nada de
 * eso es evidencia de ninguna dimensión de la rúbrica, y todo eso puede mover un puntaje.
 *
 * Qué hace y qué no. Reemplaza la identidad que agrega la app —procedencia y autores del
 * `git log`— por un seudónimo estable. No toca el contenido del trabajo: si el README
 * lleva los nombres de los integrantes, el corrector los va a leer, porque son parte del
 * artefacto que se evalúa y borrarlos sería alterar la evidencia. No es anonimato
 * criptográfico: con la lista de repositorios candidatos, el hash se rehace. Es lo que
 * hace falta para que la identidad no esté a la vista mientras se puntúa.
 *
 * La procedencia real no se pierde: queda en `trabajos/.origenes.json` y en el campo
 * `origen` de cada corrida guardada, que es donde tiene que estar para poder auditar qué
 * commit se corrigió.
 */

/**
 * Seudónimo estable de un trabajo, derivado de su id. El mismo trabajo recibe siempre la
 * misma etiqueta, así dos corridas del mismo repositorio se pueden comparar entre sí.
 */
export function seudonimoDeTrabajo(id: string): string {
  const huella = createHash("sha256").update(id).digest("hex").slice(0, 4).toUpperCase();
  return `TRABAJO-${huella}`;
}

/**
 * Devuelve un traductor de nombres a `autor-1`, `autor-2`… en orden de aparición. Se pide
 * uno por corrida: dentro de una misma historia de commits los alias son consistentes
 * —cuántas personas distintas commitearon sigue siendo verificable, que es lo que la
 * rúbrica mira— y entre trabajos distintos no significan nada.
 */
export function seudonimizadorDeAutores(): (nombre: string) => string {
  const alias = new Map<string, string>();
  return (nombre) => {
    const conocido = alias.get(nombre);
    if (conocido) return conocido;
    const nuevo = `autor-${alias.size + 1}`;
    alias.set(nombre, nuevo);
    return nuevo;
  };
}
