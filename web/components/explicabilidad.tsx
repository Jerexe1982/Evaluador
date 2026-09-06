import Link from "next/link";
import { Etiqueta, Sello, TextoRico } from "@/components/ui";
import { colorBarra, puntos } from "@/lib/formato";
import { campoVacio } from "@/lib/parseo";
import { ETIQUETA_NIVEL } from "@/lib/rubrica";
import { dimensionRubrica, nivelesAlrededor } from "@/lib/rubricaTexto";
import type {
  Confianza,
  ElementoInventario,
  ExplicacionDimension,
  FilaResultado,
  ItemEvidencia,
} from "@/lib/tipos";

/** Cómo se lee cada tipo de ítem de evidencia, en una sola palabra y un color. */
const EVIDENCIA = {
  confirma: {
    simbolo: "✓",
    titulo: "Confirma",
    ayuda: "Lo que encontró en el repositorio y sostiene el nivel",
    color: "text-ok",
    borde: "border-l-ok/50",
  },
  falta: {
    simbolo: "○",
    titulo: "Falta",
    ayuda: "Lo que el nivel exigía y no está en el repositorio",
    color: "text-alerta",
    borde: "border-l-alerta/50",
  },
  contradice: {
    simbolo: "✕",
    titulo: "Contradice",
    ayuda: "Un archivo que desmiente lo que el trabajo afirma",
    color: "text-mal",
    borde: "border-l-mal/50",
  },
} as const;

const CONFIANZA: Record<Confianza, { texto: string; clase: string }> = {
  alta: { texto: "Confianza alta", clase: "text-ok" },
  media: { texto: "Confianza media", clase: "text-alerta" },
  baja: { texto: "Confianza baja", clase: "text-mal" },
};

/** El enlace al archivo citado, abierto en el visor y con la cita resaltada. */
function enlaceArchivo(base: string, ruta: string, cita: string | null): string {
  const parametros = new URLSearchParams({ archivo: ruta });
  if (cita) parametros.set("cita", cita);
  return `${base}?${parametros.toString()}#archivos`;
}

/**
 * Un ítem de evidencia: qué archivo, qué dice y qué prueba. La ruta es un enlace al
 * archivo cuando existe, y queda marcada cuando no.
 */
