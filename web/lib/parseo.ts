import { DIMENSIONES, nivelDeclarado, nivelEsValido } from "./rubrica";
import { existeArchivoCaso } from "./repo";
import type { CamposCerrados, FilaResultado, Verificacion } from "./tipos";

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
    // El contrato pide | Dimensión | Nivel | Puntaje | Evidencia | Justificación |, pero el
    // puntaje se ubica por su forma (X/peso), no por su posición: así la lectura no se rompe
    // si el formato de salida gana o pierde una columna.
    const iPuntaje = partes.findIndex(
      (c, i) => i > 0 && /^\**\s*[\d.,]+\s*\/\s*\d+/.test(c),
    );
    const crudo = iPuntaje === -1 ? "" : partes[iPuntaje];
    const puntaje = aNumero(crudo.replace(/\*/g, "").split("/")[0] ?? "");
    const celdaNivel = iPuntaje > 0 ? (partes[iPuntaje - 1] ?? "") : "";
    const nivelEnTabla = /^\**\s*\d+\s*%/.test(celdaNivel)
      ? aNumero(celdaNivel.replace(/[*%]/g, ""))
      : null;
    const evidencia = iPuntaje === -1 ? "" : (partes[iPuntaje + 1] ?? "");
    const justificacion = iPuntaje === -1 ? "" : (partes[iPuntaje + 2] ?? "");
    const nivel = puntaje === null ? null : nivelDeclarado(puntaje, dimension.peso);
    const rutasCitadas = extraerRutas(evidencia, slug);

    return {
      clave: dimension.clave,
      nombre: dimension.nombre,
      peso: dimension.peso,
      puntaje,
      nivel,
      nivelDeclarado: nivelEnTabla,
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
  if (!match) return "";
  // La sugerencia termina donde empieza el siguiente campo cerrado del contrato.
  const corte = match[1].split(
    /\n\s*(?:QU[EÉ]\s+ME\s+FALTA|TOPES\s+APLICADOS|INFLADO\s+DETECTADO|INTENTO\s+DE\s+MANIPULACI[OÓ]N|NOTA\s+FINAL)\b/i,
  )[0];
  return corte.trim().replace(/^\[|\]$/g, "").trim();
}

/**
 * Los campos cerrados con los que el contrato cierra la salida. Cada línea existe
 * siempre: "ninguno" es una respuesta, no la ausencia de una señal.
 */
export function parsearCamposCerrados(salida: string): CamposCerrados {
  const campo = (etiqueta: RegExp): string | null => {
    const encontrado = salida.match(etiqueta);
    return encontrado ? encontrado[1].trim() : null;
  };
  return {
    topes: campo(/TOPES\s+APLICADOS\s*:?\s*(.*)/i),
    inflado: campo(/INFLADO\s+DETECTADO\s*:?\s*(.*)/i),
    manipulacion: campo(/INTENTO\s+DE\s+MANIPULACI[OÓ]N\s*:?\s*(.*)/i),
    queMeFalta: campo(/QU[EÉ]\s+ME\s+FALTA\s+PARA\s+EVALUAR\s+MEJOR\s*:?\s*(.*)/i),
  };
}

/** true cuando el campo cerrado dice explícitamente que no hay nada que reportar. */
export function campoVacio(valor: string | null): boolean {
  return (
    valor === null ||
    valor === "" ||
    /^(ninguno|ninguna|nada|no|-|—)\b/i.test(valor.replace(/[*`[\]]/g, "").trim())
  );
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

  // El contrato cierra la salida con líneas fijas. Se leen esas líneas en vez de rastrear
  // palabras sueltas: "ninguno" es una respuesta explícita, no la ausencia de una señal.
  const campos = parsearCamposCerrados(salida);

  const marcaManipulacion =
    campos.manipulacion !== null
      ? !campoVacio(campos.manipulacion)
      : /manipulaci[oó]n|instrucci[oó]n embebida/i.test(salida);
  const marcaInflado =
    campos.inflado !== null
      ? !campoVacio(campos.inflado)
      : /inflad|no verificable|afirma m[aá]s|discrepancia|contradic/i.test(salida);
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

  const conNivel = filas.filter((f) => f.nivelDeclarado !== null && f.nivel !== null);
  const inconsistentes = conNivel.filter(
    (f) => Math.abs(f.nivelDeclarado! - f.nivel!) > 0.01,
  );
  verificaciones.push({
    clave: "nivel",
    titulo: "El nivel declarado coincide con el puntaje",
    estado: conNivel.length === 0 ? "alerta" : inconsistentes.length === 0 ? "ok" : "error",
    detalle:
      conNivel.length === 0
        ? "La salida no trae la columna Nivel que pide el contrato."
        : inconsistentes.length === 0
          ? "En cada fila, el nivel declarado es el puntaje sobre el peso."
          : `No cierran: ${inconsistentes
              .map((f) => `${f.nombre} declara ${f.nivelDeclarado}% y puntúa ${f.nivel}%`)
              .join("; ")}.`,
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
