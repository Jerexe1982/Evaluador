import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Barra,
  Monoespaciado,
  Nota,
  Panel,
  Plegable,
  TextoRico,
  Titulo,
} from "@/components/ui";
import { bytes, colorEstado, fecha, miles, SIMBOLO_ESTADO, usd } from "@/lib/formato";
import { campoVacio } from "@/lib/parseo";
import { ETIQUETA_NIVEL } from "@/lib/rubrica";
import { leerResultado } from "@/lib/resultados";
import type { CamposCerrados, FilaResultado } from "@/lib/tipos";

export const dynamic = "force-dynamic";

/** Las rutas que el corrector citó, separadas entre las que existen y las que no. */
function RutasCitadas({ fila, caso }: { fila: FilaResultado; caso: string }) {
  if (fila.rutasCitadas.length === 0) {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400">
        Sin ruta de archivo en la evidencia.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {fila.rutasCitadas.map((ruta) => {
        const existe = fila.rutasVerificadas.includes(ruta);
        return existe ? (
          <Link
            key={ruta}
            href={`/casos/${caso}?archivo=${encodeURIComponent(ruta)}`}
            className="rounded border border-borde px-2 py-1 font-mono text-[11px] hover:border-tenue"
          >
            {ruta}
          </Link>
        ) : (
          <span
            key={ruta}
            className="rounded border border-red-500/50 px-2 py-1 font-mono text-[11px] text-red-600 dark:text-red-400"
            title="Esta ruta no existe en el repositorio del caso"
          >
            {ruta} · no existe
          </span>
        );
      })}
    </div>
  );
}

