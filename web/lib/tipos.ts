export type ClaveDimension =
  | "sistema"
  | "proceso"
  | "formato"
  | "economico"
  | "gobierno";

export type Dimension = {
  clave: ClaveDimension;
  nombre: string;
  peso: number;
  /** Aliases usados para reconocer la fila en la salida del modelo. */
  alias: string[];
};

export type ArchivoCaso = {
  /** Ruta relativa a la carpeta del caso, p. ej. "prompts/system_prompt.md". */
  ruta: string;
  bytes: number;
};

export type Caso = {
  /** Nombre de la carpeta dentro de casos/, p. ej. "excelente". */
  slug: string;
  archivos: ArchivoCaso[];
  bytesTotales: number;
};

export type FilaResultado = {
  clave: ClaveDimension;
  nombre: string;
  peso: number;
  /** Puntaje sobre el peso, tal como lo devolvió el modelo. */
  puntaje: number | null;
  /** puntaje / peso, en porcentaje (0, 25, 50, 75 o 100 si respeta la escala). */
  nivel: number | null;
  /** El nivel que el corrector escribió en la columna Nivel, para contrastarlo. */
  nivelDeclarado: number | null;
  /** false si el nivel cae fuera de la escala obligatoria de la rúbrica. */
  nivelValido: boolean;
  evidencia: string;
  justificacion: string;
  /** Rutas de archivo detectadas dentro del texto de la evidencia. */
  rutasCitadas: string[];
  /** Subconjunto de rutasCitadas que existe de verdad en el caso. */
  rutasVerificadas: string[];
};

/** Las líneas fijas con las que el contrato cierra la salida. */
export type CamposCerrados = {
  topes: string | null;
  inflado: string | null;
  manipulacion: string | null;
  queMeFalta: string | null;
};

export type Verificacion = {
  clave: string;
  titulo: string;
  estado: "ok" | "alerta" | "error";
  detalle: string;
};

export type UsoModelo = {
  tokensEntrada: number;
  tokensSalida: number;
  tokensCacheLectura: number;
  costoUSD: number;
  precioEntradaPorMillon: number;
  precioSalidaPorMillon: number;
};

export type EntradaEnviada = {
  systemPrompt: string;
  userPrompt: string;
  archivos: ArchivoCaso[];
};

export type Resultado = {
  id: string;
  caso: string;
  fecha: string;
  modelo: string;
  duracionMs: number;
  filas: FilaResultado[];
  notaDeclarada: number | null;
  notaCalculada: number;
  sugerencia: string;
  /** Opcional: los resultados guardados antes de este campo no lo tienen. */
  camposCerrados?: CamposCerrados;
  razonamiento: string | null;
  salidaCruda: string;
  uso: UsoModelo;
  entrada: EntradaEnviada;
  verificaciones: Verificacion[];
};

/** Resumen liviano para listados, sin el peso de la entrada ni la salida cruda. */
export type ResumenResultado = {
  id: string;
  caso: string;
  fecha: string;
  modelo: string;
  notaCalculada: number;
  notaDeclarada: number | null;
  costoUSD: number;
  alertas: number;
};
