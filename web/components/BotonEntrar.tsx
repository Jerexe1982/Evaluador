"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Estado =
  | { fase: "inactivo" }
  | { fase: "esperando"; url: string }
  | { fase: "listo"; plan: string | null }
  | { fase: "error"; mensaje: string };

const INTERVALO_MS = 1500;

/**
 * `compacto` es la variante del encabezado: el mismo login, con el tamaño de la
 * barra y los avisos en un panel flotante para no empujar el resto de la fila.
 *
 * Dispara el OAuth con ChatGPT: abre la pantalla de OpenAI en otra pestaña y
 * espera a que el servidor reciba el código. La sesión queda guardada donde la
 * busca el CLI de Codex, así que sirve para las dos cosas.
 */
export function BotonEntrar({ compacto = false }: { compacto?: boolean }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ fase: "inactivo" });
  const [error, setError] = useState<string | null>(null);
  const sondeo = useRef<ReturnType<typeof setInterval> | null>(null);

  function frenarSondeo() {
    if (sondeo.current) clearInterval(sondeo.current);
    sondeo.current = null;
  }

  useEffect(() => frenarSondeo, []);

  async function entrar() {
    setError(null);
    try {
      const respuesta = await fetch("/api/login", { method: "POST" });
      const datos = (await respuesta.json()) as { url?: string; error?: string };
      if (!respuesta.ok || !datos.url) {
        setError(datos.error ?? "No se pudo iniciar el login.");
        return;
      }

      setEstado({ fase: "esperando", url: datos.url });
      window.open(datos.url, "_blank", "noopener,noreferrer");

      frenarSondeo();
      sondeo.current = setInterval(async () => {
        const actual = (await fetch("/api/login").then((r) => r.json())) as Estado;
        setEstado(actual);
        // Cualquier fase que no sea "esperando" cierra el login: si se sigue
        // sondeando, el pedido queda repitiéndose para siempre.
        if (actual.fase !== "esperando") frenarSondeo();
        if (actual.fase === "listo") router.refresh();
      }, INTERVALO_MS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar el login.");
    }
  }

  const esperando = estado.fase === "esperando";
  const mensaje = estado.fase === "error" ? estado.mensaje : error;

  const avisos =
    esperando || mensaje ? (
      <div className={compacto ? "space-y-2" : "space-y-2"}>
        {esperando ? (
          <p className="text-xs text-tenue">
            Se abrió la pantalla de OpenAI en otra pestaña. Si el navegador la bloqueó,{" "}
            <a
              href={estado.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-acento underline"
            >
              abrila desde acá
            </a>
            .
          </p>
        ) : null}
        {mensaje ? <p className="text-xs text-mal">{mensaje}</p> : null}
      </div>
    ) : null;

  const boton = (
    <button
      onClick={entrar}
      disabled={esperando}
      className={
        compacto
          ? "rounded-full border border-borde px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-tenue transition-colors hover:bg-white/5 hover:text-suave disabled:opacity-40"
          : "rounded-full bg-acento px-5 py-2 text-sm text-black transition-opacity hover:opacity-90 disabled:opacity-40"
      }
    >
      {esperando ? "Esperando a OpenAI…" : compacto ? "Entrar" : "Entrar con ChatGPT"}
    </button>
  );

  if (compacto) {
    return (
      <div className="relative">
        {boton}
        {avisos ? (
          <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-borde bg-fondo p-3 shadow-lg">
            {avisos}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {boton}
      {avisos}
      <p className="text-xs text-tenue">
        Es el mismo login que hace <code className="font-mono">codex login</code>: la sesión
        queda en <code className="font-mono">~/.codex/auth.json</code> y la comparten la app
        y el CLI.
      </p>
    </div>
  );
}
