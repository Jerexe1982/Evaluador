"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Etiqueta } from "@/components/ui";

type Alta = { entrada: string; id?: string; error?: string };

/**
 * Alta de trabajos por lista: se pegan las URLs de los repos —una por línea— y la app
 * los clona. Es la puerta de entrada para corregir entregas reales, no sólo los casos
 * de prueba del repo.
 */
export function AltaRepos() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [clonando, setClonando] = useState(false);
  const [altas, setAltas] = useState<Alta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const entradas = texto
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  async function clonar() {
    setClonando(true);
    setError(null);
    setAltas(null);
    try {
      const respuesta = await fetch("/api/trabajos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entradas }),
      });
      const datos = (await respuesta.json()) as { altas?: Alta[]; error?: string };
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudieron clonar los repositorios.");
        return;
      }
      setAltas(datos.altas ?? []);
      setTexto((datos.altas ?? []).filter((a) => a.error).map((a) => a.entrada).join("\n"));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron clonar los repositorios.");
    } finally {
      setClonando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Etiqueta>Un repositorio por línea</Etiqueta>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={6}
          spellCheck={false}
          placeholder={"https://github.com/grupo-1/trabajo-final\ngrupo-2/agente-final\nhttps://github.com/grupo-3/tp#readme"}
          className="mt-2 w-full rounded-lg border border-borde bg-fondo p-3 font-mono text-xs leading-relaxed text-texto placeholder:text-tenue"
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={clonar}
          disabled={clonando || entradas.length === 0}
          className="rounded-full bg-acento px-5 py-2 text-sm text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {clonando
            ? "Clonando…"
            : `Clonar ${entradas.length || ""} ${entradas.length === 1 ? "repositorio" : "repositorios"}`.trim()}
        </button>
        <span className="text-xs text-tenue">
          Sólo repos públicos. Se pide el clon con los últimos 200 commits: el corrector
          mira la historia, no sólo el estado final.
        </span>
      </div>
      {error ? <p className="text-xs text-mal">{error}</p> : null}
      {altas ? (
        <ul className="space-y-1.5 text-xs">
          {altas.map((alta) => (
            <li key={alta.entrada} className="flex gap-3">
              <span className={alta.error ? "text-mal" : "text-ok"}>
                {alta.error ? "✕" : "✓"}
              </span>
              <span>
                <span className="font-mono text-suave">{alta.entrada}</span>
                {alta.error ? (
                  <span className="block text-tenue">{alta.error}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
