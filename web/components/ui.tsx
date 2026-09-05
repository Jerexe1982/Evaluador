import { colorBarra, colorNota } from "@/lib/formato";

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-borde bg-panel p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function Titulo({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold tracking-tight">{children}</h2>;
}

/** Nota sobre 100, con el color que le corresponde. */
export function Nota({
  valor,
  tamano = "grande",
}: {
  valor: number;
  tamano?: "grande" | "chico";
}) {
  const clase = tamano === "grande" ? "text-4xl" : "text-xl";
  return (
    <span className={`${clase} font-semibold tabular-nums ${colorNota(valor)}`}>
      {valor}
      <span className="text-tenue text-sm font-normal">/100</span>
    </span>
  );
}

/** Barra de una dimensión: cuánto del peso obtuvo. */
export function Barra({ porcentaje }: { porcentaje: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-borde">
      <div
        className={`h-full ${colorBarra(porcentaje)}`}
        style={{ width: `${Math.max(0, Math.min(100, porcentaje))}%` }}
      />
    </div>
  );
}

/** Bloque plegable para el material largo: prompts, salida cruda, razonamiento. */
export function Plegable({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-lg border border-borde bg-panel">
      <summary className="flex items-baseline justify-between gap-4 px-5 py-4 text-sm font-semibold">
        <span>{titulo}</span>
        {subtitulo ? (
          <span className="text-xs font-normal text-tenue">{subtitulo}</span>
        ) : null}
      </summary>
      <div className="border-t border-borde px-5 py-4">{children}</div>
    </details>
  );
}

export function Monoespaciado({ texto }: { texto: string }) {
  return (
    <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded border border-borde bg-fondo p-3 font-mono text-xs leading-relaxed">
      {texto}
    </pre>
  );
}

/** Texto del corrector con `rutas entre backticks` resaltadas como código. */
export function TextoRico({ texto }: { texto: string }) {
  return (
    <>
      {texto.split("`").map((parte, i) =>
        i % 2 === 1 ? (
          <code key={i} className="font-mono text-[0.9em]">
            {parte}
          </code>
        ) : (
          <span key={i}>{parte}</span>
        ),
      )}
    </>
  );
}
