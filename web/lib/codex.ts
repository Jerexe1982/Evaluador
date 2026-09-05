import { randomUUID } from "node:crypto";
import type { Credenciales } from "./credenciales";

/**
 * Cliente mínimo del backend de Codex, el que atiende a las suscripciones de
 * ChatGPT. Habla la Responses API de OpenAI, pero contra `chatgpt.com` y con el
 * access token de la sesión en vez de una clave de API. Es el mismo transporte
 * que usa el proveedor de ChatGPT Plus/Pro de pi.
 */

const URL_CODEX = "https://chatgpt.com/backend-api/codex/responses";
/** Identifica al cliente ante el backend; es un nombre libre, no una credencial. */
const ORIGINATOR = "evaluador-ucema";
const TIMEOUT_MS = 280_000;

export type Esfuerzo = "low" | "medium" | "high";

export type UsoCodex = {
  entrada: number;
  salida: number;
  cacheLectura: number;
  /** Incluidos dentro de los de salida. */
  razonamiento: number;
};

export type RespuestaCodex = {
  texto: string;
  /** El resumen del razonamiento, cuando el modelo lo devuelve. */
  razonamiento: string | null;
  modelo: string;
  uso: UsoCodex;
};

type ParteTexto = { type?: string; text?: string };

type EventoSSE = {
  type?: string;
  text?: string;
  error?: { message?: string };
  item?: { type?: string; content?: ParteTexto[]; summary?: ParteTexto[] };
  response?: {
    model?: string;
    status?: string;
    incomplete_details?: { reason?: string };
    error?: { message?: string };
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      input_tokens_details?: { cached_tokens?: number };
      output_tokens_details?: { reasoning_tokens?: number };
    };
  };
};

/** El backend solo responde en streaming, así que hay que leer el SSE entero. */
async function* eventos(cuerpo: ReadableStream<Uint8Array>): AsyncGenerator<EventoSSE> {
  const lector = cuerpo.getReader();
  const decodificador = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await lector.read();
    if (!done) buffer += decodificador.decode(value, { stream: true });

    let corte = buffer.indexOf("\n\n");
    while (corte !== -1) {
      const bloque = buffer.slice(0, corte);
      buffer = buffer.slice(corte + 2);
      for (const linea of bloque.split("\n")) {
        if (!linea.startsWith("data:")) continue;
        const dato = linea.slice(5).trim();
        if (!dato || dato === "[DONE]") continue;
        try {
          yield JSON.parse(dato) as EventoSSE;
        } catch {
          // Un bloque suelto que no es JSON no debería tirar abajo la corrida.
        }
      }
      corte = buffer.indexOf("\n\n");
    }

    if (done) return;
  }
}

function mensajeDeError(status: number, cuerpo: string): string {
  if (status === 401 || status === 403) {
    return `ChatGPT rechazó la sesión (${status}). Volvé a entrar con \`codex login\`.`;
  }
  if (status === 429) {
    return `Llegaste al límite de uso de tu plan de ChatGPT (${status}). Probá más tarde o con un modelo más chico.`;
  }
  const detalle = cuerpo.slice(0, 400);
  return `El backend de Codex devolvió ${status}.${detalle ? ` ${detalle}` : ""}`;
}

function textos(partes: ParteTexto[] | undefined, tipo: string): string[] {
  return (partes ?? [])
    .filter((parte) => parte.type === tipo)
    .map((parte) => parte.text ?? "")
    .filter(Boolean);
}

/** Una corrida de un solo turno: system prompt + user prompt, texto de vuelta. */
export async function correrCodex(opciones: {
  modelo: string;
  esfuerzo: Esfuerzo;
  systemPrompt: string;
  userPrompt: string;
  credenciales: Credenciales;
  /** Estabiliza el caché de prompt entre corridas del mismo caso. */
  claveCache?: string;
}): Promise<RespuestaCodex> {
  const { modelo, esfuerzo, systemPrompt, userPrompt, credenciales } = opciones;
  const sesion = randomUUID();

  const respuesta = await fetch(URL_CODEX, {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${credenciales.accessToken}`,
      "chatgpt-account-id": credenciales.accountId,
      originator: ORIGINATOR,
      "OpenAI-Beta": "responses=experimental",
      "session-id": sesion,
      "x-client-request-id": sesion,
      accept: "text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      // El backend de suscripción no persiste respuestas y solo trabaja en stream.
      store: false,
      stream: true,
      instructions: systemPrompt,
      input: [
        {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
      reasoning: { effort: esfuerzo, summary: "auto" },
      text: { verbosity: "medium" },
      ...(opciones.claveCache ? { prompt_cache_key: opciones.claveCache } : {}),
    }),
  });

  if (!respuesta.ok || !respuesta.body) {
    const cuerpo = await respuesta.text().catch(() => "");
    throw new Error(mensajeDeError(respuesta.status, cuerpo));
  }

  // A diferencia de la Responses API pública, el evento final llega sin `output`:
  // el texto y el razonamiento hay que juntarlos de los eventos del stream.
  const partesTexto: string[] = [];
  const partesRazonamiento: string[] = [];
  let cierre: EventoSSE["response"] | null = null;

  for await (const evento of eventos(respuesta.body)) {
    switch (evento.type) {
      case "error":
        throw new Error(
          `Error del backend de Codex: ${evento.error?.message ?? "sin detalle"}`,
        );
      case "response.failed":
        throw new Error(
          `La corrida falló: ${evento.response?.error?.message ?? "sin detalle"}`,
        );
      case "response.reasoning_summary_text.done":
        if (evento.text) partesRazonamiento.push(evento.text);
        break;
      case "response.output_item.done":
        if (evento.item?.type === "message") {
          partesTexto.push(...textos(evento.item.content, "output_text"));
        }
        if (evento.item?.type === "reasoning" && partesRazonamiento.length === 0) {
          partesRazonamiento.push(...textos(evento.item.summary, "summary_text"));
        }
        break;
      case "response.completed":
      case "response.done":
      case "response.incomplete":
        cierre = evento.response ?? null;
        break;
      default:
        break;
    }
    if (cierre) break;
  }

  if (!cierre) throw new Error("El stream de Codex terminó sin devolver la respuesta.");
  if (cierre.status === "incomplete") {
    throw new Error(
      `La respuesta quedó incompleta (${cierre.incomplete_details?.reason ?? "sin detalle"}).`,
    );
  }

  const texto = partesTexto.join("\n").trim();
  if (!texto) throw new Error("El modelo no devolvió texto en la corrección.");

  return {
    texto,
    razonamiento: partesRazonamiento.join("\n\n").trim() || null,
    modelo: cierre.model ?? modelo,
    uso: {
      entrada: cierre.usage?.input_tokens ?? 0,
      salida: cierre.usage?.output_tokens ?? 0,
      cacheLectura: cierre.usage?.input_tokens_details?.cached_tokens ?? 0,
      razonamiento: cierre.usage?.output_tokens_details?.reasoning_tokens ?? 0,
    },
  };
}
