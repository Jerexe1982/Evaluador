import Link from "next/link";
import { Barra, Nota, Panel, Titulo } from "@/components/ui";
import { fecha, usd } from "@/lib/formato";
import { listarCasos } from "@/lib/repo";
import { DIMENSIONES } from "@/lib/rubrica";
import { listarResultados, ultimoResultadoCompleto } from "@/lib/resultados";

export const dynamic = "force-dynamic";

export default function Inicio() {
  const casos = listarCasos();
  const ultimos = casos.map((caso) => ({
    caso,
    resultado: ultimoResultadoCompleto(caso.slug),
  }));
  const corridas = listarResultados().slice(0, 10);
  const conResultado = ultimos.filter((u) => u.resultado !== null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Resultados del agente corrector
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-tenue">
          Cada caso de <code className="font-mono">casos/</code> se corrige con el contrato
          de <code className="font-mono">agente/system_prompt.md</code>. La app muestra la
          nota, la evidencia que la sostiene y la entrada exacta con la que se produjo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ultimos.map(({ caso, resultado }) => (
          <Link
            key={caso.slug}
            href={`/casos/${caso.slug}`}
            className="rounded-lg border border-borde bg-panel p-5 transition-colors hover:border-tenue"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-semibold tracking-tight capitalize">{caso.slug}</h2>
              {resultado ? <Nota valor={resultado.notaCalculada} tamano="chico" /> : null}
            </div>
            <p className="mt-1 text-xs text-tenue">
              {caso.archivos.length} archivos ·{" "}
              {resultado
                ? `última corrida ${fecha(resultado.fecha)}`
                : "sin corridas todavía"}
            </p>
            {resultado ? (
              <div className="mt-4 space-y-2">
                {resultado.filas.map((fila) => (
                  <div key={fila.clave}>
                    <div className="mb-1 flex justify-between text-[11px] text-tenue">
                      <span>{fila.nombre}</span>
                      <span className="tabular-nums">
                        {fila.puntaje ?? "—"}/{fila.peso}
                      </span>
                    </div>
                    <Barra porcentaje={fila.nivel ?? 0} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-tenue">
                Abrí el caso y corré el evaluador para ver la corrección.
              </p>
            )}
          </Link>
        ))}
      </div>

      {conResultado.length > 1 ? (
        <Panel>
          <Titulo>Comparación entre casos (última corrida de cada uno)</Titulo>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-borde text-left text-xs text-tenue">
                  <th className="py-2 font-medium">Dimensión</th>
                  <th className="py-2 pr-2 text-right font-medium">Peso</th>
                  {conResultado.map(({ caso }) => (
                    <th key={caso.slug} className="py-2 pl-4 text-right font-medium capitalize">
                      {caso.slug}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIMENSIONES.map((dimension) => (
                  <tr key={dimension.clave} className="border-b border-borde/60">
                    <td className="py-2">{dimension.nombre}</td>
                    <td className="py-2 pr-2 text-right tabular-nums text-tenue">
                      {dimension.peso}
                    </td>
                    {conResultado.map(({ caso, resultado }) => {
                      const fila = resultado!.filas.find((f) => f.clave === dimension.clave);
                      return (
                        <td
                          key={caso.slug}
                          className="py-2 pl-4 text-right tabular-nums"
                        >
                          {fila?.puntaje ?? "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2">Nota final</td>
                  <td className="py-2 pr-2 text-right tabular-nums text-tenue">100</td>
                  {conResultado.map(({ caso, resultado }) => (
                    <td key={caso.slug} className="py-2 pl-4 text-right tabular-nums">
                      {resultado!.notaCalculada}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {corridas.length > 0 ? (
        <Panel>
          <Titulo>Últimas corridas</Titulo>
          <ul className="divide-y divide-borde text-sm">
            {corridas.map((corrida) => (
              <li key={corrida.id}>
                <Link
                  href={`/resultados/${corrida.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 hover:underline"
                >
                  <span className="capitalize">{corrida.caso}</span>
                  <span className="text-xs text-tenue">
                    {fecha(corrida.fecha)} · {corrida.modelo} · {usd(corrida.costoUSD)}
                    {corrida.alertas > 0 ? ` · ${corrida.alertas} alertas` : ""}
                  </span>
                  <span className="tabular-nums">{corrida.notaCalculada}/100</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
