import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Credenciales de la suscripción de ChatGPT, tal como las deja el CLI de Codex
 * después de `codex login`. La app no usa clave de API: se apoya en el mismo
 * archivo que ya escribió Codex y renueva el token cuando vence.
 *
 * Referencia: el proveedor "OpenAI (ChatGPT Plus/Pro)" del agente pi
 * (https://pi.dev/docs/latest/providers), que hace exactamente este flujo.
 */

/** El client_id público del flujo OAuth de Codex. No es un secreto. */
const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const URL_TOKEN = "https://auth.openai.com/oauth/token";
/** El namespace donde el access token guarda los datos de la cuenta de ChatGPT. */
const CLAIM_AUTH = "https://api.openai.com/auth";
/** Se renueva un minuto antes del vencimiento para no cortar una corrida en curso. */
const MARGEN_MS = 60_000;

export type Credenciales = {
  accessToken: string;
  /** Va en el header `chatgpt-account-id` de cada pedido. */
  accountId: string;
  /** "plus", "pro", "team"… Es el plan que paga la corrida. */
  plan: string | null;
};

type ArchivoAuth = {
  auth_mode?: string;
  OPENAI_API_KEY?: string | null;
  tokens?: {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    account_id?: string;
  };
  last_refresh?: string;
};

export function rutaAuth(): string {
  const casa = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  return path.join(casa, "auth.json");
}

function leerArchivo(): ArchivoAuth | null {
  const archivo = rutaAuth();
  if (!fs.existsSync(archivo)) return null;
  try {
    return JSON.parse(fs.readFileSync(archivo, "utf8")) as ArchivoAuth;
  } catch {
    return null;
  }
}

/** El payload de un JWT, sin validar la firma: solo se lee `exp` y la cuenta. */
function payloadJwt(token: string): Record<string, unknown> | null {
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function datosCuenta(accessToken: string): { accountId: string | null; plan: string | null } {
  const claim = payloadJwt(accessToken)?.[CLAIM_AUTH] as
    | { chatgpt_account_id?: string; chatgpt_plan_type?: string }
    | undefined;
  return {
    accountId: claim?.chatgpt_account_id ?? null,
    plan: claim?.chatgpt_plan_type ?? null,
  };
}

function venceEn(accessToken: string): number | null {
  const exp = payloadJwt(accessToken)?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
}

/** Hay sesión de ChatGPT utilizable si Codex dejó un access token en su auth.json. */
export function haySesionChatGPT(): boolean {
  return Boolean(leerArchivo()?.tokens?.access_token);
}

async function renovar(refreshToken: string): Promise<{ access: string; refresh: string }> {
  const respuesta = await fetch(URL_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new Error(
      `No se pudo renovar el token de ChatGPT (${respuesta.status}). ` +
        `Volvé a entrar con \`codex login\`.${detalle ? ` Detalle: ${detalle}` : ""}`,
    );
  }

  const json = (await respuesta.json()) as { access_token?: string; refresh_token?: string };
  if (!json.access_token || !json.refresh_token) {
    throw new Error("La renovación del token devolvió una respuesta incompleta.");
  }
  return { access: json.access_token, refresh: json.refresh_token };
}

/**
 * OpenAI rota el refresh token en cada renovación: si no se guarda el nuevo, la
 * próxima corrida —y el propio CLI de Codex— se quedan sin sesión.
 */
function guardarTokens(datos: ArchivoAuth, access: string, refresh: string): void {
  const actualizado: ArchivoAuth = {
    ...datos,
    tokens: { ...datos.tokens, access_token: access, refresh_token: refresh },
    last_refresh: new Date().toISOString(),
  };
  const archivo = rutaAuth();
  const temporal = `${archivo}.tmp-${process.pid}`;
  fs.writeFileSync(temporal, `${JSON.stringify(actualizado, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporal, archivo);
}

const FALTA_SESION =
  "No hay sesión de ChatGPT. Instalá el CLI de Codex y corré `codex login` " +
  "eligiendo «Sign in with ChatGPT»; la app usa esa misma sesión.";

/** El access token vigente de la suscripción, renovándolo contra OpenAI si venció. */
export async function obtenerCredenciales(): Promise<Credenciales> {
  const datos = leerArchivo();
  const access = datos?.tokens?.access_token;
  if (!datos || !access) throw new Error(FALTA_SESION);

  const vence = venceEn(access);
  const vencido = vence === null || vence - MARGEN_MS <= Date.now();

  let token = access;
  if (vencido) {
    const refresh = datos.tokens?.refresh_token;
    if (!refresh) throw new Error(`El token de ChatGPT venció y no hay refresh token. ${FALTA_SESION}`);
    const nuevos = await renovar(refresh);
    guardarTokens(datos, nuevos.access, nuevos.refresh);
    token = nuevos.access;
  }

  const { accountId, plan } = datosCuenta(token);
  const cuenta = accountId ?? datos.tokens?.account_id ?? null;
  if (!cuenta) {
    throw new Error(
      "El token de ChatGPT no trae el id de cuenta. Volvé a entrar con `codex login`.",
    );
  }

  return { accessToken: token, accountId: cuenta, plan };
}
