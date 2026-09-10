import type { Esfuerzo } from "./tipos";

/** Formatos y colores compartidos por las vistas. */

export type Estado = "ok" | "alerta" | "error" | "pendiente";

export function fecha(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Compacto para los listados: "24,1k tokens". */
/**
 * El esfuerzo, en una palabra. Un resultado sin el campo es de antes de que fuera
 * elegible, y esas corridas fueron todas con esfuerzo medio.
 */
export function esfuerzoCorto(esfuerzo: Esfuerzo | undefined): string {
  return { low: "bajo", medium: "medio", high: "alto" }[esfuerzo ?? "medium"];
}

export function tokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")}k tokens` : `${n} tokens`;
}

export function miles(n: number): string {
  return n.toLocaleString("es-AR");
}

export function bytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} kB`;
}

/** Números de puntaje: sin decimales cuando son enteros, con coma cuando no. */
export function puntos(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}

/** Diferencia con signo, para las brechas contra el criterio humano. */
export function conSigno(n: number): string {
  return `${n > 0 ? "+" : n < 0 ? "−" : "±"}${puntos(Math.abs(n))}`;
}

/** Verde arriba de 75, ámbar entre 50 y 75, rojo abajo. Sobre 100. */
export function colorNota(nota: number): string {
  if (nota >= 75) return "text-ok";
  if (nota >= 50) return "text-alerta";
  return "text-mal";
}

export function colorBarra(porcentaje: number): string {
  if (porcentaje >= 75) return "bg-ok";
  if (porcentaje >= 50) return "bg-alerta";
  if (porcentaje > 0) return "bg-mal";
  return "bg-white/25";
}

export function colorEstado(estado: Estado): string {
  if (estado === "ok") return "text-ok";
  if (estado === "alerta") return "text-alerta";
  if (estado === "error") return "text-mal";
  return "text-tenue";
}

/** Cómo se nombra cada estado en la interfaz. Una sola palabra, siempre la misma. */
export const TEXTO_ESTADO: Record<Estado, string> = {
  ok: "Pasa",
  alerta: "Con reservas",
  error: "No pasa",
  pendiente: "Pendiente",
};

export const SIMBOLO_ESTADO: Record<Estado, string> = {
  ok: "✓",
  alerta: "!",
  error: "✕",
  pendiente: "·",
};
