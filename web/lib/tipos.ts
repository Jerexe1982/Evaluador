/** Cuánto razona el modelo antes de contestar. Lo elige quien corre la corrida. */
export type Esfuerzo = "low" | "medium" | "high";

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
  /** Ruta relativa a la raíz del trabajo, p. ej. "prompts/system_prompt.md". */
  ruta: string;
  bytes: number;
};

/** Los seis canales de texto dirigido al evaluador que barre `inyecciones.ts`. */
export type CanalInyeccion =
  | "texto-abierto"
  | "comentario-html"
  | "falsa-autoridad"
  | "pedido-de-piso"
  | "autoevaluacion"
  | "simpatia";

/** Una ocurrencia encontrada por el barrido de la app, no por el modelo. */
export type Inyeccion = {
  ruta: string;
  linea: number;
  canal: CanalInyeccion;
  cita: string;
};

/**
 * De dónde salió un trabajo: de `casos/` —los tres casos de prueba del grupo— o de un
 * repositorio de GitHub clonado a pedido para corregirlo.
 */
export type TipoTrabajo = "caso" | "github";

export type OrigenGithub = {
  url: string;
  owner: string;
  repo: string;
  /** La rama pedida, o null si se clonó la que el repo tenga por defecto. */
  ref: string | null;
  commit: string;
  mensajeCommit: string;
  fechaCommit: string;
  autorCommit: string;
  /** Commits alcanzados por el clon: la historia que el corrector llega a ver. */
  commits: number;
  clonadoEn: string;
};

export type Trabajo = {
  /** Identificador y nombre de carpeta: "excelente" o "owner__repo". */
  id: string;
  tipo: TipoTrabajo;
  archivos: ArchivoCaso[];
  bytesTotales: number;
  /** Archivos que existen en el repo pero no se le mandan al corrector. */
  omitidos: number;
  origen: OrigenGithub | null;
};

/** Los tres casos de prueba son trabajos como cualquier otro. */
export type Caso = Trabajo;

/**
 * Un ítem de evidencia de la ficha de una dimensión. Es la unidad mínima con la que el
 * corrector sostiene —o desmiente— un nivel: qué archivo, qué dice, y qué prueba.
 */
export type TipoEvidencia = "confirma" | "falta" | "contradice";

export type ItemEvidencia = {
  tipo: TipoEvidencia;
  /** Ruta relativa a la raíz del trabajo, o null si el corrector no citó ninguna. */
  ruta: string | null;
  /** Fragmento textual del archivo. Los ítems de ausencia no la traen: no hay qué citar. */
  cita: string | null;
  /** Qué exigencia cumple, qué falta o contra qué afirmación va. */
  comentario: string;
  /** Si la ruta existe en el trabajo. null cuando el ítem no cita ninguna. */
  existe: boolean | null;
};

export type Confianza = "alta" | "media" | "baja";

/**
 * La cadena de decisión de una dimensión, tal como la escribe el corrector: qué encontró,
 * qué nivel salió de esa evidencia, qué tope se activó, en qué nivel terminó, y qué
 * artefacto concreto habría hecho falta para el nivel de arriba.
 */
export type ExplicacionDimension = {
  clave: ClaveDimension;
  items: ItemEvidencia[];
  /** Nivel que sale de la tabla de la rúbrica, antes de mirar los topes. */
  nivelPorEvidencia: number | null;
  /** El tope que se activó, textual, o null si no se activó ninguno. */
  tope: string | null;
  /** Nivel después del tope. Tiene que ser el mismo de la tabla resumen. */
  nivelFinal: number | null;
  /** El nivel inmediato superior que el corrector descartó, si lo nombró. */
  nivelDescartado: number | null;
  porQueNo: string;
  paraSubir: string;
  confianza: Confianza | null;
  motivoConfianza: string;
};

/** Uno de los cuatro elementos obligatorios, con lo que el corrector encontró de él. */
export type ElementoInventario = {
  ruta: string;
  estado: "presente" | "vacio" | "ausente" | "desconocido";
  detalle: string;
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
  /** La ficha de la dimensión. Las corridas anteriores al contrato v2 no la tienen. */
  explicacion?: ExplicacionDimension | null;
};

