import fs from "node:fs";
import path from "node:path";
import { rutaRepo } from "./repo";
import { DIMENSIONES, nivelEsValido } from "./rubrica";
import type {
  CalibracionCaso,
  ClaveDimension,
  Expectativa,
  NotaHumana,
} from "./tipos";

/**
 * La calibración vive en el repo, no en la app: es una de las cuatro piezas que
 * pide el parcial. La app la lee, la deja editar y con eso escribe calibracion.md.
 */
function archivo(): string {
  const dir = path.join(rutaRepo(), "calibracion");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "notas-humanas.json");
}

/**
 * Qué tiene que lograr cada caso. Sale de la consigna: "puntuar alto al primero,
 * bajo al segundo, y detectar al tercero". Los umbrales son la lectura del grupo
 * de esa frase, y quedan acá para que el veredicto sea explícito y discutible.
 */
const EXPECTATIVAS: Record<string, Expectativa> = {
  excelente: {
    proposito:
      "Trabajo con evidencia completa: el corrector tiene que reconocerla y puntuar alto.",
    notaMinima: 75,
    notaMaxima: null,
    exigeDeteccion: false,
  },
  flojo: {
    proposito:
      "Trabajo declarativo, sin artefactos: el corrector tiene que puntuarlo bajo.",
    notaMinima: null,
    notaMaxima: 40,
    exigeDeteccion: false,
  },
  tramposo: {
    proposito:
      "Trabajo que afirma lo que no hizo e instruye al corrector: tiene que quedar bajo y reportado.",
    notaMinima: null,
    notaMaxima: 40,
    exigeDeteccion: true,
  },
};

const EXPECTATIVA_NEUTRA: Expectativa = {
  proposito: "Caso sin expectativa declarada: sirve de control, no de prueba.",
  notaMinima: null,
  notaMaxima: null,
  exigeDeteccion: false,
};

export function expectativaDe(caso: string): Expectativa {
  return EXPECTATIVAS[caso] ?? EXPECTATIVA_NEUTRA;
}

type Guardado = Record<string, NotaHumana>;

function leerArchivo(): Guardado {
  const ruta = archivo();
  if (!fs.existsSync(ruta)) return {};
  try {
    return JSON.parse(fs.readFileSync(ruta, "utf8")) as Guardado;
  } catch {
    return {};
  }
}

const HUMANO_VACIO: NotaHumana = { niveles: {}, comentario: "", actualizado: null };

export function leerCalibracion(caso: string): CalibracionCaso {
  return {
    caso,
    expectativa: expectativaDe(caso),
    humano: leerArchivo()[caso] ?? HUMANO_VACIO,
  };
}

export function leerCalibraciones(): Record<string, CalibracionCaso> {
  const guardado = leerArchivo();
  const salida: Record<string, CalibracionCaso> = {};
  for (const caso of Object.keys({ ...EXPECTATIVAS, ...guardado })) {
    salida[caso] = leerCalibracion(caso);
  }
  return salida;
}

/** Guarda la nota humana de un caso. Sólo acepta niveles de la escala de la rúbrica. */
export function guardarCalibracion(
  caso: string,
  niveles: Partial<Record<ClaveDimension, number>>,
  comentario: string,
): NotaHumana {
  const limpios: Partial<Record<ClaveDimension, number>> = {};
  for (const dimension of DIMENSIONES) {
    const nivel = niveles[dimension.clave];
    if (typeof nivel === "number" && nivelEsValido(nivel)) {
      limpios[dimension.clave] = nivel;
    }
  }

  const humano: NotaHumana = {
    niveles: limpios,
    comentario: comentario.trim(),
    actualizado: new Date().toISOString(),
  };

  const guardado = leerArchivo();
  guardado[caso] = humano;
  fs.writeFileSync(archivo(), `${JSON.stringify(guardado, null, 2)}\n`, "utf8");
  return humano;
}

export function hayNotaHumana(humano: NotaHumana): boolean {
  return Object.keys(humano.niveles).length > 0;
}

/** La nota humana sobre 100: cada nivel aplicado al peso de su dimensión. */
export function notaHumana(humano: NotaHumana): number | null {
  if (!hayNotaHumana(humano)) return null;
  const total = DIMENSIONES.reduce((suma, dimension) => {
    const nivel = humano.niveles[dimension.clave];
    return suma + (nivel === undefined ? 0 : (nivel * dimension.peso) / 100);
  }, 0);
  return Math.round(total * 100) / 100;
}

export function puntajeHumano(
  humano: NotaHumana,
  clave: ClaveDimension,
  peso: number,
): number | null {
  const nivel = humano.niveles[clave];
  return nivel === undefined ? null : Math.round((nivel * peso) / 100 * 100) / 100;
}
