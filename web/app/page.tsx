import Link from "next/link";
import {
  estabilidadPorModelo,
  estadoPeor,
  pruebaDeSeparacion,
  pruebasDelCaso,
  type Prueba,
} from "@/lib/analisis";
import { hayNotaHumana, leerCalibracion, notaHumana } from "@/lib/calibracion";
import { Barra, Etiqueta, Nota, Panel, Seccion, Sello } from "@/components/ui";
import {
  colorEstado,
  conSigno,
  esfuerzoCorto,
  fecha,
  puntos,
  SIMBOLO_ESTADO,
  TEXTO_ESTADO,
  tokens,
} from "@/lib/formato";
import { listarCasos, listarRepos } from "@/lib/repo";
import { DIMENSIONES } from "@/lib/rubrica";
import { listarResultados, ultimoResultadoCompleto } from "@/lib/resultados";

export const dynamic = "force-dynamic";

function ListaPruebas({ pruebas }: { pruebas: Prueba[] }) {
  return (
    <ul className="space-y-2.5">
      {pruebas.map((prueba) => (
        <li key={prueba.clave} className="flex gap-3 text-sm">
          <span className={`mt-0.5 ${colorEstado(prueba.estado)}`}>
            {SIMBOLO_ESTADO[prueba.estado]}
          </span>
          <span>
            <span className="text-texto">{prueba.titulo}</span>
            <span className="block text-xs text-tenue">{prueba.detalle}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Inicio() {
  const casos = listarCasos();
  const ultimos = casos.map((caso) => {
    const resultado = ultimoResultadoCompleto(caso.id);
    const calibracion = leerCalibracion(caso.id);
    const pruebas = pruebasDelCaso(calibracion, resultado);
    return {
      caso,
      resultado,
      calibracion,
      pruebas,
      estado: estadoPeor(pruebas),
      humana: hayNotaHumana(calibracion.humano) ? notaHumana(calibracion.humano) : null,
    };
  });
  const separacion = pruebaDeSeparacion(
    ultimos.map((u) => ({ caso: u.caso.id, resultado: u.resultado })),
  );
  const conResultado = ultimos.filter((u) => u.resultado !== null);
  const repos = listarRepos().map((trabajo) => ({
    trabajo,
    resultado: ultimoResultadoCompleto(trabajo.id),
  }));
  const reposCorregidos = repos
    .filter((r) => r.resultado !== null)
    .sort((a, b) => b.resultado!.notaCalculada - a.resultado!.notaCalculada);
  const inestabilidades = estabilidadPorModelo();
  const corridas = listarResultados().slice(0, 8);

  const pruebasTotales = ultimos.flatMap((u) => u.pruebas).concat(separacion ?? []);
  const veredicto = estadoPeor(pruebasTotales);

  return (
    <div className="space-y-16">
      <section className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-2xl">
          <Etiqueta>Programación de y con Agentes de IA · MBA UCEMA</Etiqueta>
          <h1 className="mt-3 text-4xl font-light leading-tight tracking-tight text-texto">
            El agente corrector, sometido a su propia prueba.
          </h1>
          <p className="mt-4 text-sm leading-relaxed">
            Corrige trabajos finales con la rúbrica de la materia vuelta ejecutable, y deja
            cada punto anclado a un archivo del repositorio: qué encontró, qué le faltó y
            qué habría hecho falta para el nivel de arriba. Este tablero corre la prueba de
            los tres casos, compara las notas del agente con las del grupo y guarda cada
            corrida como evidencia.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/trabajos"
              className="rounded-full bg-acento px-5 py-2 text-sm text-black transition-opacity hover:opacity-90"
            >
              Corregir un repositorio
            </Link>
            <Link
              href="/rubrica"
              className="rounded-full border border-borde px-5 py-2 text-sm text-suave transition-colors hover:border-acento hover:text-acento"
            >
              Ver la rúbrica
            </Link>
          </div>
        </div>
        <div className="md:text-right">
          <Etiqueta>Veredicto</Etiqueta>
          <p
            className={`mt-3 text-5xl font-light tracking-tight ${colorEstado(veredicto)}`}
          >
            {TEXTO_ESTADO[veredicto]}
          </p>
          <p className="mt-2 max-w-56 text-xs text-tenue md:ml-auto">
            {pruebasTotales.filter((p) => p.estado === "ok").length} de{" "}
            {pruebasTotales.length} controles en verde sobre la última corrida de cada caso.
          </p>
        </div>
      </section>

      <Seccion
        etiqueta="Cómo funciona"
        titulo="Tres pasos, y ninguno depende de leer la salida a ojo"
      >
        <ol className="grid gap-px overflow-hidden rounded-xl border border-borde bg-borde md:grid-cols-3">
          {[
            {
              titulo: "Entra el trabajo",
              texto:
                "Uno de los tres casos de prueba o un repositorio de GitHub clonado. La app le manda al corrector el árbol de archivos, el contenido de cada uno y la historia de commits, todo marcado como dato.",
            },
            {
              titulo: "Se aplica la rúbrica",
              texto:
                "El mismo contrato en todas las corridas. Cinco dimensiones, cinco niveles, sin valores intermedios, y topes que impiden subir sin el artefacto que el nivel exige.",
            },
            {
              titulo: "Queda la explicación",
              texto:
                "Cada nivel viene con la evidencia citada, el tope que se activó y qué faltó para el nivel de arriba. La app verifica que las rutas existan y que las cuentas cierren.",
            },
          ].map((paso, i) => (
            <li key={paso.titulo} className="bg-panel p-5">
              <p className="font-mono text-xs text-acento">{i + 1}</p>
              <h3 className="mt-2 text-base font-light text-texto">{paso.titulo}</h3>
              <p className="mt-2 text-xs leading-relaxed text-tenue">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </Seccion>

      <Seccion
        etiqueta="Criterio 3 del parcial · peso 20"
        titulo="La prueba de los tres casos"
        bajada="El corrector tiene que puntuar alto al excelente, bajo al flojo y además detectar al tramposo. Cada control se resuelve contra la última corrida guardada del caso."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {ultimos.map(({ caso, resultado, calibracion, pruebas, estado, humana }) => (
            <Panel key={caso.id} className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/casos/${caso.id}`}
                    className="text-lg font-light capitalize text-texto hover:text-acento"
                  >
                    {caso.id}
                  </Link>
                  <p className="mt-1 text-xs text-tenue">
                    {calibracion.expectativa.proposito}
                  </p>
                </div>
                <Sello estado={estado}>{TEXTO_ESTADO[estado]}</Sello>
              </div>

              {resultado ? (
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <Nota valor={resultado.notaCalculada} tamano="grande" />
                    <span className="text-right text-[11px] text-tenue">
                      {fecha(resultado.fecha)}
                      {humana !== null ? (
                        <span className="block">el grupo puso {puntos(humana)}</span>
                      ) : null}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {resultado.filas.map((fila) => (
                      <div key={fila.clave}>
                        <div className="mb-1.5 flex justify-between text-[11px]">
                          <span className="text-tenue">{fila.nombre}</span>
                          <span className="tabular-nums text-suave">
                            {fila.puntaje === null ? "—" : puntos(fila.puntaje)}/{fila.peso}
                          </span>
                        </div>
                        <Barra porcentaje={fila.nivel ?? 0} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-tenue">
                  Sin corridas todavía: abrí el caso y corré el evaluador.
                </p>
              )}

              <ListaPruebas pruebas={pruebas} />
              {resultado ? (
                <Link
                  href={`/resultados/${resultado.id}`}
                  className="mt-auto text-xs text-tenue hover:text-acento"
                >
                  Ver por qué puso esa nota →
                </Link>
              ) : null}
            </Panel>
          ))}
        </div>
        {separacion ? (
          <Panel className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-texto">{separacion.titulo}</p>
                <p className="mt-1 text-xs text-tenue">{separacion.detalle}</p>
              </div>
              <Sello estado={separacion.estado}>{TEXTO_ESTADO[separacion.estado]}</Sello>
            </div>
          </Panel>
        ) : null}
      </Seccion>

      {conResultado.length > 1 ? (
        <Seccion
          etiqueta="Comparación"
          titulo="La misma rúbrica sobre los tres casos"
          bajada="Puntaje del agente y, entre paréntesis, el del grupo. Donde los dos números difieren hay un desacuerdo de calibración."
        >
          <div className="overflow-x-auto rounded-xl border border-borde bg-panel">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-borde">
                  <th className="px-5 py-3 text-left font-normal text-tenue">Dimensión</th>
                  <th className="px-3 py-3 text-right font-normal text-tenue">Peso</th>
                  {conResultado.map(({ caso }) => (
                    <th
                      key={caso.id}
                      className="px-5 py-3 text-right font-normal capitalize text-texto"
                    >
                      {caso.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIMENSIONES.map((dimension) => (
                  <tr key={dimension.clave} className="border-b border-borde/60">
                    <td className="px-5 py-3">{dimension.nombre}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-tenue">
                      {dimension.peso}
                    </td>
                    {conResultado.map(({ caso, resultado, calibracion }) => {
                      const fila = resultado!.filas.find(
                        (f) => f.clave === dimension.clave,
                      );
                      const nivel = calibracion.humano.niveles[dimension.clave];
                      const humano =
                        nivel === undefined ? null : (nivel * dimension.peso) / 100;
                      return (
                        <td
                          key={caso.id}
                          className="px-5 py-3 text-right tabular-nums text-texto"
                        >
                          {fila?.puntaje == null ? "—" : puntos(fila.puntaje)}
                          {humano !== null ? (
                            <span
                              className={
                                fila?.puntaje === humano ? "text-tenue" : "text-alerta"
                              }
                            >
                              {" "}
                              ({puntos(humano)})
                            </span>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="px-5 py-3 text-texto">Nota final</td>
                  <td className="px-3 py-3 text-right tabular-nums text-tenue">100</td>
                  {conResultado.map(({ caso, resultado, humana }) => (
                    <td key={caso.id} className="px-5 py-3 text-right tabular-nums">
                      <span className="text-texto">{puntos(resultado!.notaCalculada)}</span>
                      {humana !== null ? (
                        <span className="text-tenue">
                          {" "}
                          ({puntos(humana)} ·{" "}
                          {conSigno(resultado!.notaCalculada - humana)})
                        </span>
                      ) : null}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Seccion>
      ) : null}

      {inestabilidades.length > 0 ? (
        <Seccion
          etiqueta="Consistencia"
          titulo="¿Aplica la rúbrica igual dos veces?"
          bajada="Corridas del mismo caso con el mismo modelo. Si la nota se mueve entre ellas, la rúbrica todavía deja margen de interpretación."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {inestabilidades.map((e) => {
              const estable = e.notaMinima === e.notaMaxima;
              return (
                <Panel
                  key={`${e.caso}\u0000${e.modelo}\u0000${e.esfuerzo}\u0000${e.contrato}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm capitalize text-texto">
                        {e.caso}{" "}
                        <span className="font-mono text-xs text-tenue">
                          {e.modelo} · esfuerzo {esfuerzoCorto(e.esfuerzo)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-tenue">
                        {e.corridas} corridas ·{" "}
                        {estable
                          ? `siempre ${puntos(e.notaMinima)}/100`
                          : `entre ${puntos(e.notaMinima)} y ${puntos(e.notaMaxima)}/100`}
                      </p>
                    </div>
                    <Sello estado={estable ? "ok" : "alerta"}>
                      {estable ? "Estable" : "Se mueve"}
                    </Sello>
                  </div>
                  {e.inestables.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-xs text-alerta">
                      {e.inestables.map((d) => (
                        <li key={d.nombre}>
                          {d.nombre}: {d.valores.map(puntos).join(" · ")}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Panel>
              );
            })}
          </div>
        </Seccion>
      ) : null}

      <Seccion
        etiqueta="A pedido"
        titulo="Trabajos de GitHub"
        bajada="El mismo corrector, sobre entregas reales: se pega la lista de repositorios y los corrige uno por uno, atando cada corrección al commit que corrigió."
        accion={
          <Link
            href="/trabajos"
            className="rounded-full border border-borde px-4 py-2 text-sm text-suave transition-colors hover:border-acento hover:text-acento"
          >
            {repos.length > 0 ? "Ver los trabajos" : "Cargar una lista"}
          </Link>
        }
      >
        {repos.length === 0 ? (
          <Panel>
            <p className="text-sm text-tenue">
              Todavía no hay repositorios cargados. Los tres casos de prueba sirven para
              calibrar el corrector; la lista de GitHub es para lo que viene después:
              corregir entregas que el agente nunca vio.
            </p>
          </Panel>
        ) : (
          <ul className="divide-y divide-borde border-y border-borde">
            {reposCorregidos.slice(0, 5).map(({ trabajo, resultado }) => (
              <li key={trabajo.id}>
                <Link
                  href={`/trabajos/${trabajo.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 transition-colors hover:text-texto"
                >
                  <span className="text-texto">
                    {trabajo.origen
                      ? `${trabajo.origen.owner}/${trabajo.origen.repo}`
                      : trabajo.id}
                  </span>
                  <span className="flex-1 font-mono text-[11px] text-tenue">
                    {fecha(resultado!.fecha)} · {resultado!.modelo}
                  </span>
                  <span className="tabular-nums text-texto">
                    {puntos(resultado!.notaCalculada)}
                    <span className="text-tenue">/100</span>
                  </span>
                </Link>
              </li>
            ))}
            {reposCorregidos.length === 0 ? (
              <li className="py-3 text-sm text-tenue">
                {repos.length} {repos.length === 1 ? "repositorio clonado" : "repositorios clonados"}, ninguno corregido todavía.
              </li>
            ) : null}
          </ul>
        )}
      </Seccion>

      {corridas.length > 0 ? (
        <Seccion etiqueta="Historial" titulo="Últimas corridas">
          <ul className="divide-y divide-borde border-y border-borde">
            {corridas.map((corrida) => (
              <li key={corrida.id}>
                <Link
                  href={`/resultados/${corrida.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 transition-colors hover:text-texto"
                >
                  <span className="w-24 capitalize text-texto">{corrida.caso}</span>
                  <span className="flex-1 font-mono text-[11px] text-tenue">
                    {fecha(corrida.fecha)} · {corrida.modelo} ·{" "}
                    {tokens(corrida.tokensTotales)}
                    {corrida.alertas > 0 ? ` · ${corrida.alertas} alertas` : ""}
                  </span>
                  <span className="tabular-nums text-texto">
                    {puntos(corrida.notaCalculada)}
                    <span className="text-tenue">/100</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Seccion>
      ) : null}
    </div>
  );
}
