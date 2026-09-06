"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Etiqueta } from "@/components/ui";
import { DIMENSIONES, ETIQUETA_NIVEL, NIVELES } from "@/lib/rubrica";
import type { ClaveDimension, NotaHumana } from "@/lib/tipos";

/**
 * La nota que le hubiera puesto el grupo, con la misma escala que usa el agente.
 * Se guarda en el repo (`calibracion/notas-humanas.json`) porque es evidencia del
 * parcial, no estado de la app.
 */
export function FormularioCalibracion({
  caso,
  humano,
  pesos,
}: {
  caso: string;
  humano: NotaHumana;
  pesos: Record<string, number>;
}) {
  const router = useRouter();
  const [niveles, setNiveles] = useState<Record<string, number | "">>(() =>
    Object.fromEntries(
      DIMENSIONES.map((d) => [d.clave, humano.niveles[d.clave] ?? ""]),
    ),
  );
  const [comentario, setComentario] = useState(humano.comentario);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nota = DIMENSIONES.reduce((suma, d) => {
    const nivel = niveles[d.clave];
    return suma + (nivel === "" ? 0 : (Number(nivel) * pesos[d.clave]) / 100);
  }, 0);
  const completa = DIMENSIONES.every((d) => niveles[d.clave] !== "");

  async function guardar() {
    setGuardando(true);
    setError(null);
    setAviso(null);
    try {
      const limpios: Record<string, number> = {};
      for (const dimension of DIMENSIONES) {
        const nivel = niveles[dimension.clave];
        if (nivel !== "") limpios[dimension.clave] = Number(nivel);
      }
      const respuesta = await fetch("/api/calibracion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caso, niveles: limpios, comentario }),
      });
      const datos = (await respuesta.json()) as { error?: string };
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo guardar.");
        return;
      }
      setAviso("Guardado en calibracion/notas-humanas.json.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {DIMENSIONES.map((dimension) => (
          <div
            key={dimension.clave}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="min-w-40">
              <p className="text-sm text-texto">{dimension.nombre}</p>
              <p className="text-xs text-tenue">peso {dimension.peso}</p>
            </div>
            <select
              value={niveles[dimension.clave]}
              onChange={(e) =>
                setNiveles((previos) => ({
                  ...previos,
                  [dimension.clave as ClaveDimension]:
                    e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              className="min-w-64 rounded-lg border border-borde bg-fondo px-3 py-2 text-sm text-texto"
            >
              <option value="">Sin puntuar</option>
              {NIVELES.map((nivel) => (
                <option key={nivel} value={nivel}>
                  {nivel}% · {ETIQUETA_NIVEL[nivel]} ·{" "}
                  {((nivel * dimension.peso) / 100).toString().replace(".", ",")}/
                  {dimension.peso}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div>
        <Etiqueta>Criterio del grupo</Etiqueta>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={4}
          placeholder="Qué pesó en la decisión, qué se discutió, con qué evidencia."
          className="mt-2 w-full rounded-lg border border-borde bg-fondo p-3 text-sm text-texto placeholder:text-tenue"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={guardar}
          disabled={guardando}
          className="rounded-full bg-acento px-5 py-2 text-sm font-normal text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {guardando ? "Guardando…" : "Guardar la nota del grupo"}
        </button>
        <span className="text-sm text-tenue">
          Nota del grupo:{" "}
          <span className="tabular-nums text-texto">
            {(Math.round(nota * 100) / 100).toString().replace(".", ",")}/100
          </span>
          {completa ? "" : " · faltan dimensiones por puntuar"}
        </span>
      </div>
      {aviso ? <p className="text-xs text-ok">{aviso}</p> : null}
      {error ? <p className="text-xs text-mal">{error}</p> : null}
    </div>
  );
}
