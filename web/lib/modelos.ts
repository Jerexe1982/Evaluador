import type { Esfuerzo } from "./codex";

/**
 * Los tres modelos habilitados para correr el corrector: Sol, Luna y Terra. Son de
 * la misma generación a propósito —comparar entre generaciones mezcla el modelo con
 * el contrato— y la suscripción de ChatGPT los sirve vía Codex sin facturar por
 * token, así que la comparación es por calidad de corrección y por tiempo.
 *
 * Es la lista completa de lo permitido: la API rechaza cualquier otro id.
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
    id: "gpt-5.6-sol",
    nombre: "GPT-5.6-Sol",
    nota: "El más capaz de los tres. Es el que usamos para diseñar y calibrar la rúbrica.",
  },
  {
    id: "gpt-5.6-luna",
    nombre: "GPT-5.6-Luna",
    nota: "Rápido y barato dentro de su generación. Buen punto medio para probar el piso.",
  },
  {
    id: "gpt-5.6-terra",
    nombre: "GPT-5.6-Terra",
    nota: "Equilibrado. Sirve para comparar si la corrección se sostiene con menos modelo.",
  },
];
export const MODELO_POR_DEFECTO = MODELOS[0].id;

export function buscarModelo(id: string): Modelo | undefined {
  return MODELOS.find((m) => m.id === id);
}
