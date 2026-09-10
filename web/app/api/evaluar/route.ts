import { NextResponse } from "next/server";
import { evaluarCaso, haySesionChatGPT } from "@/lib/evaluador";
import {
  buscarEsfuerzo,
  buscarModelo,
  ESFUERZOS,
  ESFUERZO_POR_DEFECTO,
  MODELOS,
  MODELO_POR_DEFECTO,
} from "@/lib/modelos";
import { existeTrabajo } from "@/lib/repo";
import { guardarResultado } from "@/lib/resultados";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!haySesionChatGPT()) {
    return NextResponse.json(
      {
        error:
          "No hay sesión de ChatGPT. Corré `codex login` y elegí «Sign in with ChatGPT».",
      },
      { status: 400 },
    );
  }

  const cuerpo = (await request.json()) as {
    caso?: string;
    trabajo?: string;
    modelo?: string;
    esfuerzo?: string;
  };
  // "trabajo" es el nombre nuevo —un caso de prueba o un repo de GitHub—; "caso" sigue
  // andando para no romper nada que ya esté llamando a esta ruta.
  const caso = cuerpo.trabajo ?? cuerpo.caso ?? "";
  // Sin modelo se usa el de siempre; con uno que no está en la lista se corta acá,
  // para no correr —y facturarle a la suscripción— algo que nadie pidió.
  const modelo = cuerpo.modelo ? buscarModelo(cuerpo.modelo)?.id : MODELO_POR_DEFECTO;
  if (!modelo) {
    return NextResponse.json(
      {
        error:
          `El modelo "${cuerpo.modelo}" no está habilitado. ` +
          `Elegí uno de: ${MODELOS.map((m) => m.nombre).join(", ")}.`,
      },
      { status: 400 },
    );
  }

  // Y lo mismo con el esfuerzo de razonamiento: sin valor se usa el de siempre.
  const esfuerzo = cuerpo.esfuerzo
    ? buscarEsfuerzo(cuerpo.esfuerzo)?.id
    : ESFUERZO_POR_DEFECTO;
  if (!esfuerzo) {
    return NextResponse.json(
      {
        error:
          `El esfuerzo "${cuerpo.esfuerzo}" no está habilitado. ` +
          `Elegí uno de: ${ESFUERZOS.map((e) => e.id).join(", ")}.`,
      },
      { status: 400 },
    );
  }

  if (!existeTrabajo(caso)) {
    return NextResponse.json(
      { error: `No existe el trabajo "${caso}".` },
      { status: 404 },
    );
  }

  try {
    const resultado = await evaluarCaso(caso, modelo, esfuerzo);
    guardarResultado(resultado);
    return NextResponse.json({ id: resultado.id, nota: resultado.notaCalculada });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
