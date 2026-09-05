import type { Esfuerzo } from "./codex";

/**
 * Modelos habilitados para correr el corrector. Son los que la suscripción de
 * ChatGPT ofrece a través de Codex: no se facturan por token, así que la
 * comparación entre ellos es por calidad de corrección y por tiempo, no por precio.
 */
export type Modelo = {
  id: string;
  nombre: string;
  nota: string;
};

/**
 * Fijo para todos: si cada modelo razonara distinto, la comparación mediría el
 * esfuerzo y no el modelo.
 */
export const ESFUERZO_RAZONAMIENTO: Esfuerzo = "medium";

export const MODELOS: Modelo[] = [
  {
    id: "gpt-6-astra",
    nombre: "GPT-6-Astra",
    nota: "El más capaz. Es el que usamos para diseñar y calibrar la rúbrica.",
  },
  {
    id: "gpt-5.6-sol",
    nombre: "GPT-5.6-Sol",
    nota: "El caballo de batalla de la generación anterior, para tareas de todos los días.",
  },
  {
    id: "gpt-5.6-terra",
    nombre: "GPT-5.6-Terra",
    nota: "Equilibrado. Sirve para comparar si la corrección se sostiene con menos modelo.",
  },
  {
    id: "gpt-5.6-luna",
    nombre: "GPT-5.6-Luna",
    nota: "Rápido y barato dentro de su generación. Buen punto medio para probar el piso.",
  },
  {
    id: "gpt-5.5",
    nombre: "GPT-5.5",
    nota: "Generación previa ya probada. Útil para ver si la rúbrica envejece bien.",
  },
  {
    id: "gpt-5.4-mini",
    nombre: "GPT-5.4-Mini",
    nota: "El más chico. El criterio del curso pide probar si alcanza para la tarea.",
  },
];
export const MODELO_POR_DEFECTO = MODELOS[0].id;

export function buscarModelo(id: string): Modelo | undefined {
  return MODELOS.find((m) => m.id === id);
}