/**
 * El bloque CONTEO de la capa 6.3: los hechos contables que el contrato exige escribir
 * antes de elegir un nivel. Lo que no vino en la salida queda en null.
 */
export type Conteo = {
  corridas: number | null;
  corridasConEntrada: number | null;
  corridasConFecha: number | null;
  piezasContrato: number | null;
  it: number | null;
  ctlA: boolean | null;
  ctlB: boolean | null;
  contradicciones: number | null;
  manipulaciones: number | null;
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
  /** Tokens de razonamiento, ya contados dentro de los de salida. */
  tokensRazonamiento: number;
  /** El plan de ChatGPT que cubrió la corrida: "plus", "pro", "team"… */
  plan: string | null;
};

export type EntradaEnviada = {
  systemPrompt: string;
  userPrompt: string;
  archivos: ArchivoCaso[];
};

export type Resultado = {
  id: string;
  /** Id del trabajo corregido: el slug del caso o del repo clonado. */
  caso: string;
  tipo?: TipoTrabajo;
  /** De dónde se tomó el trabajo, cuando vino de GitHub. */
  origen?: OrigenGithub | null;
  fecha: string;
  modelo: string;
  /** Opcional: las corridas guardadas antes de que el esfuerzo fuera elegible no lo traen. */
  esfuerzo?: Esfuerzo;
  duracionMs: number;
  filas: FilaResultado[];
  notaDeclarada: number | null;
  notaCalculada: number;
  sugerencia: string;
  /** Opcional: los resultados guardados antes de este campo no lo tienen. */
  camposCerrados?: CamposCerrados;
  /** De dónde sale la nota, en una frase. Contrato v2 en adelante. */
  veredicto?: string | null;
  /** El paso 1 del protocolo, escrito por el corrector. Contrato v2 en adelante. */
  inventario?: ElementoInventario[];
  /** Los hechos contables del bloque CONTEO. Contrato v3 en adelante. */
  conteo?: Conteo | null;
  /** El barrido de inyecciones de la app, para contrastar con lo que reportó el modelo. */
  inyecciones?: Inyeccion[];
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
  tipo: TipoTrabajo;
  fecha: string;
  modelo: string;
  esfuerzo?: Esfuerzo;
  notaCalculada: number;
  notaDeclarada: number | null;
  tokensTotales: number;
  alertas: number;
};

/**
 * Lo que el grupo espera de cada caso de prueba, según la consigna del parcial:
 * el excelente puntúa alto, el flojo bajo, y el tramposo además tiene que quedar
 * detectado como intento de manipulación.
 */
export type Expectativa = {
  /** Qué demuestra este caso. Se muestra arriba del veredicto. */
  proposito: string;
  notaMinima: number | null;
  notaMaxima: number | null;
  /** true cuando el corrector tiene que reportar el intento de manipulación. */
  exigeDeteccion: boolean;
};

/** La nota que le hubiera puesto el grupo a un caso, nivel por dimensión. */
export type NotaHumana = {
  /** Nivel en % del peso: 0, 25, 50, 75 o 100. */
  niveles: Partial<Record<ClaveDimension, number>>;
  /** Por qué esa nota, y qué se discutió. Es la materia prima de calibracion.md. */
  comentario: string;
  actualizado: string | null;
};

export type CalibracionCaso = {
  caso: string;
  expectativa: Expectativa;
  humano: NotaHumana;
};

/** Una dimensión, con lo que puso el agente y lo que hubiera puesto el grupo. */
export type Brecha = {
  clave: ClaveDimension;
  nombre: string;
  peso: number;
  puntajeAgente: number | null;
  nivelAgente: number | null;
  puntajeHumano: number | null;
  nivelHumano: number | null;
  /** agente − humano, en puntos de la nota final. */
  delta: number | null;
  /** true cuando los dos cayeron en el mismo nivel de la escala. */
  coincide: boolean;
};
