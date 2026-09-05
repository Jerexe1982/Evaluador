"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MODELOS, MODELO_POR_DEFECTO } from "@/lib/modelos";

/**
 * Dispara una corrida del corrector sobre el caso y, cuando termina, lleva
 * directamente al resultado.
 */
export function BotonCorrer({
  caso,
  habilitado,
  cantidadArchivos,
}: {
  caso: string;
  habilitado: boolean;
  cantidadArchivos: number;
}) {
  const router = useRouter();
  const [modelo, setModelo] = useState(MODELO_POR_DEFECTO);
  const [corriendo, setCorriendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elegido = MODELOS.find((m) => m.id === modelo)!;

  async function correr() {
    setCorriendo(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/evaluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caso, modelo }),
      });
      const datos = (await respuesta.json()) as { id?: string; error?: string };
      if (!respuesta.ok || !datos.id) {
        setError(datos.error ?? "La corrida falló.");
        return;
      }
      router.push(`/resultados/${datos.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "La corrida falló.");
    } finally {
      setCorriendo(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          disabled={corriendo}
          className="rounded border border-borde bg-fondo px-3 py-2 text-sm"
        >
          {MODELOS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
        <button
          onClick={correr}
          disabled={corriendo || !habilitado}
          className="rounded bg-texto px-4 py-2 text-sm font-medium text-fondo transition-opacity disabled:opacity-40"
        >
          {corriendo ? "Corrigiendo…" : "Correr el evaluador"}
        </button>
        <span className="text-xs text-tenue">
          Lo paga tu suscripción de ChatGPT, no una clave de API.
        </span>
      </div>
      <p className="text-xs text-tenue">{elegido.nota}</p>
      {!habilitado ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          No hay sesión de ChatGPT: corré <code className="font-mono">codex login</code> y
          elegí «Sign in with ChatGPT». La app lee la sesión que deja Codex en{" "}
          <code className="font-mono">~/.codex/auth.json</code>.
        </p>
      ) : null}
      {corriendo ? (
        <p className="text-xs text-tenue">
          El corrector está leyendo los {cantidadArchivos} archivos del caso y aplicando la
          rúbrica. Suele tardar entre 30 segundos y dos minutos.
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
