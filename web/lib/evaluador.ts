import { correrCodex } from "./codex";
import { obtenerCredenciales } from "./credenciales";
import { armarUserPrompt } from "./prompt";
import { leerSystemPromptAgente } from "./repo";
import { buscarModelo, ESFUERZO_RAZONAMIENTO, MODELO_POR_DEFECTO } from "./modelos";
import {
  parsearCamposCerrados,
  parsearFilas,
  parsearNotaFinal,
  parsearSugerencia,
  sumarPuntajes,
  verificar,
} from "./parseo";
import { nuevoId } from "./resultados";
import type { Resultado } from "./tipos";

export { haySesionChatGPT } from "./credenciales";

/**
 * Corre el agente corrector sobre un caso y devuelve el resultado ya parseado,
 * con la entrada exacta que se mandó y el uso de tokens de esa corrida.
 */
export async function evaluarCaso(slug: string, modeloId: string): Promise<Resultado> {
  const modelo = buscarModelo(modeloId) ?? buscarModelo(MODELO_POR_DEFECTO)!;
  const systemPrompt = leerSystemPromptAgente();
  const { userPrompt, archivos } = armarUserPrompt(slug);
  const credenciales = await obtenerCredenciales();

  const inicio = Date.now();
  const respuesta = await correrCodex({
    modelo: modelo.id,
    esfuerzo: ESFUERZO_RAZONAMIENTO,
    systemPrompt,
    userPrompt,
    credenciales,
    // El system prompt y el caso se repiten entre corridas: que las reuse el caché.
    claveCache: `evaluador-${slug}`,
  });
  const duracionMs = Date.now() - inicio;

  const salidaCruda = respuesta.texto;
  const filas = parsearFilas(salidaCruda, slug);
  const notaDeclarada = parsearNotaFinal(salidaCruda);
  const notaCalculada = sumarPuntajes(filas);
  const sugerencia = parsearSugerencia(salidaCruda);
  const camposCerrados = parsearCamposCerrados(salidaCruda);

  const fecha = new Date();

  return {
    id: nuevoId(slug, fecha),
    caso: slug,
    fecha: fecha.toISOString(),
    modelo: respuesta.modelo,
    duracionMs,
    filas,
    notaDeclarada,
    notaCalculada,
    sugerencia,
    camposCerrados,
    razonamiento: respuesta.razonamiento,
    salidaCruda,
    uso: {
      tokensEntrada: respuesta.uso.entrada,
      tokensSalida: respuesta.uso.salida,
      tokensCacheLectura: respuesta.uso.cacheLectura,
      tokensRazonamiento: respuesta.uso.razonamiento,
      plan: credenciales.plan,
    },
    entrada: { systemPrompt, userPrompt, archivos },
    verificaciones: verificar(
      filas,
      notaDeclarada,
      notaCalculada,
      salidaCruda,
      sugerencia,
    ),
  };
}
