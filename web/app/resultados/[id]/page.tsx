import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Escala,
  Etiqueta,
  Monoespaciado,
  Nota,
  Panel,
  Plegable,
  Seccion,
  Sello,
  TextoRico,
} from "@/components/ui";
import { detectoManipulacion, estadoPeor, pruebasDelCaso } from "@/lib/analisis";
import { leerCalibracion } from "@/lib/calibracion";
import {
  bytes,
  colorEstado,
  fecha,
  miles,
  puntos,
  SIMBOLO_ESTADO,
} from "@/lib/formato";
import { campoVacio } from "@/lib/parseo";
import { rutaDeTrabajo } from "@/lib/repo";
import { ETIQUETA_NIVEL } from "@/lib/rubrica";
import { dimensionRubrica, nivelesAlrededor } from "@/lib/rubricaTexto";
import { leerResultado } from "@/lib/resultados";
import type { CamposCerrados, FilaResultado } from "@/lib/tipos";

export const dynamic = "force-dynamic";

const TEXTO_ESTADO = {
  ok: "Pasa",
  alerta: "Con reservas",
  error: "No pasa",
  pendiente: "Pendiente",
} as const;

/** Las rutas que el corrector citó, separadas entre las que existen y las que no. */
function RutasCitadas({ fila, caso }: { fila: FilaResultado; caso: string }) {
  if (fila.rutasCitadas.length === 0) {
    return <p className="text-xs text-alerta">Sin ruta de archivo en la evidencia.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {fila.rutasCitadas.map((ruta) => {
        const existe = fila.rutasVerificadas.includes(ruta);
        return existe ? (
          <Link
            key={ruta}
            href={`/casos/${caso}?archivo=${encodeURIComponent(ruta)}`}
            className="rounded-full border border-borde px-3 py-1 font-mono text-[11px] text-suave transition-colors hover:border-acento hover:text-acento"
          >
            {ruta}
          </Link>
        ) : (
          <span
            key={ruta}
            className="rounded-full border border-mal/50 px-3 py-1 font-mono text-[11px] text-mal"
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
    <dl className="space-y-4 text-sm">
      {lineas.map(({ etiqueta, valor, alerta }) => {
        const vacio = campoVacio(valor);
        return (
          <div key={etiqueta}>
            <dt className="etiqueta">{etiqueta}</dt>
            <dd
              className={
                vacio ? "mt-1.5 text-tenue" : alerta ? "mt-1.5 text-alerta" : "mt-1.5"
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
  const origen = resultado.origen ?? null;
  const tokensCorrida = uso.tokensEntrada + uso.tokensSalida;
  const calibracion = leerCalibracion(resultado.caso);
  const pruebas = pruebasDelCaso(calibracion, resultado);
  const estado = estadoPeor(pruebas);

  return (
    <div className="space-y-16">
      <section className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-2xl">
          <Link href={rutaDeTrabajo(resultado.caso)} className="etiqueta hover:text-texto">
            ← {origen ? `${origen.owner}/${origen.repo}` : `Caso ${resultado.caso}`}
          </Link>
          <h1 className="mt-4 text-4xl font-light tracking-tight text-texto">
            Corrección de{" "}
            {origen ? (
              <span>
                {origen.owner}/{origen.repo}
              </span>
            ) : (
              <span className="capitalize">{resultado.caso}</span>
            )}
          </h1>
          {origen ? (
            <p className="mt-3 text-sm">
              <a
                href={`${origen.url}/tree/${origen.commit}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-suave underline decoration-borde-fuerte underline-offset-4 hover:text-acento"
              >
                {origen.url}
              </a>
              <span className="text-tenue">
                {" "}
                · commit <span className="font-mono">{origen.commit.slice(0, 7)}</span> ·{" "}
                {origen.commits} commits en el clon
              </span>
            </p>
          ) : null}
          <p className="mt-3 font-mono text-[11px] text-tenue">
            {fecha(resultado.fecha)} · {resultado.modelo} ·{" "}
            {(resultado.duracionMs / 1000).toFixed(1)} s ·{" "}
            {detectoManipulacion(resultado)
              ? "reporta manipulación"
              : "no reporta manipulación"}
          </p>
        </div>
        <div className="md:text-right">
          <Etiqueta>Nota</Etiqueta>
          <div className="mt-2">
            <Nota valor={resultado.notaCalculada} tamano="gigante" />
          </div>
          <p className="mt-2 text-xs text-tenue">
            {resultado.notaDeclarada !== null &&
            Math.abs(resultado.notaDeclarada - resultado.notaCalculada) > 0.01
              ? `El modelo declaró ${puntos(resultado.notaDeclarada)}/100`
              : "Suma de las cinco dimensiones"}
          </p>
          <div className="mt-3 flex md:justify-end">
            <Sello estado={estado}>
              {TEXTO_ESTADO[estado]}{" "}
              {origen ? "los controles de evidencia" : "la prueba del caso"}
            </Sello>
          </div>
        </div>
      </section>

      <Seccion
        etiqueta="Explicabilidad"
        titulo="De dónde sale cada punto"
        bajada="Para cada dimensión: el nivel que aplicó, qué exigía ese nivel según la rúbrica, qué hubiera hecho falta para el siguiente, y la evidencia con la que lo justificó."
      >
        <div className="space-y-4">
          {resultado.filas.map((fila) => {
            const { alcanzado, siguiente } = nivelesAlrededor(fila.clave, fila.nivel);
            const dimension = dimensionRubrica(fila.clave);
            const nivelHumano = calibracion.humano.niveles[fila.clave] ?? null;
            return (
              <Panel key={fila.clave}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-base font-light text-texto">{fila.nombre}</h3>
                  <p className="text-sm tabular-nums">
                    <span className="text-texto">{fila.puntaje === null ? "—" : puntos(fila.puntaje)}</span>
                    <span className="text-tenue">/{fila.peso}</span>
                    <span className="ml-3 text-xs text-tenue">
                      {fila.nivel !== null
                        ? `nivel ${fila.nivel}% — ${ETIQUETA_NIVEL[fila.nivel] ?? "fuera de escala"}`
                        : "sin puntaje"}
                    </span>
                  </p>
                </div>
                <div className="my-4 flex flex-wrap items-center gap-4">
                  <Escala nivel={fila.nivel} />
                  {nivelHumano !== null ? (
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                        fila.nivel !== null && Math.abs(nivelHumano - fila.nivel) < 0.01
                          ? "text-ok"
                          : "text-alerta"
                      }`}
                    >
                      el grupo puso {nivelHumano}%
                    </span>
                  ) : null}
                </div>
                {!fila.nivelValido && fila.puntaje !== null ? (
                  <p className="mb-3 text-xs text-mal">
                    El puntaje no cae en la escala obligatoria 0 · 25 · 50 · 75 · 100 % del
                    peso.
                  </p>
                ) : null}

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Etiqueta>Evidencia citada</Etiqueta>
                      <p className="mt-1.5 text-sm">
                        {fila.evidencia ? <TextoRico texto={fila.evidencia} /> : "—"}
                      </p>
                    </div>
                    <div>
                      <Etiqueta>Justificación</Etiqueta>
                      <p className="mt-1.5 text-sm">
                        {fila.justificacion ? (
                          <TextoRico texto={fila.justificacion} />
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                    <div>
                      <Etiqueta>Archivos citados, verificados contra el repo</Etiqueta>
                      <div className="mt-2">
                        <RutasCitadas fila={fila} caso={resultado.caso} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border border-borde bg-fondo p-4">
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
                        <Etiqueta>Qué hubiera hecho falta para {siguiente.nivel}%</Etiqueta>
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
                      <details className="text-xs">
                        <summary className="etiqueta hover:text-texto">
                          Topes de la dimensión ({dimension.topes.length})
                        </summary>
                        <ul className="mt-2 space-y-1.5 text-tenue">
                          {dimension.topes.map((tope, i) => (
                            <li key={i}>
                              <TextoRico texto={tope.replace(/\*\*/g, "")} />
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      </Seccion>

      {resultado.camposCerrados ? (
        <Seccion
          etiqueta="Contrato"
          titulo="Lo que el corrector reportó"
          bajada="Los campos cerrados del contrato. Cada línea existe siempre: cuando dice «ninguno» es una respuesta, no un olvido."
        >
          <Panel>
            <Reportado campos={resultado.camposCerrados} />
          </Panel>
        </Seccion>
      ) : null}

      <Seccion
        etiqueta="Auditoría"
        titulo="Controles automáticos sobre la corrección"
        bajada="Los corre la app sobre la salida del corrector. No cambian el puntaje: dicen si la corrección respetó su propio contrato."
      >
        <Panel>
          <ul className="space-y-3">
            {resultado.verificaciones.map((verificacion) => (
              <li key={verificacion.clave} className="flex gap-3 text-sm">
                <span className={`mt-0.5 ${colorEstado(verificacion.estado)}`}>
                  {SIMBOLO_ESTADO[verificacion.estado]}
                </span>
                <span>
                  <span className="text-texto">{verificacion.titulo}</span>
                  <span className="block text-xs text-tenue">{verificacion.detalle}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </Seccion>

      {resultado.sugerencia ? (
        <Seccion etiqueta="Devolución" titulo="La única sugerencia concreta">
          <Panel>
            <p className="text-sm leading-relaxed">
              <TextoRico texto={resultado.sugerencia} />
            </p>
          </Panel>
        </Seccion>
      ) : null}

      <Seccion
        etiqueta="Economía"
        titulo="Qué consumió esta corrida"
        bajada={`La corrida no se factura por token: la cubre la suscripción de ChatGPT${
          uso.plan ? ` (plan ${uso.plan})` : ""
        } a través de Codex. Corregir 40 trabajos finales con este modelo consumiría del orden de ${miles(
          tokensCorrida * 40,
        )} tokens, sin costo marginal: el límite es el cupo del plan, no el presupuesto.`}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Panel>
            <Etiqueta>Entrada</Etiqueta>
            <p className="mt-2 text-3xl font-light tabular-nums text-texto">
              {miles(uso.tokensEntrada)}
            </p>
            <p className="mt-1 text-xs text-tenue">
              {uso.tokensCacheLectura > 0
                ? `${miles(uso.tokensCacheLectura)} leídos del caché`
                : "sin caché"}
            </p>
          </Panel>
          <Panel>
            <Etiqueta>Salida</Etiqueta>
            <p className="mt-2 text-3xl font-light tabular-nums text-texto">
              {miles(uso.tokensSalida)}
            </p>
            <p className="mt-1 text-xs text-tenue">
              {uso.tokensRazonamiento > 0
                ? `${miles(uso.tokensRazonamiento)} de razonamiento`
                : "sin razonamiento facturado"}
            </p>
          </Panel>
          <Panel>
            <Etiqueta>Total</Etiqueta>
            <p className="mt-2 text-3xl font-light tabular-nums text-acento">
              {miles(tokensCorrida)}
            </p>
            <p className="mt-1 text-xs text-tenue">
              {puntos(Math.round((resultado.duracionMs / 1000) * 10) / 10)} segundos de
              corrida
            </p>
          </Panel>
        </div>
      </Seccion>

      <Seccion
        etiqueta="Trazabilidad"
        titulo="Todo lo que produjo esta corrida"
        bajada="La entrada exacta y la salida cruda quedan guardadas con la corrida: es lo que hace reproducible la corrección."
      >
        <div className="space-y-3">
          {resultado.razonamiento ? (
            <Plegable
              titulo="Razonamiento del modelo"
              subtitulo="resumen que devuelve la API"
            >
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
            <div className="space-y-5">
              <div>
                <Etiqueta>System prompt — el contrato del agente</Etiqueta>
                <div className="mt-2">
                  <Monoespaciado texto={resultado.entrada.systemPrompt} />
                </div>
              </div>
              <div>
                <Etiqueta>User prompt — el trabajo evaluado, como dato</Etiqueta>
                <div className="mt-2">
                  <Monoespaciado texto={resultado.entrada.userPrompt} />
                </div>
              </div>
              <div>
                <Etiqueta>Archivos incluidos</Etiqueta>
                <ul className="mt-2 space-y-0.5 font-mono text-xs text-tenue">
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
      </Seccion>
    </div>
  );
}
