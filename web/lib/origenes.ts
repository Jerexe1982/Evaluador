import fs from "node:fs";
import { rutaOrigenes } from "./rutas";
import type { OrigenGithub } from "./tipos";

/**
 * De qué repositorio salió cada carpeta de `trabajos/`. Vive aparte del clon para que
 * volver a clonar no se lleve puesta la procedencia, y para que el corrector nunca lea
 * este archivo como si fuera parte del trabajo.
 */
type Registro = Record<string, OrigenGithub>;

function leerRegistro(): Registro {
  const archivo = rutaOrigenes();
  if (!fs.existsSync(archivo)) return {};
  try {
    return JSON.parse(fs.readFileSync(archivo, "utf8")) as Registro;
  } catch {
    return {};
  }
}

export function leerOrigen(id: string): OrigenGithub | null {
  return leerRegistro()[id] ?? null;
}

export function guardarOrigen(id: string, origen: OrigenGithub): void {
  const registro = leerRegistro();
  registro[id] = origen;
  fs.writeFileSync(rutaOrigenes(), `${JSON.stringify(registro, null, 2)}\n`, "utf8");
}

export function olvidarOrigen(id: string): void {
  const registro = leerRegistro();
  delete registro[id];
  fs.writeFileSync(rutaOrigenes(), `${JSON.stringify(registro, null, 2)}\n`, "utf8");
}
