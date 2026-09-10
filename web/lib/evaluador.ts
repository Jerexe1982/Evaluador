import { correrCodex } from "./codex";
import { obtenerCredenciales } from "./credenciales";
import { armarUserPrompt } from "./prompt";
import { leerSystemPromptAgente } from "./repo";
import { buscarEsfuerzo, buscarModelo, ESFUERZO_POR_DEFECTO } from "./modelos";
import {
  parsearCamposCerrados,
  parsearConteo,
  parsearFilas,
  parsearInventario,
  parsearNotaFinal,
  parsearSugerencia,
  parsearVeredicto,
  sumarPuntajes,
  verificar,
} from "./parseo";
import { nuevoId } from "./resultados";
import type { Esfuerzo, Resultado } from "./tipos";

export { haySesionChatGPT } from "./credenciales";

/**
 * Corre el agente corrector sobre un trabajo —uno de los casos de prueba o un repositorio
 * de GitHub clonado— y devuelve el resultado ya parseado, con la entrada exacta que se
 * mandó y el uso de tokens de esa corrida.
 */
export async function evaluarCaso(
  slug: string,
  modeloId: string,
  esfuerzoId: string = ESFUERZO_POR_DEFECTO,
): Promise<Resultado> {
  // La lista de modelos es la única puerta: un id de afuera no se cambia por el
  // de por defecto sin avisar, corta la corrida.
  const modelo = buscarModelo(modeloId);
  if (!modelo) throw new Error(`El modelo "${modeloId}" no está habilitado.`);
  // Mismo criterio para el esfuerzo: si llega uno que no existe, la corrida no sale.
  const opcionEsfuerzo = buscarEsfuerzo(esfuerzoId);
  if (!opcionEsfuerzo) throw new Error(`El esfuerzo "${esfuerzoId}" no está habilitado.`);
  const esfuerzo: Esfuerzo = opcionEsfuerzo.id;
  const systemPrompt = leerSystemPromptAgente();
  const { userPrompt, archivos, inyecciones, trabajo } = await armarUserPrompt(slug);
  const credenciales = await obtenerCredenciales();

  const inicio = Date.now();
  const respuesta = await correrCodex({
    modelo: modelo.id,
    esfuerzo,
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
  const veredicto = parsearVeredicto(salidaCruda);
  const inventario = parsearInventario(salidaCruda);
  const conteo = parsearConteo(salidaCruda);

  const fecha = new Date();

  return {
    id: nuevoId(slug, fecha),
    caso: slug,
    tipo: trabajo.tipo,
    origen: trabajo.origen,
    fecha: fecha.toISOString(),
    modelo: respuesta.modelo,
    esfuerzo,
    duracionMs,
    filas,
    notaDeclarada,
    notaCalculada,
    sugerencia,
    camposCerrados,
    veredicto,
    inventario,
    conteo,
    inyecciones,
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
      conteo,
      inyecciones,
    ),
  };
}
