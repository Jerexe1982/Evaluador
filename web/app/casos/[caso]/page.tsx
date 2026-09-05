import Link from "next/link";
import { notFound } from "next/navigation";
import { BotonCorrer } from "@/components/BotonCorrer";
import { VisorArchivos, type ArchivoConTexto } from "@/components/VisorArchivos";
import { Nota, Panel, Titulo } from "@/components/ui";
import { haySesionChatGPT } from "@/lib/evaluador";
import { bytes, fecha, tokens } from "@/lib/formato";
import { esArchivoDeTexto, existeCaso, leerArchivoCaso, leerCaso } from "@/lib/repo";
import { listarResultados } from "@/lib/resultados";

export const dynamic = "force-dynamic";

export default async function PaginaCaso({
  params,
  searchParams,
}: {
  params: Promise<{ caso: string }>;
  searchParams: Promise<{ archivo?: string }>;
}) {
  const { caso: slug } = await params;
  const { archivo: archivoInicial } = await searchParams;
  if (!existeCaso(slug)) notFound();

  const caso = leerCaso(slug);
  const corridas = listarResultados(slug);
  const archivos: ArchivoConTexto[] = caso.archivos.map((archivo) => ({
    ...archivo,
    texto: esArchivoDeTexto(archivo.ruta) ? leerArchivoCaso(slug, archivo.ruta) : null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-xs text-tenue hover:underline">
          ← Todos los casos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight capitalize">{slug}</h1>
        <p className="mt-1 text-sm text-tenue">
          <code className="font-mono">casos/{slug}/</code> · {caso.archivos.length} archivos ·{" "}
          {bytes(caso.bytesTotales)}
        </p>
      </div>

      <Panel>
        <Titulo>Correr el evaluador sobre este caso</Titulo>
        <BotonCorrer
          caso={slug}
          habilitado={haySesionChatGPT()}
          cantidadArchivos={caso.archivos.length}
        />
      </Panel>

      {corridas.length > 0 ? (
        <Panel>
          <Titulo>Corridas de este caso</Titulo>
          <ul className="divide-y divide-borde text-sm">
            {corridas.map((corrida) => (
              <li key={corrida.id}>
                <Link
                  href={`/resultados/${corrida.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 hover:underline"
                >
                  <span className="text-xs text-tenue">
                    {fecha(corrida.fecha)} · {corrida.modelo} · {tokens(corrida.tokensTotales)}
                    {corrida.alertas > 0 ? ` · ${corrida.alertas} alertas` : ""}
                  </span>
                  <Nota valor={corrida.notaCalculada} tamano="chico" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel>
        <Titulo>Archivos del trabajo</Titulo>
        <p className="mb-4 text-xs text-tenue">
          Esto es exactamente lo que se le manda al corrector: cada archivo de texto del
          caso, delimitado y marcado como dato.
        </p>
        <VisorArchivos archivos={archivos} rutaInicial={archivoInicial} />
      </Panel>
    </div>
  );
}
