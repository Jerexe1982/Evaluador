import { leerRubrica } from "./repo";
import { DIMENSIONES } from "./rubrica";
import type { ClaveDimension } from "./tipos";

/**
 * rubrica.md es la fuente: la app no reescribe la rúbrica, la lee. Esto la parte en
 * piezas para poder mostrar, al lado de un puntaje, exactamente qué exigía ese nivel
 * y qué pedía el nivel siguiente.
 */
export type NivelRubrica = {
  nivel: number;
  exige: string;
  ejemplo: string;
};

export type DimensionRubrica = {
  clave: ClaveDimension;
  nombre: string;
  peso: number;
  resumen: string;
  niveles: NivelRubrica[];
  topes: string[];
};

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Saca las reglas horizontales de markdown: en la app las hace la maquetación. */
function limpiar(texto: string): string {
  return texto
    .split("\n")
    .filter((l) => l.trim() !== "---")
    .join("\n")
    .trim();
}

function celdas(linea: string): string[] {
  return linea
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/** Devuelve el cuerpo de una sección `## Título`, sin el encabezado. */
export function seccionRubrica(titulo: string): string {
  const texto = leerRubrica();
  const bloques = texto.split(/\n(?=## )/);
  const bloque = bloques.find((b) =>
    normalizar(b.split("\n")[0].replace(/^##\s*/, "")).startsWith(normalizar(titulo)),
  );
  return bloque ? limpiar(bloque.split("\n").slice(1).join("\n")) : "";
}

let cache: DimensionRubrica[] | null = null;

export function dimensionesRubrica(): DimensionRubrica[] {
  if (cache) return cache;
  const bloques = leerRubrica().split(/\n(?=## )/);

  cache = DIMENSIONES.map((dimension) => {
    const bloque = bloques.find((b) => {
      const encabezado = normalizar(b.split("\n")[0]);
      return (
        encabezado.startsWith("## dimension") &&
        dimension.alias.some((alias) => encabezado.includes(normalizar(alias)))
      );
    });

    const lineas = bloque ? bloque.split("\n") : [];
    const resumen = limpiar(lineas.slice(1).join("\n").split(/\n\|/)[0]);

    const niveles: NivelRubrica[] = [];
    for (const linea of lineas) {
      if (!linea.trim().startsWith("|")) continue;
      const partes = celdas(linea);
      const nivel = partes[0].match(/^(\d+)\s*%/);
      if (!nivel || partes.length < 2) continue;
      niveles.push({
        nivel: Number(nivel[1]),
        exige: partes[1] ?? "",
        ejemplo: partes[2] ?? "",
      });
    }

    const desdeTopes = bloque?.split(/\*\*Topes de esta dimensi[oó]n\*\*/)[1] ?? "";
    const topes = desdeTopes
      .split("\n")
      .filter((l) => l.trim().startsWith("- "))
      .map((l) => l.replace(/^\s*-\s*/, "").trim());

    return {
      clave: dimension.clave,
      nombre: dimension.nombre,
      peso: dimension.peso,
      resumen,
      niveles: niveles.sort((a, b) => a.nivel - b.nivel),
      topes,
    };
  });

  return cache;
}

export function dimensionRubrica(clave: ClaveDimension): DimensionRubrica | undefined {
  return dimensionesRubrica().find((d) => d.clave === clave);
}

/** El nivel exacto que exige la rúbrica para un puntaje dado, y el inmediato superior. */
export function nivelesAlrededor(
  clave: ClaveDimension,
  nivel: number | null,
): { alcanzado: NivelRubrica | null; siguiente: NivelRubrica | null } {
  const dimension = dimensionRubrica(clave);
  if (!dimension || nivel === null) return { alcanzado: null, siguiente: null };
  const alcanzado =
    dimension.niveles.find((n) => Math.abs(n.nivel - nivel) < 0.01) ?? null;
  const siguiente = dimension.niveles.find((n) => n.nivel > nivel) ?? null;
  return { alcanzado, siguiente };
}
