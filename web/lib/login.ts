import crypto from "node:crypto";
import http from "node:http";
import {
  CLIENT_ID,
  URL_AUTORIZAR,
  URL_TOKEN,
  guardarSesion,
  resumenSesion,
} from "./credenciales";

/**
 * El login «Entrar con ChatGPT» desde la app: el mismo OAuth con PKCE que corre
 * `codex login`. El redirect_uri está registrado contra `localhost:1455`, así que
 * durante el login la app levanta un servidor efímero en ese puerto para recibir
 * el código y lo apaga apenas termina.
 */

const REDIRECT_URI = "http://localhost:1455/auth/callback";
const HOST_CALLBACK = "127.0.0.1";
const PUERTO_CALLBACK = 1455;
const SCOPE = "openid profile email offline_access";
const VENTANA_MS = 5 * 60 * 1000;

export type EstadoLogin =
  | { fase: "inactivo" }
  | { fase: "esperando"; url: string }
  | { fase: "listo"; plan: string | null }
  | { fase: "error"; mensaje: string };

/** Hay un solo login a la vez: la app es local y de un solo usuario. */
let estado: EstadoLogin = { fase: "inactivo" };
let servidor: http.Server | null = null;
let vencimiento: NodeJS.Timeout | null = null;

function base64url(bytes: Buffer): string {
  return bytes.toString("base64url");
}

function pkce(): { verificador: string; desafio: string } {
  const verificador = base64url(crypto.randomBytes(32));
  const desafio = base64url(crypto.createHash("sha256").update(verificador).digest());
  return { verificador, desafio };
}

function pagina(titulo: string, mensaje: string): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${titulo}</title>
<style>
  html { color-scheme: light dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; text-align:center; padding:24px; }
  main { max-width: 32rem; }
  h1 { font-size: 1.5rem; margin: 0 0 .5rem; }
  p { margin: 0; line-height: 1.6; opacity: .75; }
</style></head>
<body><main><h1>${titulo}</h1><p>${mensaje}</p></main></body></html>`;
}

function apagar(): void {
  if (vencimiento) clearTimeout(vencimiento);
  vencimiento = null;
  servidor?.close();
  servidor = null;
}

async function canjearCodigo(
  codigo: string,
  verificador: string,
): Promise<{ access: string; refresh: string; idToken?: string }> {
  const respuesta = await fetch(URL_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code: codigo,
      code_verifier: verificador,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new Error(
      `OpenAI rechazó el canje del código (${respuesta.status})${detalle ? `: ${detalle.slice(0, 200)}` : ""}`,
    );
  }

  const json = (await respuesta.json()) as {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
  };
  if (!json.access_token || !json.refresh_token) {
    throw new Error("El canje del código devolvió una respuesta incompleta.");
  }
  return { access: json.access_token, refresh: json.refresh_token, idToken: json.id_token };
}

function escuchar(estadoOAuth: string, verificador: string): Promise<void> {
  return new Promise((resolver, rechazar) => {
    const servidorNuevo = http.createServer((pedido, respuesta) => {
      const url = new URL(pedido.url ?? "", `http://${HOST_CALLBACK}`);
      if (url.pathname !== "/auth/callback") {
        respuesta.writeHead(404).end();
        return;
      }

      const responder = (codigo: number, titulo: string, mensaje: string) => {
        respuesta.writeHead(codigo, { "Content-Type": "text/html; charset=utf-8" });
        respuesta.end(pagina(titulo, mensaje));
      };

      const fallar = (mensaje: string) => {
        estado = { fase: "error", mensaje };
        responder(400, "No se pudo entrar", mensaje);
        apagar();
      };

      if (url.searchParams.get("state") !== estadoOAuth) {
        fallar("El parámetro `state` no coincide. Volvé a empezar el login.");
        return;
      }
      const codigo = url.searchParams.get("code");
      if (!codigo) {
        fallar(url.searchParams.get("error") ?? "OpenAI no devolvió el código.");
        return;
      }

      canjearCodigo(codigo, verificador)
        .then((tokens) => {
          guardarSesion(tokens);
          estado = { fase: "listo", plan: resumenSesion().plan };
          responder(
            200,
            "Sesión iniciada",
            "Ya podés cerrar esta pestaña y volver a la app del evaluador.",
          );
          apagar();
        })
        .catch((error: unknown) => {
          fallar(error instanceof Error ? error.message : "Falló el canje del código.");
        });
    });

    servidorNuevo.once("error", (error: NodeJS.ErrnoException) => {
      rechazar(
        error.code === "EADDRINUSE"
          ? new Error(
              `El puerto ${PUERTO_CALLBACK} está ocupado. OpenAI solo acepta ese puerto para volver: ` +
                "cerrá lo que lo esté usando (por ejemplo un `codex login` a medias) y probá de nuevo.",
            )
          : error,
      );
    });

    servidorNuevo.listen(PUERTO_CALLBACK, HOST_CALLBACK, () => {
      servidor = servidorNuevo;
      vencimiento = setTimeout(() => {
        if (estado.fase === "esperando") {
          estado = { fase: "error", mensaje: "El login expiró. Probá de nuevo." };
        }
        apagar();
      }, VENTANA_MS);
      resolver();
    });
  });
}

/** Arranca un login y devuelve la URL de OpenAI que hay que abrir en el navegador. */
export async function iniciarLogin(): Promise<string> {
  apagar();

  const { verificador, desafio } = pkce();
  const estadoOAuth = crypto.randomBytes(16).toString("hex");
  await escuchar(estadoOAuth, verificador);

  const url = new URL(URL_AUTORIZAR);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("code_challenge", desafio);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", estadoOAuth);
  url.searchParams.set("id_token_add_organizations", "true");
  url.searchParams.set("codex_cli_simplified_flow", "true");
  url.searchParams.set("originator", "evaluador-ucema");

  estado = { fase: "esperando", url: url.toString() };
  return url.toString();
}

export function estadoLogin(): EstadoLogin {
  return estado;
}

/** Corta un login a medias, por ejemplo si el usuario cierra la pestaña de OpenAI. */
export function cancelarLogin(): void {
  apagar();
  estado = { fase: "inactivo" };
}
