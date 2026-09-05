import Anthropic from "@anthropic-ai/sdk";
import { armarUserPrompt } from "./prompt";
import { leerSystemPromptAgente } from "./repo";
import { buscarModelo, MODELO_POR_DEFECTO } from "./modelos";
import {
  parsearFilas,
  parsearNotaFinal,
  parsearSugerencia,
  sumarPuntajes,
  verificar,
} from "./parseo";
import { nuevoId } from "./resultados";
import type { Resultado } from "./tipos";

export function hayCredenciales(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/**
 * Corre el agente corrector sobre un caso y devuelve el resultado ya parseado,
 * con la entrada exacta que se mandó y el uso de tokens de esa corrida.
 */
export async function evaluarCaso(slug: string, modeloId: string): Promise<Resultado> {
  const modelo = buscarModelo(modeloId) ?? buscarModelo(MODELO_POR_DEFECTO)!;
  const systemPrompt = leerSystemPromptAgente();
  const { userPrompt, archivos } = armarUserPrompt(slug);

  const cliente = new Anthropic();
  const inicio = Date.now();

  const respuesta = await cliente.beta.messages.create({
    model: modelo.id,
    max_tokens: 16000,
    system: systemPrompt,
    // El razonamiento resumido es parte de la explicabilidad que muestra la app.
    thinking: { type: "adaptive", display: "summarized" },
    // Si un clasificador de seguridad rechaza la corrida, el servidor la deriva
    // a otro modelo en vez de devolver una evaluación vacía.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: userPrompt }],
  });

  const duracionMs = Date.now() - inicio;

  if (respuesta.stop_reason === "refusal") {
    throw new Error(
      `El modelo rechazó la corrida (${respuesta.stop_details?.type ?? "sin detalle"}).`,
    );
  }

  const salidaCruda = respuesta.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const razonamiento =
    respuesta.content
      .filter((b) => b.type === "thinking")
      .map((b) => b.thinking)
      .join("\n\n")
      .trim() || null;

  const filas = parsearFilas(salidaCruda, slug);
  const notaDeclarada = parsearNotaFinal(salidaCruda);
  const notaCalculada = sumarPuntajes(filas);
  const sugerencia = parsearSugerencia(salidaCruda);

  const tokensEntrada = respuesta.usage.input_tokens;
  const tokensSalida = respuesta.usage.output_tokens;
  const costoUSD =
    (tokensEntrada * modelo.entradaPorMillon + tokensSalida * modelo.salidaPorMillon) /
    1_000_000;

  const fecha = new Date();

  return {
    id: nuevoId(slug, fecha),
    caso: slug,
    fecha: fecha.toISOString(),
    modelo: respuesta.model ?? modelo.id,
    duracionMs,
    filas,
    notaDeclarada,
    notaCalculada,
    sugerencia,
    razonamiento,
    salidaCruda,
    uso: {
      tokensEntrada,
      tokensSalida,
      tokensCacheLectura: respuesta.usage.cache_read_input_tokens ?? 0,
      costoUSD,
      precioEntradaPorMillon: modelo.entradaPorMillon,
      precioSalidaPorMillon: modelo.salidaPorMillon,
    },
    entrada: { systemPrompt, userPrompt, archivos },
    verificaciones: verificar(
      filas,
      notaDeclarada,
      notaCalculada,
      salidaCruda,
      sugerencia,
    ),
  };
}