function Item({
  item,
  base,
}: {
  item: ItemEvidencia;
  base: string;
}) {
  const estilo = EVIDENCIA[item.tipo];
  return (
    <li className={`border-l-2 pl-4 ${estilo.borde}`}>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${estilo.color}`}>
          {estilo.simbolo} {estilo.titulo}
        </span>
        {item.ruta ? (
          item.existe ? (
            <Link
              href={enlaceArchivo(base, item.ruta, item.cita)}
              className="font-mono text-[11px] text-suave underline decoration-borde-fuerte underline-offset-4 transition-colors hover:text-acento"
            >
              {item.ruta}
            </Link>
          ) : (
            <span
              className="font-mono text-[11px] text-tenue"
              title={
                item.tipo === "falta"
                  ? "La ruta no existe: es justamente lo que falta"
                  : "El corrector citó una ruta que no existe en el repositorio"
              }
            >
              {item.ruta}
              <span className={item.tipo === "falta" ? "text-tenue" : "text-mal"}>
                {item.tipo === "falta" ? " · no existe" : " · citada pero no existe"}
              </span>
            </span>
          )
        ) : (
          <span className="font-mono text-[11px] text-tenue">sin ruta</span>
        )}
      </div>
      {item.cita ? (
        <p className="mt-1.5 border-l border-borde pl-3 text-sm italic text-texto">
          “{item.cita}”
        </p>
      ) : null}
      {item.comentario ? (
        <p className="mt-1.5 text-sm text-suave">
          <TextoRico texto={item.comentario} />
        </p>
      ) : null}
    </li>
  );
}

/**
 * La cadena de decisión de la dimensión: el nivel que salió de la evidencia, el tope que
 * la rúbrica impone y el nivel en el que terminó. Es lo que responde "por qué este número".
 */
function Cadena({ explicacion }: { explicacion: ExplicacionDimension }) {
  const { nivelPorEvidencia, tope, nivelFinal } = explicacion;
  const bajo =
    nivelPorEvidencia !== null &&
    nivelFinal !== null &&
    nivelFinal < nivelPorEvidencia;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="rounded-lg border border-borde bg-fondo px-3 py-1.5">
        <span className="etiqueta">Por la evidencia</span>
        <span className="ml-2 tabular-nums text-texto">
          {nivelPorEvidencia === null ? "—" : `${nivelPorEvidencia}%`}
        </span>
      </span>
      <span className="text-tenue">→</span>
      <span
        className={`rounded-lg border px-3 py-1.5 ${
          tope ? "border-alerta/40 bg-alerta/5" : "border-borde bg-fondo"
        }`}
      >
        <span className="etiqueta">Tope de la rúbrica</span>
        <span className={`ml-2 ${tope ? "text-alerta" : "text-tenue"}`}>
          {tope ? "aplicado" : "ninguno"}
        </span>
      </span>
      <span className="text-tenue">→</span>
      <span className="rounded-lg border border-borde-fuerte bg-panel-alto px-3 py-1.5">
        <span className="etiqueta">Nivel final</span>
        <span
          className={`ml-2 tabular-nums ${bajo ? "text-alerta" : "text-texto"}`}
        >
          {nivelFinal === null ? "—" : `${nivelFinal}%`}
        </span>
      </span>
    </div>
  );
}

/** La ficha completa de una dimensión: cómo se llegó al nivel y qué lo destrabaría. */
export function FichaDimension({
  fila,
  base,
  nivelHumano,
}: {
  fila: FilaResultado;
  /** Ruta de la página del trabajo, para enlazar los archivos citados. */
  base: string;
  nivelHumano: number | null;
}) {
  const explicacion = fila.explicacion ?? null;
  const { alcanzado, siguiente } = nivelesAlrededor(fila.clave, fila.nivel);
  const dimension = dimensionRubrica(fila.clave);
  const confianza = explicacion?.confianza ? CONFIANZA[explicacion.confianza] : null;
  const nivelSiguiente = explicacion?.nivelDescartado ?? siguiente?.nivel ?? null;

  return (
    <article
      id={`dimension-${fila.clave}`}
      className="scroll-mt-24 overflow-hidden rounded-xl border border-borde bg-panel"
    >
      <header className="border-b border-borde px-6 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h3 className="text-lg font-light text-texto">{fila.nombre}</h3>
          <div className="flex items-baseline gap-4">
            {confianza ? (
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.18em] ${confianza.clase}`}
                title={explicacion?.motivoConfianza}
              >
                {confianza.texto}
              </span>
            ) : null}
            <p className="tabular-nums">
              <span className="text-2xl font-light text-texto">
                {fila.puntaje === null ? "—" : puntos(fila.puntaje)}
              </span>
              <span className="text-sm text-tenue">/{fila.peso}</span>
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="h-1 w-40 overflow-hidden rounded-full bg-white/8">
            <div
              className={`h-full ${colorBarra(fila.nivel ?? 0)}`}
              style={{ width: `${Math.max(0, Math.min(100, fila.nivel ?? 0))}%` }}
            />
          </div>
          <span className="text-xs text-tenue">
            {fila.nivel !== null
              ? `nivel ${fila.nivel} % — ${ETIQUETA_NIVEL[fila.nivel] ?? "fuera de escala"}`
              : "sin puntaje"}
          </span>
          {nivelHumano !== null ? (
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                fila.nivel !== null && Math.abs(nivelHumano - fila.nivel) < 0.01
                  ? "text-ok"
                  : "text-alerta"
              }`}
            >
              el grupo puso {nivelHumano} %
            </span>
          ) : null}
        </div>
        {explicacion?.motivoConfianza && explicacion.confianza !== "alta" ? (
          <p className="mt-3 text-xs text-tenue">
            Por qué la confianza no es alta: {explicacion.motivoConfianza}
          </p>
        ) : null}
        {!fila.nivelValido && fila.puntaje !== null ? (
          <p className="mt-3 text-xs text-mal">
            El puntaje no cae en la escala obligatoria 0 · 25 · 50 · 75 · 100 % del peso.
          </p>
        ) : null}
      </header>

      {explicacion ? (
        <div className="border-b border-borde bg-fondo/40 px-6 py-4">
          <Cadena explicacion={explicacion} />
          {explicacion.tope ? (
            <p className="mt-3 text-sm text-alerta">
              <TextoRico texto={explicacion.tope} />
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-px bg-borde md:grid-cols-[1.15fr_1fr]">
        <div className="bg-panel px-6 py-5">
          <Etiqueta>Qué encontró en el repositorio</Etiqueta>
          {explicacion && explicacion.items.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {explicacion.items.map((item, i) => (
                <Item key={i} item={item} base={base} />
              ))}
            </ul>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <p>
                {fila.evidencia ? <TextoRico texto={fila.evidencia} /> : "Sin evidencia citada."}
              </p>
              {fila.justificacion ? (
                <p className="text-suave">
                  <TextoRico texto={fila.justificacion} />
                </p>
              ) : null}
              {fila.rutasCitadas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {fila.rutasCitadas.map((ruta) =>
                    fila.rutasVerificadas.includes(ruta) ? (
                      <Link
                        key={ruta}
                        href={enlaceArchivo(base, ruta, null)}
                        className="rounded-full border border-borde px-3 py-1 font-mono text-[11px] text-suave transition-colors hover:border-acento hover:text-acento"
                      >
                        {ruta}
                      </Link>
                    ) : (
                      <span
                        key={ruta}
                        className="rounded-full border border-alerta/40 px-3 py-1 font-mono text-[11px] text-alerta"
                        title="La ruta no existe en el repositorio: puede ser una ausencia citada o una invención"
                      >
                        {ruta} · no existe
                      </span>
                    ),
                  )}
                </div>
              ) : null}
              <p className="text-xs text-tenue">
                Esta corrida es anterior al contrato que pide la ficha por dimensión: hay
                evidencia citada, pero no la cadena de decisión. Volvé a correr el evaluador
                para tener la explicación completa.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5 bg-panel px-6 py-5">
          {explicacion?.porQueNo ? (
            <div>
              <Etiqueta>
                {nivelSiguiente !== null
                  ? `Por qué no ${nivelSiguiente} %`
                  : fila.nivel === 100
                    ? "Está en el nivel más alto"
                    : "Por qué no el nivel siguiente"}
              </Etiqueta>
              <p className="mt-1.5 text-sm text-texto">
                <TextoRico texto={explicacion.porQueNo} />
              </p>
            </div>
          ) : null}
          {explicacion?.paraSubir && !campoVacio(explicacion.paraSubir) ? (
            <div>
              <Etiqueta>Qué habría que agregar</Etiqueta>
              <p className="mt-1.5 text-sm text-acento">
                <TextoRico texto={explicacion.paraSubir} />
              </p>
            </div>
          ) : null}

          <details
            open={!explicacion}
            className="rounded-lg border border-borde bg-fondo px-4 py-3"
          >
            <summary className="etiqueta hover:text-texto">
              La regla de la rúbrica, textual
            </summary>
            <div className="mt-3 space-y-4">
              <div>
                <Etiqueta>Qué exigía este nivel</Etiqueta>
                <p className="mt-1.5 text-sm">
                  {alcanzado ? (
                    <TextoRico texto={alcanzado.exige} />
                  ) : (
                    "El puntaje no cae en ningún nivel de la rúbrica."
                  )}
                </p>
              </div>
              {siguiente ? (
                <div>
                  <Etiqueta>Qué exige {siguiente.nivel} %</Etiqueta>
                  <p className="mt-1.5 text-sm text-tenue">
                    <TextoRico texto={siguiente.exige} />
                  </p>
                </div>
              ) : (
                <p className="text-xs text-ok">
                  Es el nivel más alto de la dimensión: no hay techo por encima.
                </p>
              )}
              {dimension && dimension.topes.length > 0 ? (
                <div>
                  <Etiqueta>Topes de la dimensión</Etiqueta>
                  <ul className="mt-2 space-y-1.5 text-xs text-tenue">
                    {dimension.topes.map((tope, i) => (
                      <li key={i}>
                        <TextoRico texto={tope.replace(/\*\*/g, "")} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}

const ESTADO_INVENTARIO = {
  presente: { texto: "presente", clase: "text-ok", simbolo: "✓" },
  vacio: { texto: "vacío", clase: "text-alerta", simbolo: "○" },
  ausente: { texto: "ausente", clase: "text-mal", simbolo: "✕" },
  desconocido: { texto: "sin declarar", clase: "text-tenue", simbolo: "·" },
} as const;

/** El paso 1 del protocolo: los cuatro elementos obligatorios, antes de puntuar nada. */
export function Inventario({
  elementos,
  base,
  existe,
}: {
  elementos: ElementoInventario[];
  base: string;
  /** Si la ruta existe de verdad en el trabajo, para contrastar lo que declaró. */
  existe: (ruta: string) => boolean;
}) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-xl border border-borde bg-borde sm:grid-cols-2">
      {elementos.map((elemento) => {
        const estilo = ESTADO_INVENTARIO[elemento.estado];
        const enElRepo = existe(elemento.ruta);
        const discrepa = elemento.estado === "ausente" && enElRepo;
        return (
          <li key={elemento.ruta} className="bg-panel px-5 py-4">
            <div className="flex items-baseline gap-2.5">
              <span className={estilo.clase}>{estilo.simbolo}</span>
              {enElRepo ? (
                <Link
                  href={`${base}?archivo=${encodeURIComponent(elemento.ruta)}#archivos`}
                  className="font-mono text-sm text-texto transition-colors hover:text-acento"
                >
                  {elemento.ruta}
                </Link>
              ) : (
                <span className="font-mono text-sm text-texto">{elemento.ruta}</span>
              )}
              <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${estilo.clase}`}>
                {estilo.texto}
              </span>
            </div>
            {elemento.detalle ? (
              <p className="mt-1.5 pl-6 text-xs text-tenue">{elemento.detalle}</p>
            ) : null}
            {discrepa ? (
              <p className="mt-1.5 pl-6 text-xs text-mal">
                El corrector lo dio por ausente y el archivo está en el repositorio.
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * El resumen de una corrección para quien mira el trabajo, no la corrida: de dónde sale
 * la nota y, dimensión por dimensión, el artefacto concreto que la subiría.
 */
export function ResumenCorreccion({
  veredicto,
  filas,
  sugerencia,
}: {
  veredicto: string | null | undefined;
  filas: FilaResultado[];
  sugerencia: string;
}) {
  const faltantes = filas.filter(
    (f) => f.explicacion?.paraSubir && !campoVacio(f.explicacion.paraSubir),
  );

  return (
    <div className="space-y-4">
      {veredicto ? (
        <div className="rounded-xl border border-borde bg-panel-alto p-6">
          <Etiqueta>De dónde sale esta nota</Etiqueta>
          <p className="mt-3 text-lg font-light leading-relaxed text-texto">
            <TextoRico texto={veredicto} />
          </p>
        </div>
      ) : null}
      {faltantes.length > 0 ? (
        <div className="rounded-xl border border-borde bg-panel px-6 py-5">
          <Etiqueta>Qué habría que agregar, dimensión por dimensión</Etiqueta>
          <ul className="mt-4 space-y-3">
            {faltantes.map((fila) => (
              <li key={fila.clave} className="grid gap-1 sm:grid-cols-[13rem_1fr] sm:gap-4">
                <span className="text-sm text-tenue">
                  {fila.nombre}
                  <span className="ml-2 tabular-nums">
                    {fila.puntaje === null ? "—" : puntos(fila.puntaje)}/{fila.peso}
                  </span>
                </span>
                <span className="text-sm text-suave">
                  <TextoRico texto={fila.explicacion!.paraSubir} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {sugerencia ? (
        <div className="rounded-xl border border-acento/30 bg-acento/5 px-6 py-5">
          <Etiqueta>Lo único que más subiría la nota</Etiqueta>
          <p className="mt-2 text-sm leading-relaxed text-texto">
            <TextoRico texto={sugerencia} />
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Barra de acceso rápido a las cinco fichas, con su puntaje. */
export function IndiceDimensiones({ filas }: { filas: FilaResultado[] }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {filas.map((fila) => (
        <a
          key={fila.clave}
          href={`#dimension-${fila.clave}`}
          className="group flex items-baseline gap-2 rounded-full border border-borde px-3.5 py-1.5 text-xs transition-colors hover:border-borde-fuerte hover:text-texto"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${colorBarra(fila.nivel ?? 0)}`}
          />
          <span>{fila.nombre}</span>
          <span className="tabular-nums text-tenue">
            {fila.puntaje === null ? "—" : puntos(fila.puntaje)}/{fila.peso}
          </span>
        </a>
      ))}
    </nav>
  );
}

/** Leyenda de los tres tipos de evidencia. Se lee una vez y ordena toda la página. */
export function LeyendaEvidencia() {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {(["confirma", "falta", "contradice"] as const).map((tipo) => (
        <li key={tipo} className="flex items-baseline gap-2 text-xs text-tenue">
          <span className={EVIDENCIA[tipo].color}>{EVIDENCIA[tipo].simbolo}</span>
          <span className="text-suave">{EVIDENCIA[tipo].titulo}</span>
          <span>· {EVIDENCIA[tipo].ayuda}</span>
        </li>
      ))}
    </ul>
  );
}

export { Sello };
