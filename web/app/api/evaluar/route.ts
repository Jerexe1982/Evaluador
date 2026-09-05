import { NextResponse } from "next/server";
import { evaluarCaso, haySesionChatGPT } from "@/lib/evaluador";
import { buscarModelo, MODELO_POR_DEFECTO } from "@/lib/modelos";
import { existeCaso } from "@/lib/repo";
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

  const cuerpo = (await request.json()) as { caso?: string; modelo?: string };
  const caso = cuerpo.caso ?? "";
  const modelo = buscarModelo(cuerpo.modelo ?? "")?.id ?? MODELO_POR_DEFECTO;

  if (!existeCaso(caso)) {
    return NextResponse.json({ error: `No existe el caso "${caso}".` }, { status: 404 });
  }

  try {
    const resultado = await evaluarCaso(caso, modelo);
    guardarResultado(resultado);
    return NextResponse.json({ id: resultado.id, nota: resultado.notaCalculada });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
