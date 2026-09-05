"use client";

import { useState } from "react";
import { bytes } from "@/lib/formato";

export type ArchivoConTexto = { ruta: string; bytes: number; texto: string | null };

/** Los archivos del caso, tal como los ve el corrector. */
export function VisorArchivos({
  archivos,
  rutaInicial,
}: {
  archivos: ArchivoConTexto[];
  rutaInicial?: string;
}) {
  const [ruta, setRuta] = useState(rutaInicial ?? archivos[0]?.ruta ?? "");
  const actual = archivos.find((a) => a.ruta === ruta);

  return (
    <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
      <ul className="space-y-0.5 text-xs">
        {archivos.map((archivo) => (
          <li key={archivo.ruta}>
            <button
              onClick={() => setRuta(archivo.ruta)}
              className={`w-full rounded px-2 py-1.5 text-left font-mono transition-colors ${
                archivo.ruta === ruta
                  ? "bg-texto text-fondo"
                  : "hover:bg-borde/60"
              }`}
            >
              {archivo.ruta}
              <span
                className={
                  archivo.ruta === ruta ? "opacity-70" : "text-tenue"
                }
              >
                {" "}
                · {bytes(archivo.bytes)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded border border-borde bg-fondo p-4 font-mono text-xs leading-relaxed">
        {actual?.texto ?? "Archivo binario: no se manda al corrector."}
      </pre>
    </div>
  );
}
