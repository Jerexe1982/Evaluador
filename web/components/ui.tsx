import { colorBarra, colorNota, puntos, type Estado } from "@/lib/formato";

/** Micro-etiqueta mono en versalitas: nombra el bloque sin robarle peso al dato. */
export function Etiqueta({ children }: { children: React.ReactNode }) {
  return <p className="etiqueta">{children}</p>;
}

/**
 * Un bloque del tablero: regla de un pixel arriba, etiqueta, título opcional y
 * el contenido. Es la unidad de composición de todas las páginas.
 */
export function Seccion({
  id,
  etiqueta,
  titulo,
  bajada,
  accion,
  children,
}: {
  /** Ancla, para enlazar la sección desde otra página. */
  id?: string;
  etiqueta: string;
  titulo?: string;
  bajada?: React.ReactNode;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-borde pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="max-w-2xl">
          <Etiqueta>{etiqueta}</Etiqueta>
          {titulo ? (
            <h2 className="mt-2 text-xl font-light tracking-tight text-texto">{titulo}</h2>
          ) : null}
          {bajada ? <p className="mt-2 text-sm text-tenue">{bajada}</p> : null}
        </div>
        {accion}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Caja de contenido dentro de una sección. */
export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-borde bg-panel p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-sm font-normal tracking-tight text-texto">{children}</h3>
  );
}

/** Nota sobre 100, con el color que le corresponde. */
export function Nota({
  valor,
  tamano = "grande",
}: {
  valor: number;
  tamano?: "gigante" | "grande" | "chico";
}) {
  const clase =
    tamano === "gigante"
      ? "text-6xl"
      : tamano === "grande"
        ? "text-4xl"
        : "text-xl";
  return (
    <span className={`${clase} font-light tabular-nums tracking-tight ${colorNota(valor)}`}>
      {puntos(valor)}
      <span className="text-sm font-light text-tenue">/100</span>
    </span>
  );
}

/**
 * Barra de una dimensión con las cuatro marcas de la escala: se ve de un vistazo
 * si el puntaje cae en 0 · 25 · 50 · 75 · 100 o entre medio.
 */
export function Barra({ porcentaje }: { porcentaje: number }) {
  const ancho = Math.max(0, Math.min(100, porcentaje));
  return (
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/8">
      <div className={`h-full ${colorBarra(porcentaje)}`} style={{ width: `${ancho}%` }} />
      <div className="absolute inset-0 flex">
        {[25, 50, 75].map((marca) => (
          <span
            key={marca}
            className="absolute top-0 h-full w-px bg-fondo/80"
            style={{ left: `${marca}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Los cuatro escalones de la escala, con los alcanzados encendidos. */
export function Escala({ nivel }: { nivel: number | null }) {
  return (
    <div className="flex items-center gap-1">
      {[25, 50, 75, 100].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-6 rounded-full ${
            nivel !== null && n <= nivel ? colorBarra(nivel) : "bg-white/10"
          }`}
        />
      ))}
      {nivel === 0 ? (
        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mal">
          sin evidencia
        </span>
      ) : null}
    </div>
  );
}

const CLASE_ESTADO: Record<Estado, string> = {
  ok: "border-ok/40 text-ok",
  alerta: "border-alerta/40 text-alerta",
  error: "border-mal/40 text-mal",
  pendiente: "border-borde text-tenue",
};

/** Sello corto de estado: pasa, no pasa, falta correrlo. */
export function Sello({
  estado,
  children,
}: {
  estado: Estado;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${CLASE_ESTADO[estado]}`}
    >
      {children}
    </span>
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
    <details className="group rounded-xl border border-borde bg-panel">
      <summary className="flex items-baseline justify-between gap-4 px-5 py-4 text-sm text-texto">
        <span className="flex items-baseline gap-3">
          <span className="text-tenue transition-transform group-open:rotate-90">›</span>
          {titulo}
        </span>
        {subtitulo ? <span className="text-xs text-tenue">{subtitulo}</span> : null}
      </summary>
      <div className="border-t border-borde px-5 py-4">{children}</div>
    </details>
  );
}

export function Monoespaciado({ texto }: { texto: string }) {
  return (
    <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-borde bg-fondo p-4 font-mono text-xs leading-relaxed text-suave">
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
          <code
            key={i}
            className="rounded bg-white/6 px-1 py-0.5 font-mono text-[0.85em] text-texto"
          >
            {parte}
          </code>
        ) : (
          <span key={i}>{parte}</span>
        ),
      )}
    </>
  );
}
