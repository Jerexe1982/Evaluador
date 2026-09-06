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
import { colorEstado, conSigno, fecha, puntos, SIMBOLO_ESTADO, tokens } from "@/lib/formato";
import { listarCasos, listarRepos } from "@/lib/repo";
import { DIMENSIONES } from "@/lib/rubrica";
import { listarResultados, ultimoResultadoCompleto } from "@/lib/resultados";

export const dynamic = "force-dynamic";

const TEXTO_ESTADO = {
  ok: "Pasa",
  alerta: "Con reservas",
  error: "No pasa",
  pendiente: "Pendiente",
} as const;

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
        <div className="max-w-2xl space-y-8">
          <div>
            <Etiqueta>Qué es</Etiqueta>
            <h1 className="mt-3 text-4xl font-light leading-tight tracking-tight text-texto">
              El agente corrector, sometido a su propia prueba.
            </h1>
          </div>
          <div>
            <Etiqueta>Para qué sirve este tablero</Etiqueta>
            <p className="mt-3 text-sm leading-relaxed">
              La consigna del parcial pide que el corrector puntúe alto al caso excelente,
              bajo al flojo y detecte al tramposo, y que las notas del agente se puedan
              contrastar con el criterio del grupo. Esta app corre esa prueba, muestra de
              dónde sale cada punto y escribe la calibración con el resultado.
            </p>
          </div>
          <div>
            <Etiqueta>Alcance</Etiqueta>
            <p className="mt-3 text-sm leading-relaxed text-tenue">
              Rúbrica ejecutable, contrato del corrector, tres casos de prueba y calibración
              documentada.
            </p>
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
        etiqueta="Criterio 3 del parcial · peso 20"
        titulo="La prueba de los tres casos"
        bajada="Los tres existen y el corrector los distingue. Cada control se resuelve contra la última corrida guardada del caso; ninguno depende de leer la salida a ojo."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {ultimos.map(({ caso, resultado, calibracion, pruebas, estado }) => (
            <Panel key={caso.id} className="flex flex-col gap-4">
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
              <ListaPruebas pruebas={pruebas} />
              {resultado ? (
                <Link
                  href={`/resultados/${resultado.id}`}
                  className="mt-auto text-xs text-tenue hover:text-acento"
                >
                  Ver la corrección completa →
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

      <Seccion
        etiqueta="Casos"
        titulo="La última nota de cada uno"
        bajada="Dimensión por dimensión, con la nota que le hubiera puesto el grupo al lado cuando está cargada."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ultimos.map(({ caso, resultado, humana }) => (
            <Link
              key={caso.id}
              href={`/casos/${caso.id}`}
              className="group rounded-xl border border-borde bg-panel p-5 transition-colors hover:border-borde-fuerte"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-light capitalize text-texto">{caso.id}</h3>
                {resultado ? <Nota valor={resultado.notaCalculada} tamano="chico" /> : null}
              </div>
              <p className="mt-1 text-xs text-tenue">
                {caso.archivos.length} archivos ·{" "}
                {resultado ? `corrida ${fecha(resultado.fecha)}` : "sin corridas todavía"}
                {humana !== null ? ` · el grupo puso ${puntos(humana)}` : ""}
              </p>
              {resultado ? (
                <div className="mt-5 space-y-2.5">
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
              ) : (
                <p className="mt-5 text-xs text-tenue">
                  Abrí el caso y corré el evaluador para ver la corrección.
                </p>
              )}
            </Link>
          ))}
        </div>
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
                <Panel key={`${e.caso}-${e.modelo}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm capitalize text-texto">
                        {e.caso}{" "}
                        <span className="font-mono text-xs text-tenue">{e.modelo}</span>
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
