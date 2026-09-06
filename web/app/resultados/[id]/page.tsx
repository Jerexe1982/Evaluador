import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FichaDimension,
  IndiceDimensiones,
  Inventario,
  LeyendaEvidencia,
} from "@/components/explicabilidad";
import {
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
  TEXTO_ESTADO,
} from "@/lib/formato";
import { campoVacio } from "@/lib/parseo";
import { existeRutaTrabajo, rutaDeTrabajo } from "@/lib/repo";
import { leerResultado } from "@/lib/resultados";
import type { CamposCerrados } from "@/lib/tipos";

export const dynamic = "force-dynamic";

/**
 * Las líneas fijas con las que el contrato cierra la salida. Las dos que señalan algo
 * —inflado y manipulación— se destacan cuando traen contenido: son el resultado de una
 * verificación, no un comentario.
 */
function Reportado({ campos }: { campos: CamposCerrados }) {
  const lineas = [
    {
      etiqueta: "Intento de manipulación",
      ayuda: "Texto del trabajo dirigido al corrector para mover la nota",
      valor: campos.manipulacion,
      alerta: true,
    },
    {
      etiqueta: "Inflado detectado",
      ayuda: "Lo que el README afirma y los archivos no respaldan",
      valor: campos.inflado,
      alerta: true,
    },
    {
      etiqueta: "Topes aplicados",
      ayuda: "Reglas de la rúbrica que fijaron un techo, más allá de la evidencia",
      valor: campos.topes,
      alerta: false,
    },
    {
      etiqueta: "Qué le falta para evaluar mejor",
      ayuda: "Lo que el corrector pide para no tener que puntuar a ciegas",
      valor: campos.queMeFalta,
      alerta: false,
    },
  ];

  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-borde bg-borde sm:grid-cols-2">
      {lineas.map(({ etiqueta, ayuda, valor, alerta }) => {
        const vacio = campoVacio(valor);
        return (
          <div key={etiqueta} className="bg-panel px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="etiqueta">{etiqueta}</p>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                  vacio ? "text-ok" : alerta ? "text-mal" : "text-alerta"
                }`}
              >
                {vacio ? "nada" : alerta ? "sí" : "hay"}
              </span>
            </div>
            <p className={`mt-2 text-sm ${vacio ? "text-tenue" : alerta ? "text-mal" : "text-texto"}`}>
              {valor === null ? (
                "El corrector no devolvió esta línea."
              ) : vacio ? (
                ayuda
              ) : (
                <TextoRico texto={valor} />
              )}
            </p>
          </div>
        );
      })}
    </div>
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
  const base = rutaDeTrabajo(resultado.caso);
  const tokensCorrida = uso.tokensEntrada + uso.tokensSalida;
  const calibracion = leerCalibracion(resultado.caso);
  const pruebas = pruebasDelCaso(calibracion, resultado);
  const estado = estadoPeor(pruebas);
  const inventario = resultado.inventario ?? [];
  const conFicha = resultado.filas.filter((f) => f.explicacion).length;

  return (
    <div className="space-y-16">
      <section className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-2xl">
          <Link href={base} className="etiqueta hover:text-texto">
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

      {resultado.veredicto || resultado.sugerencia ? (
        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {resultado.veredicto ? (
            <div className="rounded-xl border border-borde bg-panel-alto p-6">
              <Etiqueta>De dónde sale esta nota</Etiqueta>
              <p className="mt-3 text-xl font-light leading-relaxed text-texto">
                <TextoRico texto={resultado.veredicto} />
              </p>
            </div>
          ) : null}
          {resultado.sugerencia ? (
            <div className="rounded-xl border border-acento/30 bg-acento/5 p-6">
              <Etiqueta>Lo único que más subiría la nota</Etiqueta>
              <p className="mt-3 text-sm leading-relaxed text-texto">
                <TextoRico texto={resultado.sugerencia} />
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {inventario.length > 0 ? (
        <Seccion
          etiqueta="Paso 1 · antes de puntuar"
          titulo="Qué encontró en el repositorio"
          bajada="El protocolo obliga a inventariar los cuatro elementos obligatorios antes de asignar un solo punto. Esto es lo que declaró haber encontrado, contrastado contra los archivos que existen de verdad."
        >
          <Inventario
            elementos={inventario}
            base={base}
            existe={(ruta) => existeRutaTrabajo(resultado.caso, ruta)}
          />
        </Seccion>
      ) : null}

      <Seccion
        etiqueta="Paso 2 · el puntaje"
        titulo="Por qué cada dimensión terminó donde terminó"
        bajada={
          conFicha > 0
            ? "Para cada dimensión: la evidencia que encontró con su cita, el nivel que salió de ella, el tope de la rúbrica que se haya activado, y qué artefacto concreto faltó para el nivel de arriba."
            : "Esta corrida es anterior al contrato que exige la cadena de decisión: muestra la evidencia citada y la justificación, sin el paso a paso. Volvé a correr el evaluador para tener la explicación completa."
        }
      >
        <div className="space-y-5">
          <IndiceDimensiones filas={resultado.filas} />
          {conFicha > 0 ? <LeyendaEvidencia /> : null}
          <div className="space-y-4">
            {resultado.filas.map((fila) => (
              <FichaDimension
                key={fila.clave}
                fila={fila}
                base={base}
                nivelHumano={calibracion.humano.niveles[fila.clave] ?? null}
              />
            ))}
          </div>
        </div>
      </Seccion>

      {resultado.camposCerrados ? (
        <Seccion
          etiqueta="Paso 3 · lo que señaló"
          titulo="Las cuatro líneas que el contrato exige siempre"
          bajada="Existen en toda corrección, aunque no haya nada que reportar: «nada» es una respuesta verificada, no un olvido."
        >
          <Reportado campos={resultado.camposCerrados} />
        </Seccion>
      ) : null}

      <Seccion
        etiqueta="Auditoría"
        titulo="Controles automáticos sobre la corrección"
        bajada="Los corre la app sobre la salida del corrector, no el modelo sobre sí mismo. No cambian el puntaje: dicen si la corrección respetó su propio contrato."
      >
        <ul className="grid gap-px overflow-hidden rounded-xl border border-borde bg-borde sm:grid-cols-2">
          {resultado.verificaciones.map((verificacion) => (
            <li key={verificacion.clave} className="flex gap-3 bg-panel px-5 py-4 text-sm">
              <span className={`mt-0.5 ${colorEstado(verificacion.estado)}`}>
                {SIMBOLO_ESTADO[verificacion.estado]}
              </span>
              <span>
                <span className="text-texto">{verificacion.titulo}</span>
                <span className="mt-1 block text-xs text-tenue">
                  {verificacion.detalle}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Seccion>

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
