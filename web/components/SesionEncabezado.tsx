import { BotonEntrar } from "@/components/BotonEntrar";
import type { Sesion } from "@/lib/credenciales";

function estado(sesion: Sesion): { texto: string; color: string; ayuda: string } {
  if (!sesion.activa) {
    return {
      texto: "Sin sesión de ChatGPT",
      color: "bg-mal",
      ayuda: "Sin sesión de ChatGPT no se puede correr el corrector.",
    };
  }
  if (sesion.vencida) {
    return {
      texto: "Sesión vencida",
      color: "bg-alerta",
      ayuda:
        "El token venció: la próxima corrida lo renueva sola. Si la renovación falla, entrá de nuevo desde acá.",
    };
  }
  return {
    texto: `Sesión activa${sesion.plan ? ` · plan ${sesion.plan}` : ""}`,
    color: "bg-ok",
    ayuda: "Hay sesión de ChatGPT: el corrector puede correr.",
  };
}

/**
 * El estado de la sesión en la barra, con el login siempre a mano: una sesión rota
 * —por ejemplo un refresh token que OpenAI ya dio de baja— se ve igual de «activa»
 * desde el archivo, así que el botón tiene que estar aunque haya sesión guardada.
 */
export function SesionEncabezado({ sesion }: { sesion: Sesion }) {
  const { texto, color, ayuda } = estado(sesion);

  return (
    <div className="flex items-center gap-3">
      <p
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tenue"
        title={ayuda}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
        {texto}
      </p>
      <BotonEntrar compacto />
    </div>
  );
}
