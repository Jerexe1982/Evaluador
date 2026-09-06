import { NextResponse } from "next/server";
import { cancelarLogin, estadoLogin, iniciarLogin } from "@/lib/login";

export const runtime = "nodejs";

/** Arranca el login con ChatGPT y devuelve la URL de OpenAI para abrir. */
export async function POST() {
  try {
    return NextResponse.json({ url: await iniciarLogin() });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo iniciar el login.";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

/** Lo consulta el botón mientras espera que el usuario termine en OpenAI. */
export async function GET() {
  return NextResponse.json(estadoLogin());
}

export async function DELETE() {
  cancelarLogin();
  return NextResponse.json({ ok: true });
}
