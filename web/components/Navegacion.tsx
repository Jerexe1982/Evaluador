"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAVEGACION = [
  { href: "/", texto: "Tablero" },
  { href: "/trabajos", texto: "Trabajos" },
  { href: "/rubrica", texto: "Rúbrica" },
  { href: "/calibracion", texto: "Calibración" },
];

/** Marca en qué parte del tablero está parado el que mira. */
export function Navegacion() {
  const ruta = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {NAVEGACION.map((item) => {
        const activo =
          item.href === "/"
            ? ruta === "/" || ruta.startsWith("/casos") || ruta.startsWith("/resultados")
            : ruta.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? "page" : undefined}
            className={`rounded-full px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors sm:px-3 sm:tracking-[0.22em] ${
              activo
                ? "bg-white/8 text-texto"
                : "text-tenue hover:bg-white/5 hover:text-suave"
            }`}
          >
            {item.texto}
          </Link>
        );
      })}
    </nav>
  );
}
