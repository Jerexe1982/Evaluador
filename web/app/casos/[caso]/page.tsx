import Link from "next/link";
import { notFound } from "next/navigation";
import { BotonCorrer } from "@/components/BotonCorrer";
import { FormularioCalibracion } from "@/components/FormularioCalibracion";
import { ResumenCorreccion } from "@/components/explicabilidad";
import { VisorArchivos, type ArchivoConTexto } from "@/components/VisorArchivos";
import { Escala, Etiqueta, Nota, Panel, Seccion, Sello } from "@/components/ui";
import {
  brechas,
  estabilidadPorModelo,
  estadoPeor,
  pruebasDelCaso,
  resumirBrechas,
} from "@/lib/analisis";
import { leerCalibracion } from "@/lib/calibracion";
import { resumenSesion } from "@/lib/credenciales";
import {
  bytes,
  colorEstado,
  conSigno,
  fecha,
  puntos,
  SIMBOLO_ESTADO,
  TEXTO_ESTADO,
  tokens,
} from "@/lib/formato";
import { esArchivoDeTexto, existeCaso, leerArchivoCaso, leerCaso } from "@/lib/repo";
import { DIMENSIONES, ETIQUETA_NIVEL } from "@/lib/rubrica";
import { listarResultados, ultimoResultadoCompleto } from "@/lib/resultados";

export const dynamic = "force-dynamic";

