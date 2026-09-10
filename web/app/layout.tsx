import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Navegacion } from "@/components/Navegacion";
import { SesionEncabezado } from "@/components/SesionEncabezado";
import { resumenSesion } from "@/lib/credenciales";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agente corrector — MBA UCEMA",
  description:
    "Tablero del agente corrector: la prueba de los tres casos, la calibración contra el criterio humano y la evidencia de cada punto.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const sesion = resumenSesion();

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-fondo font-sans">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-full focus:bg-acento focus:px-4 focus:py-2 focus:text-sm focus:text-black"
        >
          Saltar al contenido
        </a>
        <header className="sticky top-0 z-10 border-b border-borde bg-fondo/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-3.5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-acento" />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-texto">
                  Agente corrector
                </span>
              </Link>
              <Navegacion />
            </div>
            <SesionEncabezado sesion={sesion} />
          </div>
        </header>
        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
          {children}
        </main>
        <footer className="border-t border-borde px-6 py-6">
          <p className="mx-auto max-w-6xl font-mono text-[10px] uppercase tracking-[0.22em] text-tenue">
            Rúbrica: rubrica.md · Contrato: agente/system_prompt.md · Corridas: resultados/
          </p>
        </footer>
      </body>
    </html>
  );
}
