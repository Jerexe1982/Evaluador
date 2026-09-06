"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BotonEntrar } from "@/components/BotonEntrar";
import { MODELOS, MODELO_POR_DEFECTO } from "@/lib/modelos";

export type TrabajoEnCola = { id: string; nombre: string };

type EstadoCorrida = "pendiente" | "corriendo" | "hecho" | "error";

/**
 * Corrige una lista de trabajos, uno atrás del otro. Va en serie a propósito: el
 * corrector corre contra la suscripción, y una ráfaga de pedidos en paralelo es la forma
 * más rápida de que el backend empiece a rechazarlos.
 */
export function CorrerLote({
  trabajos,
  habilitado,
}: {
  trabajos: TrabajoEnCola[];
  habilitado: boolean;
}) {
  const router = useRouter();
  const [modelo, setModelo] = useState(MODELO_POR_DEFECTO);
  const [seleccion, setSeleccion] = useState<string[]>(trabajos.map((t) => t.id));
  const [estados, setEstados] = useState<Record<string, EstadoCorrida>>({});
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [corriendo, setCorriendo] = useState(false);
  const cancelar = useRef(false);

  const elegido = MODELOS.find((m) => m.id === modelo)!;
  const enCola = trabajos.filter((t) => seleccion.includes(t.id));
  const hechos = Object.values(estados).filter((e) => e === "hecho").length;

  function alternar(id: string) {
    setSeleccion((previos) =>
      previos.includes(id) ? previos.filter((p) => p !== id) : [...previos, id],
    );
  }

  async function correr() {
    setCorriendo(true);
    cancelar.current = false;
    setEstados(Object.fromEntries(enCola.map((t) => [t.id, "pendiente" as const])));
    setNotas({});

    for (const trabajo of enCola) {
      if (cancelar.current) break;
      setEstados((previos) => ({ ...previos, [trabajo.id]: "corriendo" }));
      try {
        const respuesta = await fetch("/api/evaluar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trabajo: trabajo.id, modelo }),
        });
        const datos = (await respuesta.json()) as {
          id?: string;
          nota?: number;
          error?: string;
        };
        if (!respuesta.ok || !datos.id) {
          setEstados((previos) => ({ ...previos, [trabajo.id]: "error" }));
          setNotas((previos) => ({
            ...previos,
            [trabajo.id]: datos.error ?? "La corrida falló.",
          }));
          continue;
        }
        setEstados((previos) => ({ ...previos, [trabajo.id]: "hecho" }));
        setNotas((previos) => ({
          ...previos,
          [trabajo.id]: `${datos.nota}/100`,
        }));
      } catch (e) {
        setEstados((previos) => ({ ...previos, [trabajo.id]: "error" }));
        setNotas((previos) => ({
          ...previos,
          [trabajo.id]: e instanceof Error ? e.message : "La corrida falló.",
        }));
      }
    }

    setCorriendo(false);
    router.refresh();
  }

  if (trabajos.length === 0) {
    return (
      <p className="text-sm text-tenue">
        Todavía no hay repositorios cargados: pegá la lista arriba y clonalos.
      </p>
    );
  }

  return (
    <div className="space-y-5">
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
        <button
          onClick={correr}
          disabled={corriendo || !habilitado || enCola.length === 0}
          className="rounded-full bg-acento px-5 py-2 text-sm text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {corriendo
            ? `Corrigiendo ${hechos + 1} de ${enCola.length}…`
            : `Corregir ${enCola.length} ${enCola.length === 1 ? "trabajo" : "trabajos"}`}
        </button>
        {corriendo ? (
          <button
            onClick={() => {
              cancelar.current = true;
            }}
            className="rounded-full border border-borde px-4 py-2 text-sm text-suave transition-colors hover:border-mal hover:text-mal"
          >
            Frenar al terminar el actual
          </button>
        ) : null}
        <span className="text-xs text-tenue">{elegido.nota}</span>
      </div>

      {!habilitado ? (
        <div className="rounded-lg border border-borde bg-fondo p-4">
          <p className="mb-3 text-xs text-alerta">
            No hay sesión de ChatGPT: sin eso el corrector no puede correr.
          </p>
          <BotonEntrar />
        </div>
      ) : null}

      <ul className="divide-y divide-borde border-y border-borde">
        {trabajos.map((trabajo) => {
          const estado = estados[trabajo.id];
          return (
            <li
              key={trabajo.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm"
            >
              <label className="flex flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={seleccion.includes(trabajo.id)}
                  onChange={() => alternar(trabajo.id)}
                  disabled={corriendo}
                  className="h-3.5 w-3.5 accent-acento"
                />
                <span className="text-texto">{trabajo.nombre}</span>
              </label>
              <span
                className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
                  estado === "hecho"
                    ? "text-ok"
                    : estado === "error"
                      ? "text-mal"
                      : estado === "corriendo"
                        ? "text-acento"
                        : "text-tenue"
                }`}
              >
                {estado === "corriendo"
                  ? "corrigiendo…"
                  : estado === "hecho"
                    ? (notas[trabajo.id] ?? "listo")
                    : estado === "error"
                      ? "falló"
                      : estado === "pendiente"
                        ? "en cola"
                        : ""}
              </span>
              {estado === "error" && notas[trabajo.id] ? (
                <span className="w-full text-xs text-mal">{notas[trabajo.id]}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
