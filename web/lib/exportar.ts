import fs from "node:fs";
import path from "node:path";
import {
  brechas,
  pruebaDeSeparacion,
  pruebasDelCaso,
  resumirBrechas,
} from "./analisis";
import { hayNotaHumana, leerCalibracion } from "./calibracion";
import { fecha, puntos, conSigno } from "./formato";
import { listarCasos, rutaRepo } from "./repo";
import { ETIQUETA_NIVEL } from "./rubrica";
import { ultimoResultadoCompleto } from "./resultados";

const SIMBOLO = { ok: "✅", alerta: "⚠️", error: "❌", pendiente: "⏳" } as const;

/**
 * Escribe calibracion.md a partir de lo que ya está en el repo: las notas humanas
 * cargadas en la app y la última corrida de cada caso. La pieza 4 del parcial pide
 * exactamente esto —qué puso el agente, qué hubiéramos puesto nosotros, dónde no
 * coincidimos—, así que se genera del dato y no se transcribe a mano.
 */
export function generarCalibracionMd(): string {
  const casos = listarCasos();
  const ultimos = casos.map((caso) => ({
    caso: caso.id,
    resultado: ultimoResultadoCompleto(caso.id),
  }));

  const lineas: string[] = [
    "# Calibración",
    "",
    "Evidencia de que las notas del agente coinciden con el criterio del grupo sobre los tres",
    "casos de prueba. Este archivo lo genera la app del repo (`web/`) desde dos fuentes: las",
    "notas humanas cargadas en `calibracion/notas-humanas.json` y la última corrida guardada de",
    "cada caso en `resultados/`. No se edita a mano: se regenera para que nunca discrepe de la",
    "evidencia que lo respalda.",
    "",
    `Generado el ${fecha(new Date().toISOString())}`,
    "",
    "## Método",
    "",
    "1. Cada integrante puntúa los tres casos con la rúbrica de `rubrica.md`, nivel por dimensión (0 · 25 · 50 · 75 · 100 % del peso).",
    "2. Se corre el corrector sobre el mismo caso y se guarda la corrida completa en `resultados/`.",
    "3. Se comparan los dos niveles dimensión por dimensión. Coincidencia es caer en el mismo nivel, no acercarse.",
    "4. Cada desacuerdo se resuelve tocando la rúbrica o el contrato del agente, nunca la nota.",
    "",
    "## Prueba de los tres casos",
    "",
    "| Caso | Nota del agente | Qué se esperaba | Resultado |",
    "|---|---:|---|---|",
  ];

  for (const { caso, resultado } of ultimos) {
    const calibracion = leerCalibracion(caso);
    const pruebas = pruebasDelCaso(calibracion, resultado);
    lineas.push(
      `| ${caso} | ${resultado ? `${puntos(resultado.notaCalculada)}/100` : "—"} | ${calibracion.expectativa.proposito} | ${pruebas
        .map((p) => `${SIMBOLO[p.estado]} ${p.titulo} — ${p.detalle}`)
        .join("<br>")} |`,
    );
  }

  const separacion = pruebaDeSeparacion(ultimos);
  if (separacion) {
    lineas.push(
      "",
      `**Separación entre casos** — ${SIMBOLO[separacion.estado]} ${separacion.detalle}`,
    );
  }

  for (const { caso, resultado } of ultimos) {
    const calibracion = leerCalibracion(caso);
    lineas.push("", `## Caso \`${caso}\``, "");
    if (!hayNotaHumana(calibracion.humano)) {
      lineas.push(
        "Sin nota humana cargada todavía: la comparación de este caso está pendiente.",
      );
      continue;
    }
    const resumen = resumirBrechas(resultado, calibracion);
    lineas.push(
      `Nota del agente: **${resumen.notaAgente === null ? "—" : `${puntos(resumen.notaAgente)}/100`}** · Nota del grupo: **${resumen.notaHumana === null ? "—" : `${puntos(resumen.notaHumana)}/100`}**` +
        (resumen.delta === null ? "" : ` · Brecha: **${conSigno(resumen.delta)}**`),
      "",
      `Coinciden ${resumen.coincidencias} de ${resumen.evaluadas} dimensiones.`,
      "",
      "| Dimensión | Peso | Nivel del agente | Nivel del grupo | Brecha |",
      "|---|---:|---|---|---:|",
    );
    for (const brecha of resumirBrechasTabla(resultado, calibracion)) {
      lineas.push(brecha);
    }
    if (resumen.desacuerdos.length > 0) {
      lineas.push("", "**Desacuerdos**", "");
      for (const desacuerdo of resumen.desacuerdos) {
        const fila = resultado?.filas.find((f) => f.clave === desacuerdo.clave);
        lineas.push(
          `- **${desacuerdo.nombre}** — el agente puso ${desacuerdo.nivelAgente}% y el grupo ${desacuerdo.nivelHumano}%. ` +
            `Justificación del agente: ${fila?.justificacion || "—"}`,
        );
      }
    }
    if (calibracion.humano.comentario) {
      lineas.push("", "**Criterio del grupo**", "", calibracion.humano.comentario);
    }
  }

  lineas.push("");
  return lineas.join("\n");
}

function resumirBrechasTabla(
  resultado: ReturnType<typeof ultimoResultadoCompleto>,
  calibracion: ReturnType<typeof leerCalibracion>,
): string[] {
  return brechas(resultado, calibracion).map((b) => {
    const nivel = (n: number | null) =>
      n === null ? "—" : `${n}% — ${ETIQUETA_NIVEL[n] ?? "fuera de escala"}`;
    return `| ${b.nombre} | ${b.peso} | ${nivel(b.nivelAgente)} | ${nivel(b.nivelHumano)} | ${b.delta === null ? "—" : conSigno(b.delta)} |`;
  });
}

export function escribirCalibracionMd(): string {
  const contenido = generarCalibracionMd();
  const destino = path.join(rutaRepo(), "calibracion.md");
  fs.writeFileSync(destino, contenido, "utf8");
  return destino;
}
