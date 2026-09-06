"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Borra el clon de un repositorio. Las corridas que produjo quedan guardadas. */
export function BotonQuitar({ id }: { id: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [quitando, setQuitando] = useState(false);

  async function quitar() {
    setQuitando(true);
    try {
      await fetch("/api/trabajos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setQuitando(false);
      setConfirmando(false);
    }
  }

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-tenue transition-colors hover:text-mal"
      >
        Quitar
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <button
        onClick={quitar}
        disabled={quitando}
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-mal disabled:opacity-40"
      >
        {quitando ? "Quitando…" : "Confirmar"}
      </button>
      <button
        onClick={() => setConfirmando(false)}
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-tenue"
      >
        No
      </button>
    </span>
  );
}
