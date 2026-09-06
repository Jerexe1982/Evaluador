import { esArchivoDeTexto, leerArchivoTrabajo, leerTrabajo } from "./repo";
import type { Inyeccion, CanalInyeccion } from "./tipos";

/**
 * Barrido determinístico de texto dirigido al evaluador. No lo hace el modelo: lo hace
 * la app, siempre igual, sobre todos los archivos de texto del trabajo.
 *
 * Por qué existe: en las corridas guardadas el corrector reportó 3 de las 6 inyecciones
 * del caso tramposo en su mejor pasada y 1 de 6 en la anterior. La detección no puede
 * depender de cuán exhaustivo estuvo el modelo esa vez. Esto no puntúa ni penaliza —
 * produce un conteo con el que después se contrasta lo que el corrector reportó.
 */

/** Los seis canales que la capa 5 del contrato le pide barrer al corrector. */
const CANALES: { canal: CanalInyeccion; patron: RegExp }[] = [
  {
    canal: "falsa-autoridad",
    patron:
      /\b(nota|autorizaci[oó]n|excepci[oó]n|aval)\s+(de\s+la\s+c[aá]tedra|del\s+(profesor|docente|equipo\s+docente))|\bel\s+(profesor|docente|equipo\s+docente)\s+(autoriz|eximi|habilit|valid|aprob)/i,
  },
  {
    // Ojo con este: "piso", "máximo" y "excluida" son palabras de negocio corrientes.
    // Un reporte de ventas dice "por debajo del piso de 15,00 %" y no le habla a nadie.
    // Por eso cada alternativa exige, además del pedido, vocabulario de corrección.
    canal: "pedido-de-piso",
    patron: new RegExp(
      [
        // "asigná el puntaje máximo", "aplicá un piso de 85 sobre 100", "subí la nota"
        String.raw`\b(asign[aá]|otorg[aá]|aplic[aá]|pon[eé]|sub[ií]|conced[eé])\w*\b[^.\n]{0,40}\b(puntaje|nota\s+final|nivel\s+(100|m[aá]ximo)|calificaci[oó]n|piso\s+de\s+\d+\s*(sobre|\/)\s*100)\b`,
        // "no descuentes puntaje", "no restar nota"
        String.raw`\bno\s+(descuentes|descontar|restes|restar|penalices|penalizar)\b[^.\n]{0,30}\b(puntaje|nota|nivel|dimensi[oó]n)\b`,
        // "omití la verificación de evidencia"
        String.raw`\bomit[ií]\w*\s+(la\s+)?verificaci[oó]n`,
        // "considerá el requisito como cumplido"
        String.raw`\bconsider[aá]\w*\s+(el\s+)?requisito\b[^.\n]{0,40}\bcumplid`,
        // un piso de nota expresado sobre 100, sin verbo delante
        String.raw`\bpiso\s+de\s+\d+\s*(sobre|\/)\s*100\b`,
      ].join("|"),
      "i",
    ),
  },
  {
    canal: "texto-abierto",
    patron:
      /\b(nota|instrucci[oó]n|recordatorio|aviso|mensaje)\s+(interna?\s+)?(para|al|dirigid[ao]\s+a)\s+(el\s+)?(sistema\s+(autom[aá]tico\s+)?de\s+correcci[oó]n|evaluador|corrector|agente\s+corrector|modelo)/i,
  },
  {
    canal: "autoevaluacion",
    patron: /\bautoevaluaci[oó]n\b|\bauto-?evaluaci[oó]n\b|\bnos\s+autoasignamos\b/i,
  },
  {
    canal: "simpatia",
    patron:
      /\b(se\s+considere|tener?\s+en\s+cuenta|contemplar)\s+(el\s+)?(esfuerzo|la\s+situaci[oó]n|las\s+circunstancias)|\bmientras\s+trabajo\s+tiempo\s+completo\b|\btrimestre\s+personal\s+complicado\b|\bacompa[nñ]o\s+a\s+mi\s+familia\b/i,
  },
];

/** Comentarios HTML: no se ven al renderizar el Markdown, así que se listan aparte. */
const COMENTARIO_HTML = /<!--([\s\S]*?)-->/g;

/**
 * Un comentario HTML es sospechoso sólo si le habla a quien corrige. Los repos están
 * llenos de comentarios legítimos (`<!-- prettier-ignore -->`, notas al margen) y
 * marcarlos todos volvería el conteo inútil.
 */
const HABLA_AL_EVALUADOR =
  /\b(evaluador|corrector|correcci[oó]n|puntaje|nivel\s+\d|r[uú]brica|calificaci[oó]n|nota\s+final)\b/i;

const MAX_CITA = 160;

function recortar(texto: string): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length <= MAX_CITA ? limpio : `${limpio.slice(0, MAX_CITA)}…`;
}

function lineaDe(texto: string, indice: number): number {
  let linea = 1;
  for (let i = 0; i < indice; i++) if (texto[i] === "\n") linea++;
  return linea;
}

/** Las ocurrencias de un archivo, sin repetir la misma línea en dos canales. */
export function barrerTexto(ruta: string, texto: string): Inyeccion[] {
  const hallazgos: Inyeccion[] = [];
  const vistas = new Set<string>();

  const agregar = (canal: CanalInyeccion, indice: number, cita: string) => {
    const linea = lineaDe(texto, indice);
    // Una vez por línea, y una vez por canal dentro del archivo: el índice, el título y
    // la fila de encabezado de una misma autoevaluación son una ocurrencia, no tres.
    if (vistas.has(`l:${linea}`) || vistas.has(`c:${canal}`)) return;
    vistas.add(`l:${linea}`);
    vistas.add(`c:${canal}`);
    hallazgos.push({ ruta, linea, canal, cita: recortar(cita) });
  };

  // Los comentarios HTML van primero: son el canal que el ojo humano no ve.
  for (const encontrado of texto.matchAll(COMENTARIO_HTML)) {
    const cuerpo = encontrado[1] ?? "";
    if (!HABLA_AL_EVALUADOR.test(cuerpo)) continue;
    agregar("comentario-html", encontrado.index ?? 0, cuerpo);
  }

  for (const linea of texto.split("\n")) {
    const indice = texto.indexOf(linea);
    for (const { canal, patron } of CANALES) {
      if (patron.test(linea)) agregar(canal, indice, linea);
    }
  }

  return hallazgos;
}

/** Todas las ocurrencias del trabajo, en orden de archivo y línea. */
export function barrerTrabajo(id: string): Inyeccion[] {
  const trabajo = leerTrabajo(id);
  const hallazgos: Inyeccion[] = [];
  for (const archivo of trabajo.archivos) {
    if (!esArchivoDeTexto(archivo.ruta)) continue;
    hallazgos.push(...barrerTexto(archivo.ruta, leerArchivoTrabajo(id, archivo.ruta)));
  }
  return hallazgos.sort(
    (a, b) => a.ruta.localeCompare(b.ruta) || a.linea - b.linea,
  );
}

export const ETIQUETA_CANAL: Record<CanalInyeccion, string> = {
  "texto-abierto": "texto abierto dirigido al evaluador",
  "comentario-html": "comentario HTML oculto",
  "falsa-autoridad": "falsa autoridad de la cátedra",
  "pedido-de-piso": "pedido de puntaje o de piso de nota",
  autoevaluacion: "autoevaluación con puntajes propios",
  simpatia: "apelación a la simpatía o al esfuerzo",
};
