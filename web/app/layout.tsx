import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agente corrector — MBA UCEMA",
  description:
    "Tablero del agente corrector: la prueba de los tres casos, la calibración contra el criterio humano y la evidencia de cada punto.",
};

const NAVEGACION = [
  { href: "/", texto: "Tablero" },
  { href: "/trabajos", texto: "Trabajos" },
  { href: "/rubrica", texto: "Rúbrica" },
  { href: "/calibracion", texto: "Calibración" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-fondo font-sans">
        <header className="sticky top-0 z-10 border-b border-borde bg-fondo/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-acento" />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-texto">
                  Agente corrector
                </span>
              </Link>
              <nav className="flex items-center gap-6">
                {NAVEGACION.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="font-mono text-[10px] uppercase tracking-[0.22em] text-tenue transition-colors hover:text-texto"
                  >
                    {item.texto}
                  </Link>
                ))}
              </nav>
            </div>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-tenue lg:block">
              Programación de y con Agentes de IA · MBA UCEMA
            </p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">{children}</main>
        <footer className="border-t border-borde px-6 py-6">
          <p className="mx-auto max-w-6xl font-mono text-[10px] uppercase tracking-[0.22em] text-tenue">
            Rúbrica: rubrica.md · Contrato: agente/system_prompt.md · Corridas: resultados/
          </p>
        </footer>
      </body>
    </html>
  );
}
