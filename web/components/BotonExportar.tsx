"use client";

import { useState } from "react";

/** Regenera calibracion.md en la raíz del repo con lo que la app tiene cargado. */
export function BotonExportar() {
  const [estado, setEstado] = useState<"listo" | "escribiendo" | "hecho" | "error">(
    "listo",
  );
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function exportar() {
    setEstado("escribiendo");
    try {
      const respuesta = await fetch("/api/calibracion", { method: "PUT" });
      const datos = (await respuesta.json()) as { archivo?: string; error?: string };
      if (!respuesta.ok) {
        setEstado("error");
        setMensaje(datos.error ?? "No se pudo escribir el archivo.");
        return;
      }
      setEstado("hecho");
      setMensaje("calibracion.md quedó regenerado en la raíz del repo.");
    } catch (e) {
      setEstado("error");
      setMensaje(e instanceof Error ? e.message : "No se pudo escribir el archivo.");
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={exportar}
        disabled={estado === "escribiendo"}
        className="rounded-full border border-borde-fuerte px-4 py-2 text-sm text-texto transition-colors hover:border-acento hover:text-acento disabled:opacity-40"
      >
        {estado === "escribiendo" ? "Escribiendo…" : "Regenerar calibracion.md"}
      </button>
      {mensaje ? (
        <p className={`mt-2 text-xs ${estado === "error" ? "text-mal" : "text-ok"}`}>
          {mensaje}
        </p>
      ) : null}
    </div>
  );
}
