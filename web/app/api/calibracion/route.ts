import { NextResponse } from "next/server";
import { guardarCalibracion } from "@/lib/calibracion";
import { escribirCalibracionMd } from "@/lib/exportar";
import { existeCaso } from "@/lib/repo";
import type { ClaveDimension } from "@/lib/tipos";

export const runtime = "nodejs";

/** Guarda la nota humana de un caso: es la mitad de la calibración que no corre el modelo. */
export async function POST(request: Request) {
  const cuerpo = (await request.json()) as {
    caso?: string;
    niveles?: Record<string, number>;
    comentario?: string;
  };
  const caso = cuerpo.caso ?? "";
  if (!existeCaso(caso)) {
    return NextResponse.json({ error: `No existe el caso "${caso}".` }, { status: 404 });
  }
  try {
    const humano = guardarCalibracion(
      caso,
      (cuerpo.niveles ?? {}) as Partial<Record<ClaveDimension, number>>,
      cuerpo.comentario ?? "",
    );
    return NextResponse.json({ humano });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

/** Regenera calibracion.md desde las notas humanas y la última corrida de cada caso. */
export async function PUT() {
  try {
    const destino = escribirCalibracionMd();
    return NextResponse.json({ archivo: destino });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
