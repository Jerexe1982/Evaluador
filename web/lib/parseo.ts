import { DIMENSIONES, nivelDeclarado, nivelEsValido } from "./rubrica";
import { existeArchivoCaso, existeRutaTrabajo as existeRutaCaso } from "./repo";
import type {
  CamposCerrados,
  ClaveDimension,
  ElementoInventario,
  ExplicacionDimension,
  FilaResultado,
  ItemEvidencia,
  TipoEvidencia,
  Verificacion,
} from "./tipos";

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
  // La tabla resumen manda sobre el puntaje; la ficha explica cómo se llegó a él.
  const lineas = salida.split("\n").filter((l) => l.includes("|"));
  const fichas = parsearFichas(salida, slug);

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
      explicacion: fichas[dimension.clave] ?? null,
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

  // Sólo cuentan las rutas con las que el corrector afirma algo. Las que cita como
  // ausencia —el ítem FALTA de la ficha— no existen por definición: que no estén es
  // justamente la evidencia, y contarlas como error era un defecto de este control.
  const afirmadas = filas.flatMap((f) =>
    f.explicacion
      ? f.explicacion.items
          .filter((i) => i.tipo !== "falta" && i.ruta !== null)
          .map((i) => ({ ruta: i.ruta!, existe: i.existe === true }))
      : f.rutasCitadas.map((ruta) => ({
          ruta,
          existe: f.rutasVerificadas.includes(ruta),
        })),
  );
  const verificadas = afirmadas.filter((r) => r.existe).length;
  const inexistentes = afirmadas.filter((r) => !r.existe);
  const sinRuta = filas.filter(
    (f) =>
      (f.puntaje ?? 0) > 0 &&
      (f.explicacion
        ? f.explicacion.items.every((i) => i.tipo === "falta" || i.ruta === null)
        : f.rutasCitadas.length === 0),
  );
  verificaciones.push({
    clave: "evidencia",
    titulo: "La evidencia citada apunta a archivos que existen",
    estado:
      afirmadas.length === 0
        ? "alerta"
        : inexistentes.length === 0 && sinRuta.length === 0
          ? "ok"
          : "alerta",
    detalle:
      afirmadas.length === 0
        ? "Ninguna fila cita una ruta de archivo para sostener su puntaje."
        : `${verificadas} de ${afirmadas.length} rutas citadas como presentes existen en el repositorio` +
          (inexistentes.length > 0
            ? `; no existen: ${[...new Set(inexistentes.map((r) => r.ruta))].join(", ")}`
            : "") +
          (sinRuta.length > 0
            ? `; puntúa sin citar ningún archivo presente en: ${sinRuta
                .map((f) => f.nombre)
                .join(", ")}.`
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

  // El contrato v2 pide que cada nivel venga con su ficha: qué evidencia lo sostiene, qué
  // tope se aplicó y qué faltó para el nivel de arriba. Sin eso la nota no es auditable.
  const conFicha = filas.filter((f) => f.explicacion);
  const sinPorQue = conFicha.filter((f) => !f.explicacion!.porQueNo.trim());
  verificaciones.push({
    clave: "explicacion",
    titulo: "Cada dimensión explica cómo llegó a su nivel",
    estado:
      conFicha.length === filas.length && sinPorQue.length === 0
        ? "ok"
        : conFicha.length === 0
          ? "error"
          : "alerta",
    detalle:
      conFicha.length === 0
        ? "La salida no trae las fichas por dimensión: sólo se sabe cuánto puso, no por qué."
        : conFicha.length < filas.length
          ? `Fichas en ${conFicha.length} de ${filas.length} dimensiones; sin ficha: ${filas
              .filter((f) => !f.explicacion)
              .map((f) => f.nombre)
              .join(", ")}.`
          : sinPorQue.length > 0
            ? `Sin decir qué faltó para el nivel siguiente: ${sinPorQue
                .map((f) => f.nombre)
                .join(", ")}.`
            : "Las cinco traen evidencia, nivel por evidencia, tope y qué faltó para subir.",
  });

  const discrepan = conFicha.filter(
    (f) =>
      f.explicacion!.nivelFinal !== null &&
      f.nivel !== null &&
      Math.abs(f.explicacion!.nivelFinal - f.nivel) > 0.01,
  );
  verificaciones.push({
    clave: "coherencia",
    titulo: "La ficha y la tabla dicen el mismo nivel",
    estado: conFicha.length === 0 ? "alerta" : discrepan.length === 0 ? "ok" : "error",
    detalle:
      conFicha.length === 0
        ? "Sin fichas no hay nada que contrastar contra la tabla."
        : discrepan.length === 0
          ? "El nivel final de cada ficha es el que la tabla puntúa."
          : `No cierran: ${discrepan
              .map(
                (f) =>
                  `${f.nombre} explica ${f.explicacion!.nivelFinal}% y puntúa ${f.nivel}%`,
              )
              .join("; ")}.`,
  });

  const inventario = parsearInventario(salida);
  const reconocidos = inventario.filter((e) => e.estado !== "desconocido");
  verificaciones.push({
    clave: "inventario",
    titulo: "Dejó por escrito el inventario del repositorio",
    estado: reconocidos.length >= 4 ? "ok" : inventario.length > 0 ? "alerta" : "alerta",
    detalle:
      inventario.length === 0
        ? "La salida no trae el bloque INVENTARIO que abre el protocolo de evidencia."
        : `${reconocidos.length} de los cuatro elementos obligatorios con estado declarado: ${inventario
            .map((e) => `${e.ruta} ${e.estado}`)
            .join(", ")}.`,
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

// ---------------------------------------------------------------------------
// Fichas de explicación: el bloque del contrato v2 donde el corrector muestra
// cómo llegó a cada nivel. Se parsea a estructura para que la app pueda
// contrastarlo con la tabla y con los archivos del repositorio.
// ---------------------------------------------------------------------------

/** Comillas rectas y tipográficas: el modelo usa las dos. */
const COMILLAS = /["“”«»']([^"“”«»']{3,})["“”«»']/;

/** Una ruta de archivo o de carpeta dentro de un texto libre. */
function primeraRuta(texto: string, slug: string): string | null {
  const archivo = extraerRutas(texto, slug)[0];
  if (archivo) return archivo;
  const carpeta = texto.match(/(?:[\w.\-]+\/)+[\w.\-]*/);
  if (!carpeta) return null;
  const limpia = carpeta[0].replace(new RegExp(`^(?:\\./)?(?:casos/)?(?:${slug}/)?`), "");
  return limpia === "" ? null : limpia;
}

function aNivel(texto: string): number | null {
  const match = texto.match(/(\d+(?:[.,]\d+)?)\s*%/);
  return match ? aNumero(match[1]) : null;
}

/** Parte una ficha en sus campos. Un campo es una línea `ETIQUETA: valor`. */
function camposDeFicha(bloque: string): { etiqueta: string; valor: string }[] {
  const campos: { etiqueta: string; valor: string }[] = [];
  let actual: { etiqueta: string; valor: string } | null = null;
  for (const linea of bloque.split("\n")) {
    const encabezado = linea.match(
      /^\s*\**\s*([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ0-9 %]*?)\s*\**\s*:\s*(.*)$/,
    );
    if (encabezado) {
      // El modelo a veces escribe `**ETIQUETA:** valor`, y los asteriscos del cierre
      // quedan pegados al valor: se limpian acá y no en cada campo.
      const valor = encabezado[2].replace(/^\**\s*/, "").replace(/\s*\**$/, "").trim();
      actual = { etiqueta: normalizar(encabezado[1]), valor };
      campos.push(actual);
    } else if (actual) {
      actual.valor = `${actual.valor}\n${linea}`.trim();
    }
  }
  return campos;
}

function valorDe(
  campos: { etiqueta: string; valor: string }[],
  prefijo: string,
): string | null {
  return campos.find((c) => c.etiqueta.startsWith(prefijo))?.valor ?? null;
}

/**
 * Un ítem de evidencia: `- CONFIRMA · ruta — "cita" → qué prueba`. Se lee tolerante,
 * porque lo único que el contrato garantiza es el tipo, la ruta y la cita.
 */
function parsearItem(linea: string, slug: string): ItemEvidencia | null {
  const cuerpo = linea.replace(/^\s*[-*•]\s*/, "").trim();
  if (!cuerpo) return null;
  const etiqueta = normalizar(cuerpo.slice(0, 12));
  const tipo: TipoEvidencia | null = etiqueta.startsWith("confirma")
    ? "confirma"
    : etiqueta.startsWith("falta")
      ? "falta"
      : etiqueta.startsWith("contradice")
        ? "contradice"
        : null;
  if (tipo === null) return null;

  // Sólo se saca la etiqueta del tipo y el separador que la sigue: recortar hasta el
  // primer guión partía al medio rutas como `corridas/corrida-1/entrada.md`.
  const resto = cuerpo
    .replace(/^(confirma|falta|contradice)\b\s*[·—–:-]?\s*/i, "")
    .trim();
  const cita = resto.match(COMILLAS)?.[1]?.trim() ?? null;
  const antesDeLaCita = cita ? resto.slice(0, resto.indexOf(cita)) : resto;
  const ruta = primeraRuta(antesDeLaCita, slug) ?? primeraRuta(resto, slug);
  const comentario = (
    resto.split(/→|->|\s—\s(?=[^"“«]*$)/).slice(1).join(" ").trim() ||
    resto.replace(COMILLAS, "").replace(ruta ?? "", "").replace(/^[\s·—:-]+/, "").trim()
  ).replace(/^[\s·—:-]+/, "");

  return {
    tipo,
    ruta,
    cita,
    comentario,
    existe: ruta === null ? null : existeRutaCaso(slug, ruta),
  };
}

/**
 * Las cinco fichas del contrato v2, indexadas por dimensión. Las corridas viejas no
 * las traen: en ese caso el mapa vuelve vacío y las vistas se acomodan.
 */
export function parsearFichas(
  salida: string,
  slug: string,
): Partial<Record<ClaveDimension, ExplicacionDimension>> {
  const bloques = salida.split(/^\s*\**\s*FICHA\s*\**\s*:/im).slice(1);
  const fichas: Partial<Record<ClaveDimension, ExplicacionDimension>> = {};

  for (const bloque of bloques) {
    const titulo = normalizar(bloque.split("\n")[0].replace(/\**/g, ""));
    const dimension = DIMENSIONES.find((d) =>
      d.alias.some((alias) => titulo.includes(normalizar(alias))),
    );
    if (!dimension || fichas[dimension.clave]) continue;

    // La ficha termina donde empieza el cierre del contrato.
    const cuerpo = bloque.split(
      /^\s*\**\s*(?:TOPES\s+APLICADOS|INFLADO\s+DETECTADO|NOTA\s+FINAL)\b/im,
    )[0];
    const campos = camposDeFicha(cuerpo);

    const evidencia = valorDe(campos, "evidencia") ?? "";
    const items = evidencia
      .split("\n")
      .map((linea) => parsearItem(linea, slug))
      .filter((item): item is ItemEvidencia => item !== null);

    const tope = valorDe(campos, "tope");
    const porQueNo = campos.find((c) => c.etiqueta.startsWith("por que no"));
    const confianza = valorDe(campos, "confianza") ?? "";
    const nivelConfianza = normalizar(confianza).startsWith("alta")
      ? "alta"
      : normalizar(confianza).startsWith("media")
        ? "media"
        : normalizar(confianza).startsWith("baja")
          ? "baja"
          : null;

    fichas[dimension.clave] = {
      clave: dimension.clave,
      items,
      nivelPorEvidencia: aNivel(valorDe(campos, "nivel por evidencia") ?? ""),
      tope: tope === null || campoVacio(tope) ? null : tope,
      nivelFinal: aNivel(valorDe(campos, "nivel final") ?? ""),
      nivelDescartado: porQueNo ? aNivel(porQueNo.etiqueta) : null,
      porQueNo: porQueNo?.valor ?? "",
      paraSubir: valorDe(campos, "para subir") ?? "",
      confianza: nivelConfianza,
      // "alta — evidencia directa" trae motivo; "alta" a secas, no.
      motivoConfianza: /[—–-]/.test(confianza)
        ? confianza.replace(/^[^—–-]*[—–-]\s*/, "").trim()
        : "",
    };
  }

  return fichas;
}

/** La frase con la que el corrector resume de dónde sale la nota. */
export function parsearVeredicto(salida: string): string | null {
  const match = salida.match(/VEREDICTO\s+EN\s+UNA\s+FRASE\s*:?\s*\**\s*(.+)/i);
  return match ? match[1].trim().replace(/^\[|\]$/g, "").trim() : null;
}

/** Los cuatro elementos obligatorios, como los inventarió el corrector. */
export function parsearInventario(salida: string): ElementoInventario[] {
  const bloque = salida.split(/^\s*\**\s*INVENTARIO\s*\**\s*:?\s*$/im)[1];
  if (!bloque) return [];
  const elementos: ElementoInventario[] = [];
  for (const linea of bloque.split("\n")) {
    if (!/^\s*[-*•]/.test(linea)) {
      if (elementos.length > 0) break;
      continue;
    }
    const partes = linea
      .replace(/^\s*[-*•]\s*/, "")
      .split(/\s+[—–]\s+/)
      .map((p) => p.replace(/\**|`/g, "").trim());
    if (partes.length === 0 || !partes[0]) continue;
    const estado = normalizar(partes[1] ?? "");
    elementos.push({
      ruta: partes[0],
      estado: estado.startsWith("presente")
        ? "presente"
        : estado.startsWith("vacio")
          ? "vacio"
          : estado.startsWith("ausente")
            ? "ausente"
            : "desconocido",
      detalle: partes.slice(2).join(" — ").trim() || (partes.length < 2 ? "" : partes[1]),
    });
  }
  return elementos;
}
