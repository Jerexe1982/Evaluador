"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { bytes } from "@/lib/formato";

export type ArchivoConTexto = { ruta: string; bytes: number; texto: string | null };

function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Busca la cita en el texto tolerando los saltos de línea y los espacios que el corrector
 * normaliza al citar. Devuelve el tramo exacto del archivo, o null si la cita no está:
 * que no aparezca es información, no un error del visor.
 */
function ubicarCita(texto: string, cita: string): { desde: number; hasta: number } | null {
  const directo = texto.toLowerCase().indexOf(cita.toLowerCase());
  if (directo !== -1) return { desde: directo, hasta: directo + cita.length };

  const palabras = cita.trim().split(/\s+/).map(escapar);
  if (palabras.length === 0) return null;
  const flexible = new RegExp(palabras.join("[\\s\\n]+"), "i");
  const encontrado = texto.match(flexible);
  if (!encontrado || encontrado.index === undefined) return null;
  return { desde: encontrado.index, hasta: encontrado.index + encontrado[0].length };
}

function Contenido({
  texto,
  cita,
  busqueda,
}: {
  texto: string;
  cita: string | null;
  busqueda: string;
}) {
  const marca = useRef<HTMLElement>(null);
  const ubicacion = cita ? ubicarCita(texto, cita) : null;

  useEffect(() => {
    marca.current?.scrollIntoView({ block: "center" });
  }, [texto, cita]);

  if (ubicacion) {
    return (
      <>
        {texto.slice(0, ubicacion.desde)}
        <mark ref={marca} className="rounded bg-acento/85 px-0.5 text-black">
          {texto.slice(ubicacion.desde, ubicacion.hasta)}
        </mark>
        {texto.slice(ubicacion.hasta)}
      </>
    );
  }

  const termino = busqueda.trim();
  if (termino.length >= 2) {
    const partes = texto.split(new RegExp(`(${escapar(termino)})`, "gi"));
    return (
      <>
        {partes.map((parte, i) =>
          i % 2 === 1 ? (
            <mark key={i} className="rounded bg-acento/40 px-0.5 text-texto">
              {parte}
            </mark>
          ) : (
            <span key={i}>{parte}</span>
          ),
        )}
      </>
    );
  }

  return <>{texto}</>;
}

/**
 * Los archivos del trabajo, tal como los ve el corrector. Sirve para lo que la
 * explicabilidad necesita: abrir la ruta que el corrector citó y encontrar la cita
 * resaltada en su contexto, sin salir de la app.
 */
export function VisorArchivos({
  archivos,
  rutaInicial,
  citaInicial,
}: {
  archivos: ArchivoConTexto[];
  rutaInicial?: string;
  citaInicial?: string;
}) {
  const [ruta, setRuta] = useState(rutaInicial ?? archivos[0]?.ruta ?? "");
  const [busqueda, setBusqueda] = useState("");
  const [cita, setCita] = useState(citaInicial ?? "");

  const termino = busqueda.trim().toLowerCase();
  const visibles = useMemo(() => {
    if (termino.length < 2) return archivos;
    return archivos.filter(
      (a) =>
        a.ruta.toLowerCase().includes(termino) ||
        (a.texto ?? "").toLowerCase().includes(termino),
    );
  }, [archivos, termino]);

  const actual = archivos.find((a) => a.ruta === ruta);
  const citaUbicada =
    cita && actual?.texto ? ubicarCita(actual.texto, cita) !== null : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar en los archivos del trabajo…"
          className="min-w-56 flex-1 rounded-lg border border-borde bg-fondo px-3 py-2 text-sm text-texto placeholder:text-tenue focus:border-borde-fuerte focus:outline-none"
        />
        <span className="font-mono text-[11px] text-tenue">
          {visibles.length === archivos.length
            ? `${archivos.length} archivos`
            : `${visibles.length} de ${archivos.length} archivos`}
        </span>
      </div>

      {cita ? (
        <div
          className={`flex flex-wrap items-baseline justify-between gap-3 rounded-lg border px-4 py-2.5 text-sm ${
            citaUbicada === false
              ? "border-mal/40 bg-mal/5 text-mal"
              : "border-acento/30 bg-acento/5"
          }`}
        >
          <span>
            {citaUbicada === false
              ? "El corrector citó este fragmento y no aparece en el archivo: "
              : "Cita del corrector, resaltada abajo: "}
            <span className="italic text-texto">“{cita}”</span>
          </span>
          <button
            onClick={() => setCita("")}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-tenue hover:text-texto"
          >
            quitar
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[17rem_1fr]">
        <ul className="max-h-[32rem] space-y-0.5 overflow-auto pr-1 text-xs">
          {visibles.map((archivo) => (
            <li key={archivo.ruta}>
              <button
                onClick={() => {
                  setRuta(archivo.ruta);
                  if (archivo.ruta !== ruta) setCita("");
                }}
                className={`w-full rounded px-2 py-1.5 text-left font-mono transition-colors ${
                  archivo.ruta === ruta
                    ? "bg-acento text-black"
                    : "text-suave hover:bg-white/6"
                }`}
              >
                {archivo.ruta}
                <span className={archivo.ruta === ruta ? "opacity-70" : "text-tenue"}>
                  {" "}
                  · {bytes(archivo.bytes)}
                </span>
              </button>
            </li>
          ))}
          {visibles.length === 0 ? (
            <li className="px-2 py-2 text-tenue">
              Ningún archivo contiene «{busqueda.trim()}».
            </li>
          ) : null}
        </ul>
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-borde bg-fondo p-4 font-mono text-xs leading-relaxed text-suave">
          {actual?.texto ? (
            <Contenido texto={actual.texto} cita={cita || null} busqueda={busqueda} />
          ) : (
            "Archivo binario: no se manda al corrector."
          )}
        </pre>
      </div>
    </div>
  );
}
