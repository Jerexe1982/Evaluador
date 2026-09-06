import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { guardarOrigen, olvidarOrigen } from "./origenes";
import { rutaTrabajos } from "./rutas";
import type { OrigenGithub } from "./tipos";

const correr = promisify(execFile);

/**
 * Profundidad del clon. No alcanza con el último commit: la rúbrica pide contrastar el
 * relato del proceso con la historia real, así que el corrector tiene que poder verla.
 */
const PROFUNDIDAD = 200;
const COMMITS_EN_EL_PROMPT = 60;
const TIMEOUT_MS = 180_000;

const NOMBRE_VALIDO = /^[A-Za-z0-9_.-]+$/;

export type RepoPedido = { owner: string; repo: string; ref: string | null };

/**
 * Acepta las formas en las que la gente pasa un repo: la URL del navegador, la de
 * `git clone`, la SSH, un enlace a una rama, o simplemente `owner/repo`.
 */
export function parsearRepo(entrada: string): RepoPedido | null {
  const texto = entrada.trim().replace(/\.git$/, "");
  if (!texto) return null;

  let camino = "";
  if (/^git@github\.com:/i.test(texto)) {
    camino = texto.replace(/^git@github\.com:/i, "");
  } else if (/^(https?:\/\/)?(www\.)?github\.com\//i.test(texto)) {
    camino = texto.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "");
  } else if (/^[^/\s]+\/[^/\s]+$/.test(texto)) {
    camino = texto;
  } else {
    return null;
  }

  const partes = camino.split("?")[0].split("#")[0].split("/").filter(Boolean);
  const [owner, repo, ...resto] = partes;
  if (!owner || !repo) return null;
  if (!NOMBRE_VALIDO.test(owner) || !NOMBRE_VALIDO.test(repo)) return null;
  if ([owner, repo].some((n) => n === "." || n === "..")) return null;

  // .../tree/<rama> y .../blob/<rama> son enlaces del navegador: la rama es lo que sigue.
  const ref =
    (resto[0] === "tree" || resto[0] === "blob") &&
    resto[1] &&
    NOMBRE_VALIDO.test(resto[1])
      ? resto[1]
      : null;

  return { owner, repo, ref };
}

export function idDeRepo(pedido: RepoPedido): string {
  return `${pedido.owner}__${pedido.repo}`.toLowerCase().replace(/[^\w.-]/g, "-");
}

export function urlDeRepo(pedido: RepoPedido): string {
  return `https://github.com/${pedido.owner}/${pedido.repo}`;
}

async function git(args: string[], cwd?: string): Promise<string> {
  const { stdout } = await correr("git", args, {
    cwd,
    timeout: TIMEOUT_MS,
    maxBuffer: 8 * 1024 * 1024,
    // Sin esto, un repo privado deja a git esperando usuario y contraseña para siempre.
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_ASKPASS: "true" },
  });
  return stdout;
}

/** Traduce el error de git a algo que se pueda leer en la pantalla. */
function explicar(error: unknown): string {
  const texto = error instanceof Error ? `${error.message}` : String(error);
  if (/not found|could not read Username|Authentication failed/i.test(texto)) {
    return "El repositorio no existe o es privado: el corrector sólo clona repos públicos.";
  }
  if (/Remote branch .* not found/i.test(texto)) {
    return "La rama pedida no existe en ese repositorio.";
  }
  if (/timed out|ETIMEDOUT/i.test(texto)) {
    return "El clon tardó demasiado y se canceló.";
  }
  return texto.split("\n").slice(-3).join(" ").trim() || "El clon falló.";
}

/** Separador de campos del `git log`: no aparece en mensajes de commit reales. */
const SEPARADOR = "\x1f";

async function leerCommit(dir: string, pedido: RepoPedido): Promise<OrigenGithub> {
  const formato = ["%H", "%an", "%aI", "%s"].join("%x1f");
  const linea = (await git(["log", "-1", `--pretty=${formato}`], dir)).trim();
  const [commit, autorCommit, fechaCommit, mensajeCommit] = linea.split(SEPARADOR);
  const commits = Number.parseInt(
    (await git(["rev-list", "--count", "HEAD"], dir)).trim(),
    10,
  );
  return {
    url: urlDeRepo(pedido),
    owner: pedido.owner,
    repo: pedido.repo,
    ref: pedido.ref,
    commit: commit ?? "",
    autorCommit: autorCommit ?? "",
    fechaCommit: fechaCommit ?? "",
    mensajeCommit: mensajeCommit ?? "",
    commits: Number.isFinite(commits) ? commits : 0,
    clonadoEn: new Date().toISOString(),
  };
}

/**
 * Clona un repositorio público en `trabajos/<id>` y anota de dónde salió. Volver a
 * pedirlo lo vuelve a clonar: cada corrección queda atada al commit que corrigió, y ese
 * commit se guarda en la corrida.
 */
export async function clonarRepo(
  entrada: string,
): Promise<{ id: string; origen: OrigenGithub }> {
  const pedido = parsearRepo(entrada);
  if (!pedido) {
    throw new Error(
      `No parece un repositorio de GitHub: «${entrada}». Usá owner/repo o su URL.`,
    );
  }
  const id = idDeRepo(pedido);
  const destino = path.join(rutaTrabajos(), id);

  fs.rmSync(destino, { recursive: true, force: true });
  try {
    await git([
      "clone",
      "--depth",
      String(PROFUNDIDAD),
      "--single-branch",
      ...(pedido.ref ? ["--branch", pedido.ref] : []),
      urlDeRepo(pedido),
      destino,
    ]);
  } catch (error) {
    fs.rmSync(destino, { recursive: true, force: true });
    throw new Error(explicar(error));
  }

  const origen = await leerCommit(destino, pedido);
  guardarOrigen(id, origen);
  return { id, origen };
}

export function eliminarRepo(id: string): void {
  fs.rmSync(path.join(rutaTrabajos(), id), { recursive: true, force: true });
  olvidarOrigen(id);
}

/**
 * La historia de commits del clon, en texto. Es evidencia de la rúbrica: un repo con un
 * único commit del último día contradice cualquier relato de semanas de iteración.
 */
export async function historiaDeCommits(id: string): Promise<string | null> {
  const dir = path.join(rutaTrabajos(), id);
  if (!fs.existsSync(path.join(dir, ".git"))) return null;
  try {
    const salida = await git(
      [
        "log",
        "-n",
        String(COMMITS_EN_EL_PROMPT),
        "--date=short",
        "--pretty=%h · %ad · %an · %s",
      ],
      dir,
    );
    return salida.trim() || null;
  } catch {
    return null;
  }
}
