import type { Esfuerzo } from "./tipos";

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
 * Cuánto razona el modelo antes de contestar. Era fijo en "medium" para que la
 * comparación entre modelos no midiera el esfuerzo; ahora se elige por corrida, así
 * que el esfuerzo queda guardado en el resultado y las tandas de consistencia se
 * agrupan también por él: dos corridas con esfuerzo distinto no son la misma prueba.
 */
export type OpcionEsfuerzo = {
  id: Esfuerzo;
  nombre: string;
  nota: string;
};

export const ESFUERZOS: OpcionEsfuerzo[] = [
  {
    id: "low",
    nombre: "Esfuerzo bajo",
    nota: "Contesta rápido y razona poco. Sirve para ver qué parte de la corrección aguanta sin pensar.",
  },
  {
    id: "medium",
    nombre: "Esfuerzo medio",
    nota: "El de todas las corridas guardadas hasta ahora: es el que hace comparables las tandas viejas.",
  },
  {
    id: "high",
    nombre: "Esfuerzo alto",
    nota: "Razona más antes de puntuar. Tarda y gasta más, y es donde conviene mirar si baja la varianza.",
  },
];

/** El de siempre: cambiarlo movería la base de comparación de todo lo ya corrido. */
export const ESFUERZO_POR_DEFECTO: Esfuerzo = "medium";

export function buscarEsfuerzo(id: string): OpcionEsfuerzo | undefined {
  return ESFUERZOS.find((e) => e.id === id);
}

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
