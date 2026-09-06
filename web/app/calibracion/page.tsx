import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { BotonExportar } from "@/components/BotonExportar";
import { Etiqueta, Monoespaciado, Panel, Plegable, Seccion, Sello } from "@/components/ui";
import { brechas, resumirBrechas } from "@/lib/analisis";
import { hayNotaHumana, leerCalibracion } from "@/lib/calibracion";
import { conSigno, fecha, puntos } from "@/lib/formato";
import { listarCasos, rutaRepo } from "@/lib/repo";
import { ETIQUETA_NIVEL } from "@/lib/rubrica";
import { ultimoResultadoCompleto } from "@/lib/resultados";

export const dynamic = "force-dynamic";

function leerCalibracionMd(): string | null {
  const archivo = path.join(rutaRepo(), "calibracion.md");
  if (!fs.existsSync(archivo)) return null;
  const texto = fs.readFileSync(archivo, "utf8").trim();
  return texto.length > "# Calibración".length ? texto : null;
}

export default function PaginaCalibracion() {
  const casos = listarCasos().map((caso) => {
    const resultado = ultimoResultadoCompleto(caso.id);
    const calibracion = leerCalibracion(caso.id);
    return {
      id: caso.id,
      resultado,
      calibracion,
      resumen: resumirBrechas(resultado, calibracion),
      filas: brechas(resultado, calibracion),
      cargada: hayNotaHumana(calibracion.humano),
    };
  });
  const cargadas = casos.filter((c) => c.cargada);
  const coincidencias = cargadas.reduce((n, c) => n + c.resumen.coincidencias, 0);
  const evaluadas = cargadas.reduce((n, c) => n + c.resumen.evaluadas, 0);
  const generado = leerCalibracionMd();

  return (
    <div className="space-y-16">
      <section className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-2xl space-y-8">
          <div>
            <Etiqueta>Pieza 4 del parcial · peso 15</Etiqueta>
            <h1 className="mt-3 text-4xl font-light leading-tight tracking-tight text-texto">
              Calibración contra el criterio del grupo
            </h1>
          </div>
          <div>
            <Etiqueta>Cómo se produce</Etiqueta>
            <p className="mt-3 text-sm leading-relaxed">
              Cada integrante puntúa los casos con la misma escala que aplica el agente y esa
              nota queda guardada en el repo. La app compara nivel contra nivel —coincidir es
              caer en el mismo nivel, no acercarse—, muestra dónde no coinciden y escribe{" "}
              <code className="font-mono text-texto">calibracion.md</code> con el resultado.
            </p>
          </div>
        </div>
        <div className="md:text-right">
          <Etiqueta>Acuerdo</Etiqueta>
          <p className="mt-3 text-5xl font-light tabular-nums text-texto">
            {evaluadas === 0 ? "—" : `${coincidencias}/${evaluadas}`}
          </p>
          <p className="mt-2 text-xs text-tenue">
            dimensiones donde el agente y el grupo cayeron en el mismo nivel
          </p>
        </div>
      </section>

      {casos.map((caso) => (
        <Seccion
          key={caso.id}
          etiqueta={`Caso ${caso.id}`}
          titulo={
            caso.resumen.notaAgente === null
              ? "Sin corrida todavía"
              : caso.resumen.notaHumana === null
                ? `El agente puso ${puntos(caso.resumen.notaAgente)}/100`
                : `Agente ${puntos(caso.resumen.notaAgente)} · Grupo ${puntos(caso.resumen.notaHumana)}`
          }
          bajada={
            caso.cargada
              ? `Coinciden ${caso.resumen.coincidencias} de ${caso.resumen.evaluadas} dimensiones${
                  caso.calibracion.humano.actualizado
                    ? ` · nota del grupo actualizada el ${fecha(caso.calibracion.humano.actualizado)}`
                    : ""
                }.`
              : "Todavía no hay nota del grupo para este caso."
          }
          accion={
            <Link
              href={`/casos/${caso.id}`}
              className="rounded-full border border-borde px-4 py-2 text-sm text-suave transition-colors hover:border-acento hover:text-acento"
            >
              {caso.cargada ? "Editar la nota del grupo" : "Cargar la nota del grupo"}
            </Link>
          }
        >
          <div className="overflow-x-auto rounded-xl border border-borde bg-panel">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-borde text-left">
                  <th className="px-5 py-3 font-normal text-tenue">Dimensión</th>
                  <th className="px-5 py-3 font-normal text-tenue">Nivel del agente</th>
                  <th className="px-5 py-3 font-normal text-tenue">Nivel del grupo</th>
                  <th className="px-5 py-3 text-right font-normal text-tenue">Brecha</th>
                  <th className="px-5 py-3 text-right font-normal text-tenue">Acuerdo</th>
                </tr>
              </thead>
              <tbody>
                {caso.filas.map((fila) => (
                  <tr key={fila.clave} className="border-b border-borde/60">
                    <td className="px-5 py-3">
                      <span className="text-texto">{fila.nombre}</span>
                      <span className="block text-[11px] text-tenue">peso {fila.peso}</span>
                    </td>
                    <td className="px-5 py-3">
                      {fila.nivelAgente === null ? (
                        "—"
                      ) : (
                        <>
                          <span className="tabular-nums text-texto">
                            {fila.nivelAgente}%
                          </span>{" "}
                          <span className="text-tenue">
                            {ETIQUETA_NIVEL[fila.nivelAgente] ?? "fuera de escala"}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {fila.nivelHumano === null ? (
                        "—"
                      ) : (
                        <>
                          <span className="tabular-nums text-texto">
                            {fila.nivelHumano}%
                          </span>{" "}
                          <span className="text-tenue">
                            {ETIQUETA_NIVEL[fila.nivelHumano] ?? "fuera de escala"}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {fila.delta === null ? "—" : conSigno(fila.delta)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {fila.delta === null ? (
                        <Sello estado="pendiente">Falta</Sello>
                      ) : fila.coincide ? (
                        <Sello estado="ok">Coincide</Sello>
                      ) : (
                        <Sello estado="alerta">Desacuerdo</Sello>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {caso.resumen.desacuerdos.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {caso.resumen.desacuerdos.map((desacuerdo) => {
                const fila = caso.resultado?.filas.find((f) => f.clave === desacuerdo.clave);
                return (
                  <Panel key={desacuerdo.clave}>
                    <p className="text-sm text-texto">
                      {desacuerdo.nombre} — el agente puso {desacuerdo.nivelAgente}% y el
                      grupo {desacuerdo.nivelHumano}%.
                    </p>
                    {fila?.justificacion ? (
                      <p className="mt-2 text-xs text-tenue">
                        Justificación del agente: {fila.justificacion}
                      </p>
                    ) : null}
                  </Panel>
                );
              })}
            </div>
          ) : null}

          {caso.calibracion.humano.comentario ? (
            <Panel className="mt-4">
              <Etiqueta>Criterio del grupo</Etiqueta>
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {caso.calibracion.humano.comentario}
              </p>
            </Panel>
          ) : null}
        </Seccion>
      ))}

      <Seccion
        etiqueta="Entrega"
        titulo="calibracion.md"
        bajada="El archivo que se entrega se genera desde estas notas y desde la última corrida de cada caso, para que no pueda discrepar de la evidencia que lo respalda."
        accion={<BotonExportar />}
      >
        {generado ? (
          <Plegable titulo="Ver el archivo generado" subtitulo="raíz del repo">
            <Monoespaciado texto={generado} />
          </Plegable>
        ) : (
          <Panel>
            <p className="text-sm text-tenue">
              Todavía no se generó: cargá las notas del grupo y usá el botón de arriba.
            </p>
          </Panel>
        )}
      </Seccion>
    </div>
  );
}
