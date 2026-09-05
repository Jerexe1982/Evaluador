import type { Dimension } from "./tipos";

/** Las cinco dimensiones y sus pesos, tal como están en rubrica.md. No se modifican. */
export const DIMENSIONES: Dimension[] = [
  {
    clave: "sistema",
    nombre: "Sistema completo y funcionando",
    peso: 30,
    alias: ["sistema completo", "sistema"],
  },
  {
    clave: "proceso",
    nombre: "Proceso documentado",
    peso: 25,
    alias: ["proceso documentado", "proceso"],
  },
  {
    clave: "formato",
    nombre: "Formato y reproducibilidad",
    peso: 15,
    alias: ["formato y reproducibilidad", "formato"],
  },
  {
    clave: "economico",
    nombre: "Análisis económico",
    peso: 15,
    alias: ["analisis economico", "economico", "economía", "economia"],
  },
  {
    clave: "gobierno",
    nombre: "Gobierno y riesgo",
    peso: 15,
    alias: ["gobierno y riesgo", "gobierno", "riesgo"],
  },
];

/** Escala obligatoria: sólo estos cinco niveles, expresados en % del peso. */
export const NIVELES = [0, 25, 50, 75, 100] as const;

export const ETIQUETA_NIVEL: Record<number, string> = {
  0: "Sin evidencia",
  25: "Evidencia declarativa",
  50: "Evidencia parcial",
  75: "Evidencia sólida con faltantes",
  100: "Evidencia completa y reconstruible",
};

export function nivelDeclarado(puntaje: number, peso: number): number {
  return (puntaje / peso) * 100;
}

export function nivelEsValido(nivel: number): boolean {
  return NIVELES.some((n) => Math.abs(n - nivel) < 0.01);
}
