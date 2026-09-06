import { Etiqueta, Monoespaciado, Panel, Plegable, Seccion, TextoRico } from "@/components/ui";
import { leerRubrica } from "@/lib/repo";
import { ETIQUETA_NIVEL, NIVELES } from "@/lib/rubrica";
import { dimensionesRubrica, seccionRubrica } from "@/lib/rubricaTexto";

export const dynamic = "force-dynamic";

/** Los párrafos de una sección de rubrica.md, sin viñetas de markdown. */
function Prosa({ texto }: { texto: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {texto
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((parrafo, i) => (
          <p key={i}>
            <TextoRico texto={parrafo.replace(/\n/g, " ").replace(/\*\*/g, "")} />
          </p>
        ))}
    </div>
  );
}

export default function PaginaRubrica() {
  const dimensiones = dimensionesRubrica();
  const evidencia = seccionRubrica("Qué cuenta como evidencia");
  const transversales = seccionRubrica("Reglas transversales");

  return (
    <div className="space-y-16">
      <section className="max-w-2xl space-y-8">
        <div>
          <Etiqueta>Pieza 1 del parcial · peso 25</Etiqueta>
          <h1 className="mt-3 text-4xl font-light leading-tight tracking-tight text-texto">
            La rúbrica ejecutable
          </h1>
        </div>
        <div>
          <Etiqueta>Qué la hace ejecutable</Etiqueta>
          <p className="mt-3 text-sm leading-relaxed">
            Las cinco dimensiones y sus pesos son los de la rúbrica oficial. Lo que agrega
            esta versión es qué evidencia concreta exige cada nivel, un ejemplo por nivel y
            los topes que impiden que un trabajo inflado saque puntaje alto. Esta página lee{" "}
            <code className="font-mono text-texto">rubrica.md</code> del repo: si la rúbrica
            cambia, cambia lo que se ve acá y lo que aplica el corrector.
          </p>
        </div>
      </section>

      <Seccion
        etiqueta="Escala"
        titulo="Cinco niveles, sin valores intermedios"
        bajada="Un nivel se alcanza sólo si se cumple todo lo que la fila exige. Si se cumple parte, corresponde el nivel inmediatamente inferior."
      >
        <div className="grid gap-3 sm:grid-cols-5">
          {NIVELES.map((nivel) => (
            <Panel key={nivel}>
              <p className="font-mono text-2xl font-light tabular-nums text-texto">
                {nivel}
                <span className="text-sm text-tenue">%</span>
              </p>
              <p className="mt-2 text-xs text-tenue">{ETIQUETA_NIVEL[nivel]}</p>
            </Panel>
          ))}
        </div>
      </Seccion>

      {evidencia ? (
        <Seccion etiqueta="Regla base" titulo="Qué cuenta como evidencia">
          <Panel>
            <Prosa texto={evidencia} />
          </Panel>
        </Seccion>
      ) : null}

      {dimensiones.map((dimension, i) => (
        <Seccion
          key={dimension.clave}
          etiqueta={`Dimensión ${i + 1} · peso ${dimension.peso}`}
          titulo={dimension.nombre}
          bajada={<TextoRico texto={dimension.resumen.replace(/\n/g, " ")} />}
        >
          <div className="overflow-x-auto rounded-xl border border-borde bg-panel">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-borde text-left">
                  <th className="px-5 py-3 font-normal text-tenue">Nivel</th>
                  <th className="px-5 py-3 font-normal text-tenue">Evidencia exigida</th>
                  <th className="px-5 py-3 font-normal text-tenue">Ejemplo</th>
                </tr>
              </thead>
              <tbody>
                {dimension.niveles.map((nivel) => (
                  <tr key={nivel.nivel} className="border-b border-borde/60 align-top">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono tabular-nums text-texto">
                        {nivel.nivel}%
                      </span>
                      <span className="block text-[11px] text-tenue">
                        {((nivel.nivel * dimension.peso) / 100)
                          .toString()
                          .replace(".", ",")}
                        /{dimension.peso}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <TextoRico texto={nivel.exige} />
                    </td>
                    <td className="px-5 py-4 text-tenue">
                      <TextoRico texto={nivel.ejemplo} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dimension.topes.length > 0 ? (
            <div className="mt-4">
              <Etiqueta>Topes de esta dimensión</Etiqueta>
              <ul className="mt-3 space-y-2 text-sm">
                {dimension.topes.map((tope, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="text-alerta">▪</span>
                    <span>
                      <TextoRico texto={tope.replace(/\*\*/g, "")} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Seccion>
      ))}

      {transversales ? (
        <Seccion etiqueta="Transversal" titulo="Reglas que valen para toda la corrección">
          <Panel>
            <Prosa texto={transversales} />
          </Panel>
        </Seccion>
      ) : null}

      <Seccion etiqueta="Fuente" titulo="rubrica.md, sin interpretar">
        <Plegable titulo="Ver el archivo completo" subtitulo="tal como lo lee el corrector">
          <Monoespaciado texto={leerRubrica()} />
        </Plegable>
      </Seccion>
    </div>
  );
}
