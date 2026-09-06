import fs from "node:fs";
import path from "node:path";
import type { ArchivoCaso, Caso, TipoTrabajo, Trabajo } from "./tipos";
import { leerOrigen } from "./origenes";
import { rutaCasos, rutaRepo, rutaTrabajos } from "./rutas";

export { rutaRepo, rutaTrabajos };

/**
 * Extensiones que el corrector puede leer. El resto se lista en el árbol pero no se
 * manda: sirve para que note que el archivo existe sin gastar el contexto en binarios.
 */
const EXTENSIONES_TEXTO = [
  ".md",
  ".markdown",
  ".txt",
  ".csv",
  ".tsv",
  ".json",
  ".yml",
  ".yaml",
  ".toml",
  ".ini",
  ".cfg",
  ".py",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".rb",
  ".go",
  ".java",
  ".sh",
  ".sql",
  ".html",
  ".css",
  ".ipynb",
];

/** Archivos sin extensión que igual son texto y suelen contar como evidencia. */
const NOMBRES_TEXTO = ["dockerfile", "makefile", "procfile", "license", "readme"];

/** Carpetas que nunca son parte del trabajo: dependencias, artefactos de build, caché. */
const DIRECTORIOS_IGNORADOS = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "target",
  "vendor",
  "coverage",
  "venv",
  "env",
  "__pycache__",
  "site-packages",
]);

/** Nombres que no se leen aunque sean de texto: credenciales, claves, volcados. */
const PATRON_SECRETO = /(^|[._-])(secret|secrets|credential|credentials|token|password)s?\.|\.(pem|key|p12|pfx)$/i;

const MAX_BYTES_ARCHIVO = 200_000;
const MAX_ARCHIVOS = 400;

export function esArchivoDeTexto(ruta: string): boolean {
  const base = path.basename(ruta).toLowerCase();
  if (PATRON_SECRETO.test(base)) return false;
  const extension = path.extname(base);
  if (extension === "") return NOMBRES_TEXTO.includes(base);
  return EXTENSIONES_TEXTO.includes(extension);
}

/** Rechaza cualquier ruta que se escape de la carpeta del trabajo. */
function rutaSegura(base: string, relativa: string): string {
  const destino = path.resolve(base, relativa);
  if (destino !== base && !destino.startsWith(base + path.sep)) {
    throw new Error(`Ruta fuera del trabajo: ${relativa}`);
  }
  return destino;
}

function recorrer(dir: string, prefijo = ""): ArchivoCaso[] {
  const entradas = fs.readdirSync(dir, { withFileTypes: true });
  const archivos: ArchivoCaso[] = [];
  for (const entrada of entradas) {
    // Los archivos y carpetas ocultos quedan afuera: ahí viven .git, .env y la
    // configuración de las herramientas, nunca el trabajo que se corrige.
    if (entrada.name.startsWith(".")) continue;
    if (entrada.isDirectory() && DIRECTORIOS_IGNORADOS.has(entrada.name.toLowerCase())) {
      continue;
    }
    const relativa = prefijo ? `${prefijo}/${entrada.name}` : entrada.name;
    if (entrada.isDirectory()) {
      archivos.push(...recorrer(path.join(dir, entrada.name), relativa));
    } else if (entrada.isFile()) {
      archivos.push({
        ruta: relativa,
        bytes: fs.statSync(path.join(dir, entrada.name)).size,
      });
    }
    if (archivos.length > MAX_ARCHIVOS * 2) break;
  }
  // Primero los archivos de la raíz (README, DECISIONES), después las carpetas.
  return archivos.sort((a, b) => {
    const profundidad = a.ruta.split("/").length - b.ruta.split("/").length;
    return profundidad !== 0 ? profundidad : a.ruta.localeCompare(b.ruta, "es");
  });
}

type Ubicacion = { id: string; tipo: TipoTrabajo; dir: string };

/**
 * Resuelve un id a su carpeta. Los casos de prueba mandan sobre los repos clonados:
 * son los que fija el grupo y su nombre no lo decide nadie de afuera.
 */
export function ubicarTrabajo(id: string): Ubicacion | null {
  if (!/^[\w.-]+$/.test(id) || id === "." || id === "..") return null;
  const enCasos = path.join(rutaCasos(), id);
  if (fs.existsSync(enCasos) && fs.statSync(enCasos).isDirectory()) {
    return { id, tipo: "caso", dir: enCasos };
  }
  const enTrabajos = path.join(rutaTrabajos(), id);
  if (fs.existsSync(enTrabajos) && fs.statSync(enTrabajos).isDirectory()) {
    return { id, tipo: "github", dir: enTrabajos };
  }
  return null;
}

