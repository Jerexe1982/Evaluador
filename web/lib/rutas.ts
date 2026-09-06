import fs from "node:fs";
import path from "node:path";

/**
 * Raíz del repositorio del evaluador. La app vive en web/, así que por defecto es el
 * directorio padre; EVALUADOR_REPO permite apuntar a otro checkout.
 */
export function rutaRepo(): string {
  return process.env.EVALUADOR_REPO
    ? path.resolve(process.env.EVALUADOR_REPO)
    : path.resolve(process.cwd(), "..");
}

export function rutaCasos(): string {
  return path.join(rutaRepo(), "casos");
}

/** Los repos de GitHub clonados a pedido. No se versiona: se vuelve a clonar. */
export function rutaTrabajos(): string {
  const dir = path.join(rutaRepo(), "trabajos");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Dónde se anota de qué repositorio salió cada carpeta de trabajos/. */
export function rutaOrigenes(): string {
  return path.join(rutaTrabajos(), ".origenes.json");
}