export default async function PaginaCaso({
  params,
  searchParams,
}: {
  params: Promise<{ caso: string }>;
  searchParams: Promise<{ archivo?: string; cita?: string }>;
}) {
  const { caso: slug } = await params;
  const { archivo: archivoInicial, cita } = await searchParams;
  if (!existeCaso(slug)) notFound();

  const caso = leerCaso(slug);
  const sesion = resumenSesion();
  const corridas = listarResultados(slug);
  const ultimo = ultimoResultadoCompleto(slug);
  const calibracion = leerCalibracion(slug);
  const pruebas = pruebasDelCaso(calibracion, ultimo);
  const estado = estadoPeor(pruebas);
  const resumen = resumirBrechas(ultimo, calibracion);
  const estabilidad = estabilidadPorModelo(slug);
  const pesos = Object.fromEntries(DIMENSIONES.map((d) => [d.clave, d.peso]));
  const archivos: ArchivoConTexto[] = caso.archivos.map((archivo) => ({
    ...archivo,
    texto: esArchivoDeTexto(archivo.ruta) ? leerArchivoCaso(slug, archivo.ruta) : null,
  }));

  return (
    <div className="space-y-16">
      <section className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-2xl">
          <Link href="/" className="etiqueta hover:text-texto">
            ← Tablero
          </Link>
          <h1 className="mt-4 text-4xl font-light capitalize tracking-tight text-texto">
            {slug}
          </h1>
          <p className="mt-3 text-sm leading-relaxed">
            {calibracion.expectativa.proposito}
          </p>
          <p className="mt-2 font-mono text-[11px] text-tenue">
            casos/{slug}/ · {caso.archivos.length} archivos · {bytes(caso.bytesTotales)}
          </p>
        </div>
        <div className="md:text-right">
          <Etiqueta>Última corrida</Etiqueta>
          <div className="mt-2">
            {ultimo ? <Nota valor={ultimo.notaCalculada} /> : (
              <p className="text-2xl font-light text-tenue">Sin corridas</p>
            )}
          </div>
          <div className="mt-3 flex md:justify-end">
            <Sello estado={estado}>{TEXTO_ESTADO[estado]}</Sello>
          </div>
        </div>
      </section>

      <Seccion
        etiqueta="Prueba del caso"
        titulo="Qué tiene que lograr el corrector acá"
        bajada="Los controles salen de la consigna del parcial y se resuelven contra la última corrida guardada."
      >
        <Panel>
          <ul className="space-y-3">
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
        </Panel>
      </Seccion>

      {ultimo ? (
        <Seccion
          etiqueta="Última corrección"
          titulo="Qué dijo el corrector"
          bajada="El resumen de la última corrida. La corrección completa muestra, dimensión por dimensión, la evidencia citada, el tope aplicado y qué faltó para el nivel de arriba."
          accion={
            <Link
              href={`/resultados/${ultimo.id}`}
              className="rounded-full border border-borde px-4 py-2 text-sm text-suave transition-colors hover:border-acento hover:text-acento"
            >
              Ver la corrección completa
            </Link>
          }
        >
          <ResumenCorreccion
            veredicto={ultimo.veredicto}
            filas={ultimo.filas}
            sugerencia={ultimo.sugerencia}
          />
        </Seccion>
      ) : null}

      <Seccion
        etiqueta="Corrida"
        titulo="Correr el evaluador sobre este caso"
        bajada="Mismo contrato y misma rúbrica en todas las corridas: lo único que cambia es el modelo."
      >
        <Panel>
          <BotonCorrer
            caso={slug}
            habilitado={sesion.activa}
            plan={sesion.plan}
            cantidadArchivos={caso.archivos.length}
          />
        </Panel>
      </Seccion>

      <Seccion
        etiqueta="Calibración"
        titulo="Qué nota le hubiera puesto el grupo"
        bajada="La mitad humana de la calibración. Se guarda en el repo y alimenta calibracion.md; el agente nunca la ve."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <FormularioCalibracion
              caso={slug}
              humano={calibracion.humano}
              pesos={pesos}
            />
          </Panel>
          <Panel>
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <Etiqueta>Brecha con el agente</Etiqueta>
                <p className="mt-2 text-sm text-texto">
                  {resumen.notaHumana === null
                    ? "Todavía no hay nota del grupo para comparar."
                    : `Coinciden ${resumen.coincidencias} de ${resumen.evaluadas} dimensiones.`}
                </p>
              </div>
              {resumen.delta !== null ? (
                <p
                  className={`text-3xl font-light tabular-nums ${
                    Math.abs(resumen.delta) <= 5 ? "text-ok" : "text-alerta"
                  }`}
                >
                  {conSigno(resumen.delta)}
                </p>
              ) : null}
            </div>
            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="border-b border-borde text-left">
                  <th className="py-2 font-normal text-tenue">Dimensión</th>
                  <th className="py-2 text-right font-normal text-tenue">Agente</th>
                  <th className="py-2 text-right font-normal text-tenue">Grupo</th>
                  <th className="py-2 text-right font-normal text-tenue">Brecha</th>
                </tr>
              </thead>
              <tbody>
                {brechas(ultimo, calibracion).map((fila) => (
                  <tr key={fila.clave} className="border-b border-borde/50">
                    <td className="py-2">
                      <span className="text-texto">{fila.nombre}</span>
                      <span className="mt-1 block">
                        <Escala nivel={fila.nivelAgente} />
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {fila.puntajeAgente === null ? "—" : puntos(fila.puntajeAgente)}
                      <span className="block text-[11px] text-tenue">
                        {fila.nivelAgente === null
                          ? ""
                          : (ETIQUETA_NIVEL[fila.nivelAgente] ?? "fuera de escala")}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {fila.puntajeHumano === null ? "—" : puntos(fila.puntajeHumano)}
                    </td>
                    <td
                      className={`py-2 text-right tabular-nums ${
                        fila.delta === null
                          ? "text-tenue"
                          : fila.coincide
                            ? "text-ok"
                            : "text-alerta"
                      }`}
                    >
                      {fila.delta === null ? "—" : conSigno(fila.delta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-tenue">
              El detalle de los desacuerdos y el archivo que los deja documentados están en{" "}
              <Link href="/calibracion" className="text-suave hover:text-acento">
                Calibración
              </Link>
              .
            </p>
          </Panel>
        </div>
      </Seccion>

      {corridas.length > 0 ? (
        <Seccion
          etiqueta="Historial"
          titulo="Corridas de este caso"
          bajada={
            estabilidad.length > 0
              ? estabilidad
                  .map((e) =>
                    e.notaMinima === e.notaMaxima
                      ? `${e.modelo}: ${e.corridas} corridas, siempre ${puntos(e.notaMinima)}/100.`
                      : `${e.modelo}: ${e.corridas} corridas, entre ${puntos(e.notaMinima)} y ${puntos(e.notaMaxima)}/100.`,
                  )
                  .join(" ")
              : undefined
          }
        >
          <ul className="divide-y divide-borde border-y border-borde">
            {corridas.map((corrida) => (
              <li key={corrida.id}>
                <Link
                  href={`/resultados/${corrida.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 transition-colors hover:text-texto"
                >
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

      <Seccion
        id="archivos"
        etiqueta="Entrada"
        titulo="Los archivos del trabajo"
        bajada="Esto es exactamente lo que se le manda al corrector: cada archivo de texto del caso, delimitado y marcado como dato. Buscá acá cualquier cita de la corrección para verla en su contexto."
      >
        <VisorArchivos
          archivos={archivos}
          rutaInicial={archivoInicial}
          citaInicial={cita}
        />
      </Seccion>
    </div>
  );
}