export function existeTrabajo(id: string): boolean {
  return ubicarTrabajo(id) !== null;
}

export function esCaso(id: string): boolean {
  return ubicarTrabajo(id)?.tipo === "caso";
}

/** La ruta de la página que muestra un trabajo, según de dónde salió. */
export function rutaDeTrabajo(id: string): string {
  return esCaso(id) ? `/casos/${id}` : `/trabajos/${id}`;
}

export function leerTrabajo(id: string): Trabajo {
  const ubicacion = ubicarTrabajo(id);
  if (!ubicacion) throw new Error(`No existe el trabajo "${id}".`);
  const todos = recorrer(ubicacion.dir);
  const archivos = todos.slice(0, MAX_ARCHIVOS);
  return {
    id,
    tipo: ubicacion.tipo,
    archivos,
    bytesTotales: archivos.reduce((total, a) => total + a.bytes, 0),
    omitidos: todos.length - archivos.length,
    origen: ubicacion.tipo === "github" ? leerOrigen(id) : null,
  };
}

function listarEn(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, "es"));
}

/** Los tres casos de prueba del grupo. */
export function listarCasos(): Caso[] {
  return listarEn(rutaCasos()).map((id) => leerTrabajo(id));
}

/** Los repositorios de GitHub clonados a pedido, del último clonado al primero. */
export function listarRepos(): Trabajo[] {
  return listarEn(rutaTrabajos())
    .map((id) => leerTrabajo(id))
    .sort((a, b) =>
      (b.origen?.clonadoEn ?? "").localeCompare(a.origen?.clonadoEn ?? ""),
    );
}

export function leerArchivoTrabajo(id: string, relativa: string): string {
  const ubicacion = ubicarTrabajo(id);
  if (!ubicacion) throw new Error(`No existe el trabajo "${id}".`);
  const destino = rutaSegura(ubicacion.dir, relativa);
  const bytes = fs.statSync(destino).size;
  if (bytes > MAX_BYTES_ARCHIVO) {
    return fs
      .readFileSync(destino, "utf8")
      .slice(0, MAX_BYTES_ARCHIVO)
      .concat(`\n\n[…archivo truncado en ${MAX_BYTES_ARCHIVO} bytes…]`);
  }
  return fs.readFileSync(destino, "utf8");
}

/**
 * Existe la ruta, sea archivo o carpeta. El corrector cita carpetas cuando la evidencia
 * es estructural —`prompts/`, `corridas/corrida-1/`— y esas citas también se verifican.
 */
export function existeRutaTrabajo(id: string, relativa: string): boolean {
  const ubicacion = ubicarTrabajo(id);
  if (!ubicacion) return false;
  try {
    return fs.existsSync(rutaSegura(ubicacion.dir, relativa.replace(/\/$/, "")));
  } catch {
    return false;
  }
}

export function existeArchivoTrabajo(id: string, relativa: string): boolean {
  const ubicacion = ubicarTrabajo(id);
  if (!ubicacion) return false;
  try {
    return fs.statSync(rutaSegura(ubicacion.dir, relativa)).isFile();
  } catch {
    return false;
  }
}

// Nombres viejos, mientras las vistas de los casos hablen de casos y no de trabajos.
export const existeCaso = existeTrabajo;
export const leerCaso = leerTrabajo;
export const leerArchivoCaso = leerArchivoTrabajo;
export const existeArchivoCaso = existeArchivoTrabajo;

/** El contrato del agente corrector, versionado en agente/system_prompt.md. */
export function leerSystemPromptAgente(): string {
  return fs.readFileSync(path.join(rutaRepo(), "agente", "system_prompt.md"), "utf8");
}

/**
 * El user prompt fijo del corrector, tomado del bloque de código de
 * agente/user_prompt.md. Es el mismo texto en todas las corridas: si cambia entre
 * corridas, las salidas dejan de ser comparables.
 */
export function leerUserPromptAgente(): string | null {
  const archivo = path.join(rutaRepo(), "agente", "user_prompt.md");
  if (!fs.existsSync(archivo)) return null;
  const bloque = fs.readFileSync(archivo, "utf8").match(/```\n([\s\S]*?)```/);
  return bloque ? bloque[1].trim() : null;
}

/** La rúbrica extendida, para mostrarla junto a los resultados. */
export function leerRubrica(): string {
  return fs.readFileSync(path.join(rutaRepo(), "rubrica.md"), "utf8");
}
