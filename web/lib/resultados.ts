import fs from "node:fs";
import path from "node:path";
import { rutaRepo } from "./repo";
import type { Resultado, ResumenResultado } from "./tipos";

/** Las corridas del corrector se guardan en el repo: son parte de la evidencia. */
function directorio(): string {
  const dir = path.join(rutaRepo(), "resultados");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function nuevoId(caso: string, fecha: Date): string {
  return `${caso}__${fecha.toISOString().replace(/[:.]/g, "-")}`;
}

export function guardarResultado(resultado: Resultado): void {
  fs.writeFileSync(
    path.join(directorio(), `${resultado.id}.json`),
    `${JSON.stringify(resultado, null, 2)}\n`,
    "utf8",
  );
}

export function leerResultado(id: string): Resultado | null {
  if (!/^[\w.\-]+$/.test(id)) return null;
  const archivo = path.join(directorio(), `${id}.json`);
  if (!fs.existsSync(archivo)) return null;
  return JSON.parse(fs.readFileSync(archivo, "utf8")) as Resultado;
}

/** Todos los resultados, del más nuevo al más viejo. */
export function listarResultados(caso?: string): ResumenResultado[] {
  return fs
    .readdirSync(directorio())
    .filter((n) => n.endsWith(".json"))
    .map((n) => leerResultado(n.replace(/\.json$/, "")))
    .filter((r): r is Resultado => r !== null)
    .filter((r) => (caso ? r.caso === caso : true))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((r) => ({
      id: r.id,
      caso: r.caso,
      fecha: r.fecha,
      modelo: r.modelo,
      notaCalculada: r.notaCalculada,
      notaDeclarada: r.notaDeclarada,
      tokensTotales: r.uso.tokensEntrada + r.uso.tokensSalida,
      alertas: r.verificaciones.filter((v) => v.estado !== "ok").length,
    }));
}

export function ultimoResultado(caso: string): ResumenResultado | null {
  return listarResultados(caso)[0] ?? null;
}

/** El último resultado completo de un caso, para las vistas que necesitan las filas. */
export function ultimoResultadoCompleto(caso: string): Resultado | null {
  const resumen = ultimoResultado(caso);
  return resumen ? leerResultado(resumen.id) : null;
}
