/** Formatos y colores compartidos por las vistas. */

export function fecha(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function usd(monto: number): string {
  return `USD ${monto.toFixed(4)}`;
}

export function miles(n: number): string {
  return n.toLocaleString("es-AR");
}

export function bytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} kB`;
}

/** Verde arriba de 75, ámbar entre 50 y 75, rojo abajo. Sobre 100. */
export function colorNota(nota: number): string {
  if (nota >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (nota >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function colorBarra(porcentaje: number): string {
  if (porcentaje >= 75) return "bg-emerald-500";
  if (porcentaje >= 50) return "bg-amber-500";
  if (porcentaje > 0) return "bg-red-500";
  return "bg-zinc-400";
}

export function colorEstado(estado: "ok" | "alerta" | "error"): string {
  if (estado === "ok") return "text-emerald-600 dark:text-emerald-400";
  if (estado === "alerta") return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export const SIMBOLO_ESTADO: Record<"ok" | "alerta" | "error", string> = {
  ok: "✓",
  alerta: "!",
  error: "✕",
};
