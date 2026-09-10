"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BotonEntrar } from "@/components/BotonEntrar";
import {
  ESFUERZOS,
  ESFUERZO_POR_DEFECTO,
  MODELOS,
  MODELO_POR_DEFECTO,
} from "@/lib/modelos";

/**
 * Dispara una corrida del corrector sobre el caso y, cuando termina, lleva
 * directamente al resultado.
 */
export function BotonCorrer({
  caso,
  habilitado,
  plan,
  cantidadArchivos,
}: {
  caso: string;
  habilitado: boolean;
  /** El plan de ChatGPT que paga la corrida, cuando hay sesión. */
  plan: string | null;
  cantidadArchivos: number;
}) {
  const router = useRouter();
  const [modelo, setModelo] = useState<string>(MODELO_POR_DEFECTO);
  const [esfuerzo, setEsfuerzo] = useState<string>(ESFUERZO_POR_DEFECTO);
  const [corriendo, setCorriendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elegido = MODELOS.find((m) => m.id === modelo)!;
  const esfuerzoElegido = ESFUERZOS.find((e) => e.id === esfuerzo)!;

  async function correr() {
    setCorriendo(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/evaluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caso, modelo, esfuerzo }),
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
          className="rounded-lg border border-borde bg-fondo px-3 py-2 text-sm text-texto"
        >
          {MODELOS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
        <select
          value={esfuerzo}
          onChange={(e) => setEsfuerzo(e.target.value)}
          disabled={corriendo}
          className="rounded-lg border border-borde bg-fondo px-3 py-2 text-sm text-texto"
          aria-label="Esfuerzo de razonamiento"
        >
          {ESFUERZOS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
        <button
          onClick={correr}
          disabled={corriendo || !habilitado}
          className="rounded-full bg-acento px-5 py-2 text-sm text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {corriendo ? "Corrigiendo…" : "Correr el evaluador"}
        </button>
        <span className="text-xs text-tenue">
          {habilitado
            ? `Lo paga tu suscripción de ChatGPT${plan ? ` (plan ${plan})` : ""}, no una clave de API.`
            : "La corrida la paga tu suscripción de ChatGPT, no una clave de API."}
        </span>
      </div>
      <p className="text-xs text-tenue">{elegido.nota}</p>
      <p className="text-xs text-tenue">{esfuerzoElegido.nota}</p>
      {!habilitado ? (
        <div className="rounded-lg border border-borde bg-fondo p-4">
          <p className="mb-3 text-xs text-alerta">
            No hay sesión de ChatGPT: sin eso el corrector no puede correr.
          </p>
          <BotonEntrar />
        </div>
      ) : null}
      {corriendo ? (
        <p className="text-xs text-tenue">
          El corrector está leyendo los {cantidadArchivos} archivos del caso y aplicando la
          rúbrica. Suele tardar entre 30 segundos y dos minutos.
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-mal">{error}</p>
      ) : null}
    </div>
  );
}
