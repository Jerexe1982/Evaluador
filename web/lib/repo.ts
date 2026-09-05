import fs from "node:fs";
import path from "node:path";
import type { ArchivoCaso, Caso } from "./tipos";

/** Extensiones de texto que el evaluador puede leer. El resto se lista pero no se manda. */
const EXTENSIONES_TEXTO = [".md", ".csv", ".txt", ".json", ".yml", ".yaml"];
const MAX_BYTES_ARCHIVO = 200_000;

/**
 * Raíz del repositorio del evaluador. La app vive en web/, así que por defecto
 * es el directorio padre; EVALUADOR_REPO permite apuntar a otro checkout.
 */
export function rutaRepo(): string {
  return process.env.EVALUADOR_REPO
    ? path.resolve(process.env.EVALUADOR_REPO)
    : path.resolve(process.cwd(), "..");
}

function rutaCasos(): string {
  return path.join(rutaRepo(), "casos");
}

export function esArchivoDeTexto(ruta: string): boolean {
  return EXTENSIONES_TEXTO.includes(path.extname(ruta).toLowerCase());
}

/** Rechaza cualquier ruta que se escape de la carpeta del caso. */
function rutaSegura(base: string, relativa: string): string {
  const destino = path.resolve(base, relativa);
  if (destino !== base && !destino.startsWith(base + path.sep)) {
    throw new Error(`Ruta fuera del caso: ${relativa}`);
  }
  return destino;
}

function recorrer(dir: string, prefijo = ""): ArchivoCaso[] {
  const entradas = fs.readdirSync(dir, { withFileTypes: true });
  const archivos: ArchivoCaso[] = [];
  for (const entrada of entradas) {
    if (entrada.name.startsWith(".")) continue;
    const relativa = prefijo ? `${prefijo}/${entrada.name}` : entrada.name;
    if (entrada.isDirectory()) {
      archivos.push(...recorrer(path.join(dir, entrada.name), relativa));
    } else if (entrada.isFile()) {
      archivos.push({
        ruta: relativa,
        bytes: fs.statSync(path.join(dir, entrada.name)).size,
      });
    }
  }
  // Primero los archivos de la raíz del caso (README, DECISIONES), después las carpetas.
  return archivos.sort((a, b) => {
    const profundidad = a.ruta.split("/").length - b.ruta.split("/").length;
    return profundidad !== 0 ? profundidad : a.ruta.localeCompare(b.ruta, "es");
  });
}

export function listarCasos(): Caso[] {
  const base = rutaCasos();
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => leerCaso(e.name))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function leerCaso(slug: string): Caso {
  const dir = rutaSegura(rutaCasos(), slug);
  const archivos = recorrer(dir);
  return {
    slug,
    archivos,
    bytesTotales: archivos.reduce((total, a) => total + a.bytes, 0),
  };
}

export function existeCaso(slug: string): boolean {
  try {
    return fs.statSync(path.join(rutaCasos(), slug)).isDirectory();
  } catch {
    return false;
  }
}

export function leerArchivoCaso(slug: string, relativa: string): string {
  const dir = rutaSegura(rutaCasos(), slug);
  const destino = rutaSegura(dir, relativa);
  const bytes = fs.statSync(destino).size;
  if (bytes > MAX_BYTES_ARCHIVO) {
    return fs
      .readFileSync(destino, "utf8")
      .slice(0, MAX_BYTES_ARCHIVO)
      .concat(`\n\n[…archivo truncado en ${MAX_BYTES_ARCHIVO} bytes…]`);
  }
  return fs.readFileSync(destino, "utf8");
}

export function existeArchivoCaso(slug: string, relativa: string): boolean {
  try {
    return fs.statSync(rutaSegura(rutaSegura(rutaCasos(), slug), relativa)).isFile();
  } catch {
    return false;
  }
}

/** El contrato del agente corrector, versionado en agente/system_prompt.md. */
export function leerSystemPromptAgente(): string {
  return fs.readFileSync(path.join(rutaRepo(), "agente", "system_prompt.md"), "utf8");
}

/** La rúbrica extendida, para mostrarla junto a los resultados. */
export function leerRubrica(): string {
  return fs.readFileSync(path.join(rutaRepo(), "rubrica.md"), "utf8");
}
