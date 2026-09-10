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
export const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
export const URL_AUTORIZAR = "https://auth.openai.com/oauth/authorize";
export const URL_TOKEN = "https://auth.openai.com/oauth/token";
/** El namespace donde el access token guarda los datos de la cuenta de ChatGPT. */
const CLAIM_AUTH = "https://api.openai.com/auth";
/** Se renueva un minuto antes del vencimiento para no cortar una corrida en curso. */
const MARGEN_MS = 60_000;

/** Lo que la app muestra de la sesión sin salir a la red. */
export type Sesion = {
  activa: boolean;
  /** El access token guardado ya venció: la próxima corrida tiene que renovarlo. */
  vencida: boolean;
  plan: string | null;
  /** ISO del vencimiento del access token; null si no se pudo leer. */
  vence: string | null;
};

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

function escribirArchivo(datos: ArchivoAuth): void {
  const archivo = rutaAuth();
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  const temporal = `${archivo}.tmp-${process.pid}`;
  fs.writeFileSync(temporal, `${JSON.stringify(datos, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporal, archivo);
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

function estaVencido(accessToken: string): boolean {
  const vence = venceEn(accessToken);
  return vence === null || vence - MARGEN_MS <= Date.now();
}

/** Hay sesión de ChatGPT utilizable si Codex dejó un access token en su auth.json. */
export function haySesionChatGPT(): boolean {
  return Boolean(leerArchivo()?.tokens?.access_token);
}

/** El estado de la sesión para la vista: no renueva nada ni sale a la red. */
export function resumenSesion(): Sesion {
  const access = leerArchivo()?.tokens?.access_token;
  if (!access) return { activa: false, vencida: false, plan: null, vence: null };
  const vence = venceEn(access);
  return {
    activa: true,
    vencida: estaVencido(access),
    plan: datosCuenta(access).plan,
    vence: vence === null ? null : new Date(vence).toISOString(),
  };
}

/**
 * Guarda una sesión recién obtenida en el mismo auth.json que usa el CLI de Codex,
 * respetando lo que ya hubiera en el archivo.
 */
export function guardarSesion(tokens: {
  access: string;
  refresh: string;
  idToken?: string;
}): void {
  const previo = leerArchivo() ?? {};
  const { accountId } = datosCuenta(tokens.access);
  escribirArchivo({
    ...previo,
    auth_mode: "chatgpt",
    OPENAI_API_KEY: null,
    tokens: {
      ...previo.tokens,
      ...(tokens.idToken ? { id_token: tokens.idToken } : {}),
      access_token: tokens.access,
      refresh_token: tokens.refresh,
      ...(accountId ? { account_id: accountId } : {}),
    },
    last_refresh: new Date().toISOString(),
  });
}

/** OpenAI invalida el refresh token viejo apenas se usa: reusarlo da 401. */
function esTokenYaUsado(detalle: string): boolean {
  return detalle.includes("refresh_token_reused") || detalle.includes("already been used");
}

class ErrorRenovacion extends Error {
  constructor(
    readonly status: number,
    readonly detalle: string,
  ) {
    super(
      esTokenYaUsado(detalle)
        ? "El refresh token de ChatGPT ya se había usado y OpenAI lo dio de baja. " +
          "Volvé a entrar con `codex login` (opción «Sign in with ChatGPT»)."
        : `No se pudo renovar el token de ChatGPT (${status}). ` +
          `Volvé a entrar con \`codex login\`.${detalle ? ` Detalle: ${detalle}` : ""}`,
    );
    this.name = "ErrorRenovacion";
  }
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
    throw new ErrorRenovacion(respuesta.status, detalle);
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
  escribirArchivo({
    ...datos,
    tokens: { ...datos.tokens, access_token: access, refresh_token: refresh },
    last_refresh: new Date().toISOString(),
  });
}

const FALTA_SESION =
  "No hay sesión de ChatGPT. Instalá el CLI de Codex y corré `codex login` " +
  "eligiendo «Sign in with ChatGPT»; la app usa esa misma sesión.";

/**
 * Una sola renovación a la vez en el proceso: si dos corridas arrancan juntas con el
 * token vencido, la segunda esperaría a la primera en vez de gastar el mismo refresh
 * token dos veces —que es lo que OpenAI rechaza con `refresh_token_reused`.
 */
let renovacionEnCurso: Promise<string> | null = null;

async function renovarYGuardar(): Promise<string> {
  // Se relee el archivo recién acá: el CLI de Codex —u otra corrida— pudo haberlo
  // renovado mientras esta esperaba su turno.
  const datos = leerArchivo();
  const access = datos?.tokens?.access_token;
  if (!datos || !access) throw new Error(FALTA_SESION);
  if (!estaVencido(access)) return access;

  const refresh = datos.tokens?.refresh_token;
  if (!refresh) throw new Error(`El token de ChatGPT venció y no hay refresh token. ${FALTA_SESION}`);

  const nuevos = await renovar(refresh);
  guardarTokens(datos, nuevos.access, nuevos.refresh);
  return nuevos.access;
}

/** El access token vigente de la suscripción, renovándolo contra OpenAI si venció. */
export async function obtenerCredenciales(): Promise<Credenciales> {
  const datos = leerArchivo();
  const access = datos?.tokens?.access_token;
  if (!datos || !access) throw new Error(FALTA_SESION);

  let token = access;
  if (estaVencido(access)) {
    renovacionEnCurso ??= renovarYGuardar().finally(() => {
      renovacionEnCurso = null;
    });
    token = await renovacionEnCurso;
  }

  const { accountId, plan } = datosCuenta(token);
  const cuenta = accountId ?? leerArchivo()?.tokens?.account_id ?? null;
  if (!cuenta) {
    throw new Error(
      "El token de ChatGPT no trae el id de cuenta. Volvé a entrar con `codex login`.",
    );
  }

  return { accessToken: token, accountId: cuenta, plan };
}
