import { DIMENSIONES, nivelDeclarado, nivelEsValido } from "./rubrica";
import { existeArchivoCaso } from "./repo";
import type { FilaResultado, Verificacion } from "./tipos";

/** Minúsculas y sin tildes, para comparar nombres de dimensión sin depender del acento. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function aNumero(texto: string): number | null {
  const limpio = texto.replace(/\s/g, "").replace(",", ".");
  const numero = Number.parseFloat(limpio);
  return Number.isFinite(numero) ? numero : null;
}

function celdas(linea: string): string[] {
  return linea
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/** Rutas de archivo mencionadas en un texto libre (con o sin backticks). */
export function extraerRutas(texto: string, slug: string): string[] {
  const patron = /(?:[\w.\-]+\/)*[\w.\-]+\.(?:md|csv|txt|json|ya?ml)/gi;
  const encontradas = texto.match(patron) ?? [];
  const limpias = encontradas.map((ruta) =>
    ruta.replace(new RegExp(`^(?:\\./)?(?:casos/)?(?:${slug}/)?`), ""),
  );
  return [...new Set(limpias)];
}

export function parsearFilas(salida: string, slug: string): FilaResultado[] {
  const lineas = salida.split("\n").filter((l) => l.includes("|"));

  return DIMENSIONES.map((dimension) => {
    const linea = lineas.find((l) => {
      const primera = normalizar(celdas(l)[0] ?? "");
      return dimension.alias.some((alias) => primera.includes(normalizar(alias)));
    });

    const partes = linea ? celdas(linea) : [];
    const crudo = partes[1] ?? "";
    const puntaje = aNumero(crudo.split("/")[0] ?? "");
    const evidencia = partes[2] ?? "";
    const justificacion = partes[3] ?? "";
    const nivel = puntaje === null ? null : nivelDeclarado(puntaje, dimension.peso);
    const rutasCitadas = extraerRutas(evidencia, slug);

    return {
      clave: dimension.clave,
      nombre: dimension.nombre,
      peso: dimension.peso,
      puntaje,
      nivel,
      nivelValido: nivel !== null && nivelEsValido(nivel),
      evidencia,
      justificacion,
      rutasCitadas,
      rutasVerificadas: rutasCitadas.filter((ruta) => existeArchivoCaso(slug, ruta)),
    };
  });
}

export function parsearNotaFinal(salida: string): number | null {
  const match = salida.match(/NOTA\s+FINAL\s*:?\s*\*{0,2}\s*([\d.,]+)\s*\/\s*100/i);
  return match ? aNumero(match[1]) : null;
}

export function parsearSugerencia(salida: string): string {
  const match = salida.match(/UNA\s+SUGERENCIA\s+CONCRETA\s*:?\s*\*{0,2}\s*([\s\S]+)/i);
  return match ? match[1].trim().replace(/^\[|\]$/g, "").trim() : "";
}

export function sumarPuntajes(filas: FilaResultado[]): number {
  const total = filas.reduce((suma, fila) => suma + (fila.puntaje ?? 0), 0);
  return Math.round(total * 100) / 100;
}

/**
 * Controles que la app corre sobre la salida del modelo. No cambian el puntaje:
 * hacen auditable la corrección del corrector.
 */
export function verificar(
  filas: FilaResultado[],
  notaDeclarada: number | null,
  notaCalculada: number,
  salida: string,
  sugerencia: string,
): Verificacion[] {
  const verificaciones: Verificacion[] = [];

  const faltantes = filas.filter((f) => f.puntaje === null);
  verificaciones.push({
    clave: "dimensiones",
    titulo: "Las cinco dimensiones están puntuadas",
    estado: faltantes.length === 0 ? "ok" : "error",
    detalle:
      faltantes.length === 0
        ? "El modelo devolvió una fila por cada dimensión de la rúbrica."
        : `Sin puntaje: ${faltantes.map((f) => f.nombre).join(", ")}.`,
  });

  const fueraDeEscala = filas.filter((f) => f.puntaje !== null && !f.nivelValido);
  verificaciones.push({
    clave: "escala",
    titulo: "Escala obligatoria 0 · 25 · 50 · 75 · 100 %",
    estado: fueraDeEscala.length === 0 ? "ok" : "error",
    detalle:
      fueraDeEscala.length === 0
        ? "Todos los puntajes caen en uno de los cinco niveles permitidos."
        : `Puntajes intermedios: ${fueraDeEscala
            .map((f) => `${f.nombre} ${f.puntaje}/${f.peso}`)
            .join("; ")}.`,
  });

  const diferencia =
    notaDeclarada === null ? null : Math.abs(notaDeclarada - notaCalculada);
  verificaciones.push({
    clave: "aritmetica",
    titulo: "La nota final es la suma de las dimensiones",
    estado: notaDeclarada === null ? "alerta" : diferencia! < 0.01 ? "ok" : "error",
    detalle:
      notaDeclarada === null
        ? "No se encontró la línea NOTA FINAL en la salida."
        : diferencia! < 0.01
          ? `Declarada ${notaDeclarada}/100, suma de dimensiones ${notaCalculada}/100.`
          : `Declarada ${notaDeclarada}/100 pero las dimensiones suman ${notaCalculada}/100.`,
  });

  const citadas = filas.reduce((n, f) => n + f.rutasCitadas.length, 0);
  const verificadas = filas.reduce((n, f) => n + f.rutasVerificadas.length, 0);
  const sinRuta = filas.filter(
    (f) => (f.puntaje ?? 0) > 0 && f.rutasCitadas.length === 0,
  );
  verificaciones.push({
    clave: "evidencia",
    titulo: "La evidencia citada apunta a archivos que existen",
    estado:
      citadas === 0
        ? "alerta"
        : verificadas === citadas && sinRuta.length === 0
          ? "ok"
          : "alerta",
    detalle:
      citadas === 0
        ? "Ninguna fila cita una ruta de archivo."
        : `${verificadas} de ${citadas} rutas citadas existen en el repositorio` +
          (sinRuta.length > 0
            ? `; sin ruta pese a puntuar: ${sinRuta.map((f) => f.nombre).join(", ")}.`
            : "."),
  });

  const marcaManipulacion = /manipulaci[oó]n|instrucci[oó]n embebida|intento de/i.test(
    salida,
  );
  const marcaInflado = /inflad|no verificable|afirma m[aá]s|discrepancia|contradic/i.test(
    salida,
  );
  verificaciones.push({
    clave: "senales",
    titulo: "Señales reportadas por el corrector",
    estado: marcaManipulacion || marcaInflado ? "alerta" : "ok",
    detalle: [
      marcaManipulacion ? "reporta un intento de manipulación" : null,
      marcaInflado ? "reporta inflado o afirmaciones no verificables" : null,
    ]
      .filter(Boolean)
      .join(" y ")
      .replace(/^./, (c) => c.toUpperCase()) || "No reporta inflado ni manipulación.",
  });

  verificaciones.push({
    clave: "formato",
    titulo: "Respeta el formato de salida del contrato",
    estado: sugerencia ? "ok" : "alerta",
    detalle: sugerencia
      ? "Incluye la tabla, la nota final y la única sugerencia concreta."
      : "Falta la línea UNA SUGERENCIA CONCRETA que exige el contrato.",
  });

  return verificaciones;
}
