import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agente corrector — MBA UCEMA",
  description:
    "Resultados del agente corrector: correr la evaluación de un caso y ver de dónde sale cada puntaje.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-borde bg-panel">
          <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-4 px-6 py-4">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              Agente corrector
            </Link>
            <p className="text-xs text-tenue">
              Programación de y con Agentes de IA · MBA UCEMA
            </p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-borde px-6 py-4 text-center text-xs text-tenue">
          La rúbrica vive en <code className="font-mono">rubrica.md</code>; el contrato del
          agente, en <code className="font-mono">agente/system_prompt.md</code>.
        </footer>
      </body>
    </html>
  );
}