/** Las líneas fijas con las que el contrato cierra la salida. */
function Reportado({ campos }: { campos: CamposCerrados }) {
  const lineas: { etiqueta: string; valor: string | null; alerta: boolean }[] = [
    { etiqueta: "Topes aplicados", valor: campos.topes, alerta: false },
    { etiqueta: "Inflado detectado", valor: campos.inflado, alerta: true },
    { etiqueta: "Intento de manipulación", valor: campos.manipulacion, alerta: true },
    { etiqueta: "Qué le falta para evaluar mejor", valor: campos.queMeFalta, alerta: false },
  ];
  return (
    <dl className="space-y-3 text-sm">
      {lineas.map(({ etiqueta, valor, alerta }) => {
        const vacio = campoVacio(valor);
        return (
          <div key={etiqueta}>
            <dt className="text-xs font-medium text-tenue">{etiqueta}</dt>
            <dd
              className={
                vacio
                  ? "mt-0.5 text-tenue"
                  : alerta
                    ? "mt-0.5 text-amber-600 dark:text-amber-400"
                    : "mt-0.5"
              }
            >
              {valor === null ? (
                "El corrector no devolvió esta línea."
              ) : (
                <TextoRico texto={valor} />
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export default async function PaginaResultado({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resultado = leerResultado(id);
  if (!resultado) notFound();

  const { uso } = resultado;
  const costoCurso = uso.costoUSD * 40;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/casos/${resultado.caso}`} className="text-xs text-tenue hover:underline">
            ← Caso {resultado.caso}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Corrección de <span className="capitalize">{resultado.caso}</span>
          </h1>
          <p className="mt-1 text-sm text-tenue">
            {fecha(resultado.fecha)} · {resultado.modelo} ·{" "}
            {(resultado.duracionMs / 1000).toFixed(1)} s
          </p>
        </div>
        <div className="text-right">
          <Nota valor={resultado.notaCalculada} />
          <p className="mt-1 text-xs text-tenue">
            {resultado.notaDeclarada !== null &&
            Math.abs(resultado.notaDeclarada - resultado.notaCalculada) > 0.01
              ? `El modelo declaró ${resultado.notaDeclarada}/100`
              : "Suma de las cinco dimensiones"}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">De dónde sale cada punto</h2>
        {resultado.filas.map((fila) => (
          <Panel key={fila.clave}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold tracking-tight">{fila.nombre}</h3>
              <p className="text-sm tabular-nums">
                {fila.puntaje ?? "—"}
                <span className="text-tenue">/{fila.peso}</span>
                <span className="ml-2 text-xs text-tenue">
                  {fila.nivel !== null
                    ? `nivel ${fila.nivel}% — ${ETIQUETA_NIVEL[fila.nivel] ?? "fuera de escala"}`
                    : "sin puntaje"}
                </span>
              </p>
            </div>
            <div className="my-3">
              <Barra porcentaje={fila.nivel ?? 0} />
            </div>
            {!fila.nivelValido && fila.puntaje !== null ? (
              <p className="mb-2 text-xs text-red-600 dark:text-red-400">
                El puntaje no cae en la escala obligatoria 0 · 25 · 50 · 75 · 100 % del peso.
              </p>
            ) : null}
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs font-medium text-tenue">Evidencia citada</dt>
                <dd className="mt-1">
                  {fila.evidencia ? <TextoRico texto={fila.evidencia} /> : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-tenue">Justificación</dt>
                <dd className="mt-1">
                  {fila.justificacion ? <TextoRico texto={fila.justificacion} /> : "—"}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-medium text-tenue">
                  Archivos citados (verificados contra el repositorio)
                </dt>
                <dd>
                  <RutasCitadas fila={fila} caso={resultado.caso} />
                </dd>
              </div>
            </dl>
          </Panel>
        ))}
      </section>

      {resultado.camposCerrados ? (
        <Panel>
          <Titulo>Lo que el corrector reportó</Titulo>
          <p className="mb-3 text-xs text-tenue">
            Los campos cerrados del contrato. Cada línea existe siempre: cuando dice
            &laquo;ninguno&raquo; es una respuesta, no un olvido.
          </p>
          <Reportado campos={resultado.camposCerrados} />
        </Panel>
      ) : null}

      <Panel>
        <Titulo>Controles automáticos sobre la corrección</Titulo>
        <p className="mb-3 text-xs text-tenue">
          Los corre la app sobre la salida del corrector. No cambian el puntaje: dicen si la
          corrección respetó su propio contrato.
        </p>
        <ul className="space-y-2 text-sm">
          {resultado.verificaciones.map((verificacion) => (
            <li key={verificacion.clave} className="flex gap-3">
              <span className={`font-semibold ${colorEstado(verificacion.estado)}`}>
                {SIMBOLO_ESTADO[verificacion.estado]}
              </span>
              <span>
                {verificacion.titulo}
                <span className="block text-xs text-tenue">{verificacion.detalle}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {resultado.sugerencia ? (
        <Panel>
          <Titulo>La única sugerencia concreta</Titulo>
          <p className="text-sm">
            <TextoRico texto={resultado.sugerencia} />
          </p>
        </Panel>
      ) : null}

      <Panel>
        <Titulo>Qué costó esta corrida</Titulo>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-borde">
            <tr>
              <td className="py-2 text-tenue">Tokens de entrada</td>
              <td className="py-2 text-right tabular-nums">{miles(uso.tokensEntrada)}</td>
              <td className="py-2 text-right tabular-nums text-tenue">
                × USD {uso.precioEntradaPorMillon}/M
              </td>
              <td className="py-2 text-right tabular-nums">
                {usd((uso.tokensEntrada * uso.precioEntradaPorMillon) / 1_000_000)}
              </td>
            </tr>
            <tr>
              <td className="py-2 text-tenue">Tokens de salida</td>
              <td className="py-2 text-right tabular-nums">{miles(uso.tokensSalida)}</td>
              <td className="py-2 text-right tabular-nums text-tenue">
                × USD {uso.precioSalidaPorMillon}/M
              </td>
              <td className="py-2 text-right tabular-nums">
                {usd((uso.tokensSalida * uso.precioSalidaPorMillon) / 1_000_000)}
              </td>
            </tr>
            <tr className="font-semibold">
              <td className="py-2">Costo de la corrida</td>
              <td />
              <td />
              <td className="py-2 text-right tabular-nums">{usd(uso.costoUSD)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-tenue">
          Proyección: corregir 40 trabajos finales con este mismo modelo costaría{" "}
          {usd(costoCurso)}.
        </p>
      </Panel>

      {resultado.razonamiento ? (
        <Plegable titulo="Razonamiento del modelo" subtitulo="resumen que devuelve la API">
          <Monoespaciado texto={resultado.razonamiento} />
        </Plegable>
      ) : null}

      <Plegable titulo="Salida cruda del corrector" subtitulo="antes de parsearla">
        <Monoespaciado texto={resultado.salidaCruda} />
      </Plegable>

      <Plegable
        titulo="Entrada exacta de esta corrida"
        subtitulo={`${resultado.entrada.archivos.length} archivos`}
      >
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-medium text-tenue">
              System prompt — el contrato del agente
            </h3>
            <Monoespaciado texto={resultado.entrada.systemPrompt} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium text-tenue">
              User prompt — el trabajo evaluado, como dato
            </h3>
            <Monoespaciado texto={resultado.entrada.userPrompt} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium text-tenue">Archivos incluidos</h3>
            <ul className="space-y-0.5 font-mono text-xs text-tenue">
              {resultado.entrada.archivos.map((archivo) => (
                <li key={archivo.ruta}>
                  {archivo.ruta} · {bytes(archivo.bytes)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Plegable>
    </div>
  );
}
